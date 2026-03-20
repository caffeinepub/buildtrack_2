import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Migration "migration";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  include MixinStorage();

  type Project = {
    id : Nat;
    name : Text;
    description : Text;
    location : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : ProjectStatus;
    budget : Float;
    stage : ProjectStage;
  };

  type ProjectStatus = { #planning; #active; #completed; #onHold };

  type ProjectStage = {
    #planning;
    #foundation;
    #structure;
    #finishing;
    #completed;
  };

  module ProjectStatus {
    public func compare(a : ProjectStatus, b : ProjectStatus) : Order.Order {
      switch (a, b) {
        case (#planning, #planning) { #equal };
        case (#planning, _) { #less };
        case (#active, #planning) { #greater };
        case (#active, #active) { #equal };
        case (#active, _) { #less };
        case (#completed, #onHold) { #less };
        case (#completed, #completed) { #equal };
        case (#completed, _) { #greater };
        case (#onHold, #onHold) { #equal };
        case (#onHold, _) { #greater };
      };
    };
  };

  module ProjectStage {
    public func compare(a : ProjectStage, b : ProjectStage) : Order.Order {
      switch (a, b) {
        case (#planning, #planning) { #equal };
        case (#planning, _) { #less };
        case (#foundation, #planning) { #greater };
        case (#foundation, #foundation) { #equal };
        case (#foundation, _) { #less };
        case (#structure, #planning) { #greater };
        case (#structure, #foundation) { #greater };
        case (#structure, #structure) { #equal };
        case (#structure, _) { #less };
        case (#finishing, #completed) { #less };
        case (#finishing, #finishing) { #equal };
        case (#finishing, _) { #greater };
        case (#completed, #completed) { #equal };
        case (#completed, _) { #greater };
      };
    };
  };

  module Project {
    public func compare(project1 : Project, project2 : Project) : Order.Order {
      Int.compare(project1.id, project2.id);
    };

    public func compareByStatus(project1 : Project, project2 : Project) : Order.Order {
      ProjectStatus.compare(project1.status, project2.status);
    };
  };

  type DailySiteReport = {
    id : Nat;
    projectId : Nat;
    date : Time.Time;
    weather : Text;
    workersOnSite : Nat;
    hoursWorked : Float;
    activities : Text;
    notes : Text;
  };

  module DailySiteReport {
    public func compare(report1 : DailySiteReport, report2 : DailySiteReport) : Order.Order {
      Int.compare(report1.id, report2.id);
    };
  };

  type Material = {
    id : Nat;
    projectId : Nat;
    name : Text;
    unit : Text;
    quantity : Float;
    unitCost : Float;
    supplier : Text;
  };

  module Material {
    public func compare(material1 : Material, material2 : Material) : Order.Order {
      Int.compare(material1.id, material2.id);
    };
  };

  type CostEntry = {
    id : Nat;
    projectId : Nat;
    category : Text;
    description : Text;
    amount : Float;
    date : Time.Time;
  };

  module CostEntry {
    public func compare(entry1 : CostEntry, entry2 : CostEntry) : Order.Order {
      Int.compare(entry1.id, entry2.id);
    };
  };

  type BoqItem = {
    id : Nat;
    projectId : Nat;
    itemName : Text;
    unit : Text;
    plannedQuantity : Float;
    unitRate : Float;
    usedQuantity : Float;
  };

  module BoqItem {
    public func compare(item1 : BoqItem, item2 : BoqItem) : Order.Order {
      Int.compare(item1.id, item2.id);
    };
  };

  type Labour = {
    id : Nat;
    projectId : Nat;
    workerName : Text;
    role : Text;
    dailyWage : Float;
    daysWorked : Float;
  };

  module Labour {
    public func compare(labour1 : Labour, labour2 : Labour) : Order.Order {
      Int.compare(labour1.id, labour2.id);
    };
  };

  type ProjectPhoto = {
    id : Nat;
    projectId : Nat;
    reportId : Nat;
    imageUrl : Storage.ExternalBlob;
    dateUploaded : Time.Time;
    description : Text;
  };

  module ProjectPhoto {
    public func compareByDate(photo1 : ProjectPhoto, photo2 : ProjectPhoto) : Order.Order {
      if (photo1.dateUploaded < photo2.dateUploaded) { #less } else if (photo1.dateUploaded > photo2.dateUploaded) {
        #greater;
      } else { #equal };
    };
  };

  let projects = Map.empty<Nat, Project>();
  let reports = Map.empty<Nat, DailySiteReport>();
  let materials = Map.empty<Nat, Material>();
  let costs = Map.empty<Nat, CostEntry>();
  let boqItems = Map.empty<Nat, BoqItem>();
  let labourEntries = Map.empty<Nat, Labour>();
  let projectPhotos = Map.empty<Nat, ProjectPhoto>();

  var nextProjectId = 1;
  var nextReportId = 1;
  var nextMaterialId = 1;
  var nextCostId = 1;
  var nextBoqItemId = 1;
  var nextLabourId = 1;
  var nextPhotoId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addProjectPhoto(photo : ProjectPhoto) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add photos");
    };

    let photoId = nextPhotoId;
    nextPhotoId += 1;

    let newPhoto = { photo with id = photoId };
    projectPhotos.add(photoId, newPhoto);
    photoId;
  };

  public query ({ caller }) func getPhotosByProject(projectId : Nat) : async [ProjectPhoto] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view photos");
    };

    let filtered = projectPhotos.values().toArray().filter(
      func(p) { p.projectId == projectId }
    );

    filtered.sort(
      ProjectPhoto.compareByDate
    );
  };

  public shared ({ caller }) func deleteProjectPhoto(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete photos");
    };
    switch (projectPhotos.get(id)) {
      case (null) { Runtime.trap("Photo not found") };
      case (?_) {
        projectPhotos.remove(id);
      };
    };
  };

  public shared ({ caller }) func createProject(project : Project) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };

    let projectId = nextProjectId;
    nextProjectId += 1;

    let newProject : Project = {
      id = projectId;
      name = project.name;
      description = project.description;
      location = project.location;
      startDate = project.startDate;
      endDate = project.endDate;
      status = project.status;
      budget = project.budget;
      stage = #planning;
    };

    projects.add(projectId, newProject);
    projectId;
  };

  public query ({ caller }) func getProject(id : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.get(id);
  };

  public shared ({ caller }) func updateProject(project : Project) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };

    switch (projects.get(project.id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?_) {
        projects.add(project.id, project);
      };
    };
  };

  public shared ({ caller }) func updateProjectStage(id : Nat, stage : ProjectStage) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update project stage");
    };

    let project = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let updatedProject = { project with stage };
    projects.add(id, updatedProject);
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };

    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?_) {
        projects.remove(id);
      };
    };
  };

  public query ({ caller }) func getProjectsByStatus(status : ProjectStatus) : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.values().toArray().filter(
      func(p) { p.status == status }
    );
  };

  public query ({ caller }) func getProjectsByStage(stage : ProjectStage) : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.values().toArray().filter(
      func(p) { p.stage == stage }
    );
  };

  public query ({ caller }) func getAllProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.values().toArray();
  };

  public shared ({ caller }) func createReport(report : DailySiteReport) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reports");
    };

    let reportId = nextReportId;
    nextReportId += 1;

    let newReport : DailySiteReport = {
      id = reportId;
      projectId = report.projectId;
      date = report.date;
      weather = report.weather;
      workersOnSite = report.workersOnSite;
      hoursWorked = report.hoursWorked;
      activities = report.activities;
      notes = report.notes;
    };

    reports.add(reportId, newReport);
    reportId;
  };

  public query ({ caller }) func getReport(id : Nat) : async ?DailySiteReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    reports.get(id);
  };

  public shared ({ caller }) func updateReport(report : DailySiteReport) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update reports");
    };

    switch (reports.get(report.id)) {
      case (null) { Runtime.trap("Report not found") };
      case (?_) {
        reports.add(report.id, report);
      };
    };
  };

  public shared ({ caller }) func deleteReport(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete reports");
    };

    switch (reports.get(id)) {
      case (null) { Runtime.trap("Report not found") };
      case (?_) {
        reports.remove(id);
      };
    };
  };

  public query ({ caller }) func getReportsByProject(projectId : Nat) : async [DailySiteReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    reports.values().toArray().filter(
      func(r) { r.projectId == projectId }
    );
  };

  public shared ({ caller }) func createMaterial(material : Material) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create materials");
    };

    let materialId = nextMaterialId;
    nextMaterialId += 1;

    let newMaterial : Material = {
      id = materialId;
      projectId = material.projectId;
      name = material.name;
      unit = material.unit;
      quantity = material.quantity;
      unitCost = material.unitCost;
      supplier = material.supplier;
    };

    materials.add(materialId, newMaterial);
    materialId;
  };

  public query ({ caller }) func getMaterial(id : Nat) : async ?Material {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    materials.get(id);
  };

  public shared ({ caller }) func updateMaterial(material : Material) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update materials");
    };

    switch (materials.get(material.id)) {
      case (null) { Runtime.trap("Material not found") };
      case (?_) {
        materials.add(material.id, material);
      };
    };
  };

  public shared ({ caller }) func deleteMaterial(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete materials");
    };

    switch (materials.get(id)) {
      case (null) { Runtime.trap("Material not found") };
      case (?_) {
        materials.remove(id);
      };
    };
  };

  public query ({ caller }) func getMaterialsByProject(projectId : Nat) : async [Material] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );
  };

  public shared ({ caller }) func createCostEntry(cost : CostEntry) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cost entries");
    };

    let costId = nextCostId;
    nextCostId += 1;

    let newCost : CostEntry = {
      id = costId;
      projectId = cost.projectId;
      category = cost.category;
      description = cost.description;
      amount = cost.amount;
      date = cost.date;
    };

    costs.add(costId, newCost);
    costId;
  };

  public query ({ caller }) func getCostEntry(id : Nat) : async ?CostEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost entries");
    };
    costs.get(id);
  };

  public shared ({ caller }) func updateCostEntry(cost : CostEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cost entries");
    };

    switch (costs.get(cost.id)) {
      case (null) { Runtime.trap("Cost entry not found") };
      case (?_) {
        costs.add(cost.id, cost);
      };
    };
  };

  public shared ({ caller }) func deleteCostEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cost entries");
    };

    switch (costs.get(id)) {
      case (null) { Runtime.trap("Cost entry not found") };
      case (?_) {
        costs.remove(id);
      };
    };
  };

  public query ({ caller }) func getCostsByProject(projectId : Nat) : async [CostEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost entries");
    };
    costs.values().toArray().filter(
      func(c) { c.projectId == projectId }
    );
  };

  public shared ({ caller }) func createBoqItem(item : BoqItem) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create BOQ items");
    };

    let itemId = nextBoqItemId;
    nextBoqItemId += 1;

    let newItem : BoqItem = {
      id = itemId;
      projectId = item.projectId;
      itemName = item.itemName;
      unit = item.unit;
      plannedQuantity = item.plannedQuantity;
      unitRate = item.unitRate;
      usedQuantity = item.usedQuantity;
    };

    boqItems.add(itemId, newItem);
    itemId;
  };

  public query ({ caller }) func getBoqItem(id : Nat) : async ?BoqItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view BOQ items");
    };
    boqItems.get(id);
  };

  public shared ({ caller }) func updateBoqItem(item : BoqItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update BOQ items");
    };

    switch (boqItems.get(item.id)) {
      case (null) { Runtime.trap("BOQ item not found") };
      case (?_) {
        boqItems.add(item.id, item);
      };
    };
  };

  public shared ({ caller }) func deleteBoqItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete BOQ items");
    };

    switch (boqItems.get(id)) {
      case (null) { Runtime.trap("BOQ item not found") };
      case (?_) {
        boqItems.remove(id);
      };
    };
  };

  public query ({ caller }) func getBoqItemsByProject(projectId : Nat) : async [BoqItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view BOQ items");
    };
    boqItems.values().toArray().filter(
      func(b) { b.projectId == projectId }
    );
  };

  public shared ({ caller }) func createLabour(labour : Labour) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create labour entries");
    };

    let labourId = nextLabourId;
    nextLabourId += 1;

    let newLabour : Labour = {
      id = labourId;
      projectId = labour.projectId;
      workerName = labour.workerName;
      role = labour.role;
      dailyWage = labour.dailyWage;
      daysWorked = labour.daysWorked;
    };

    labourEntries.add(labourId, newLabour);
    labourId;
  };

  public query ({ caller }) func getLabour(id : Nat) : async ?Labour {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labour entries");
    };
    labourEntries.get(id);
  };

  public shared ({ caller }) func updateLabour(labour : Labour) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update labour entries");
    };

    switch (labourEntries.get(labour.id)) {
      case (null) { Runtime.trap("Labour entry not found") };
      case (?_) {
        labourEntries.add(labour.id, labour);
      };
    };
  };

  public shared ({ caller }) func deleteLabour(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete labour entries");
    };

    switch (labourEntries.get(id)) {
      case (null) { Runtime.trap("Labour entry not found") };
      case (?_) {
        labourEntries.remove(id);
      };
    };
  };

  public query ({ caller }) func getLabourByProject(projectId : Nat) : async [Labour] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labour entries");
    };
    labourEntries.values().toArray().filter(
      func(l) { l.projectId == projectId }
    );
  };

  public query ({ caller }) func getProjectSummary(projectId : Nat) : async {
    totalMaterialCost : Float;
    totalLabourCost : Float;
    totalCostEntries : Float;
    totalSpent : Float;
    budget : Float;
    variance : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view project summaries");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let projectMaterials = materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );

    let projectLabour = labourEntries.values().toArray().filter(
      func(l) { l.projectId == projectId }
    );

    let projectCosts = costs.values().toArray().filter(
      func(c) { c.projectId == projectId }
    );

    let totalMaterialCost = projectMaterials.foldLeft(
      0.0,
      func(acc, m) { acc + (m.quantity * m.unitCost) },
    );

    let totalLabourCost = projectLabour.foldLeft(
      0.0,
      func(acc, l) { acc + (l.dailyWage * l.daysWorked) },
    );

    let totalCostEntries = projectCosts.foldLeft(
      0.0,
      func(acc, c) { acc + c.amount },
    );

    let totalSpent = totalMaterialCost + totalLabourCost + totalCostEntries;
    let variance = project.budget - totalSpent;

    {
      totalMaterialCost;
      totalLabourCost;
      totalCostEntries;
      totalSpent;
      budget = project.budget;
      variance;
    };
  };

  public query ({ caller }) func getCostControlByProject(projectId : Nat) : async {
    projectBudget : Float;
    materialsCost : Float;
    labourCost : Float;
    totalSpent : Float;
    remainingBudget : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost control data");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let projectMaterials = materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );

    let projectLabour = labourEntries.values().toArray().filter(
      func(l) { l.projectId == projectId }
    );

    let totalMaterialCost = projectMaterials.foldLeft(
      0.0,
      func(acc, m) { acc + (m.quantity * m.unitCost) },
    );

    let totalLabourCost = projectLabour.foldLeft(
      0.0,
      func(acc, l) { acc + (l.dailyWage * l.daysWorked) },
    );

    let totalSpent = totalMaterialCost + totalLabourCost;
    let remainingBudget = project.budget - totalSpent;

    {
      projectBudget = project.budget;
      materialsCost = totalMaterialCost;
      labourCost = totalLabourCost;
      totalSpent;
      remainingBudget;
    };
  };

  public query ({ caller }) func getDashboardStats() : async {
    planningCount : Nat;
    activeCount : Nat;
    completedCount : Nat;
    onHoldCount : Nat;
    foundationCount : Nat;
    structureCount : Nat;
    finishingCount : Nat;
    totalBudget : Float;
    totalSpent : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard statistics");
    };

    let allProjects = projects.values().toArray();

    let planningCount = allProjects.filter(func(p) { p.status == #planning }).size();
    let activeCount = allProjects.filter(func(p) { p.status == #active }).size();
    let completedCount = allProjects.filter(func(p) { p.status == #completed }).size();
    let onHoldCount = allProjects.filter(func(p) { p.status == #onHold }).size();
    let foundationCount = allProjects.filter(func(p) { p.stage == #foundation }).size();
    let structureCount = allProjects.filter(func(p) { p.stage == #structure }).size();
    let finishingCount = allProjects.filter(func(p) { p.stage == #finishing }).size();

    let totalBudget = allProjects.foldLeft(
      0.0,
      func(acc, p) { acc + p.budget },
    );

    let allMaterials = materials.values().toArray();
    let totalMaterialCost = allMaterials.foldLeft(
      0.0,
      func(acc, m) { acc + (m.quantity * m.unitCost) },
    );

    let allLabour = labourEntries.values().toArray();
    let totalLabourCost = allLabour.foldLeft(
      0.0,
      func(acc, l) { acc + (l.dailyWage * l.daysWorked) },
    );

    let allCosts = costs.values().toArray();
    let totalCostEntries = allCosts.foldLeft(
      0.0,
      func(acc, c) { acc + c.amount },
    );

    let totalSpent = totalMaterialCost + totalLabourCost + totalCostEntries;

    {
      planningCount;
      activeCount;
      completedCount;
      onHoldCount;
      foundationCount;
      structureCount;
      finishingCount;
      totalBudget;
      totalSpent;
    };
  };
};
