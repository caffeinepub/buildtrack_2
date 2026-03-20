import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



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
    estimatedDurationDays : Float;
    currentProgressPercentage : Float;
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
    description : Text;
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

  type BoqFile = {
    id : Nat;
    projectId : Nat;
    fileUrl : Storage.ExternalBlob;
    uploadDate : Time.Time;
  };

  module BoqFile {
    public func compare(boqFile1 : BoqFile, boqFile2 : BoqFile) : Order.Order {
      Int.compare(boqFile1.id, boqFile2.id);
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

  type UserRole = {
    #admin;
    #projectManager;
    #siteEngineer;
    #quantitySurveyor;
    #storeManager;
    #viewer;
  };

  type User = {
    id : Nat;
    fullName : Text;
    email : Text;
    passwordHash : Text;
    role : UserRole;
    isActive : Bool;
    createdAt : Time.Time;
  };

  type UserSession = {
    id : Nat;
    userId : Nat;
    tokenHash : Text;
    createdAt : Time.Time;
    expiresAt : Time.Time;
  };

  let projects = Map.empty<Nat, Project>();
  let reports = Map.empty<Nat, DailySiteReport>();
  let materials = Map.empty<Nat, Material>();
  let costs = Map.empty<Nat, CostEntry>();
  let boqItems = Map.empty<Nat, BoqItem>();
  let boqFiles = Map.empty<Nat, BoqFile>();
  let labourEntries = Map.empty<Nat, Labour>();
  let projectPhotos = Map.empty<Nat, ProjectPhoto>();

  let users = Map.empty<Nat, User>();
  let sessions = Map.empty<Nat, UserSession>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextProjectId = 1;
  var nextReportId = 1;
  var nextMaterialId = 1;
  var nextCostId = 1;
  var nextBoqItemId = 1;
  var nextBoqFileId = 1;
  var nextLabourId = 1;
  var nextPhotoId = 1;
  var nextUserId = 1;
  var nextSessionId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

  // Projects - Admin and ProjectManager can write, authenticated users can read
  public query ({ caller }) func getProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.values().toArray();
  };

  public query ({ caller }) func getProjectById(id : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    projects.get(id);
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
      estimatedDurationDays = project.estimatedDurationDays;
      currentProgressPercentage = project.currentProgressPercentage;
    };

    projects.add(projectId, newProject);
    projectId;
  };

  public shared ({ caller }) func updateProject(id : Nat, updatedProject : Project) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };

    let existingProject = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let projectWithId = { updatedProject with id };
    projects.add(id, projectWithId);
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete projects");
    };

    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?_) {
        projects.remove(id);
      };
    };
  };

  // Daily Site Reports - SiteEngineer can write, authenticated users can read
  public query ({ caller }) func getReportsByProject(projectId : Nat) : async [DailySiteReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    reports.values().toArray().filter(
      func(r) { r.projectId == projectId }
    );
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete reports");
    };

    switch (reports.get(id)) {
      case (null) { Runtime.trap("Report not found") };
      case (?_) {
        reports.remove(id);
      };
    };
  };

  // Materials - StoreManager can write, authenticated users can read
  public query ({ caller }) func getMaterialsByProject(projectId : Nat) : async [Material] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );
  };

  public shared ({ caller }) func addMaterial(material : Material) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add materials");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete materials");
    };

    switch (materials.get(id)) {
      case (null) { Runtime.trap("Material not found") };
      case (?_) {
        materials.remove(id);
      };
    };
  };

  // BOQ Items - QuantitySurveyor can write, authenticated users can read
  public query ({ caller }) func getBoqItemsByProject(projectId : Nat) : async [BoqItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view BOQ items");
    };
    boqItems.values().toArray().filter(
      func(b) { b.projectId == projectId }
    );
  };

  public shared ({ caller }) func addBOQItem(item : BoqItem) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add BOQ items");
    };

    let itemId = nextBoqItemId;
    nextBoqItemId += 1;

    let newItem : BoqItem = {
      id = itemId;
      projectId = item.projectId;
      itemName = item.itemName;
      description = item.description;
      unit = item.unit;
      plannedQuantity = item.plannedQuantity;
      unitRate = item.unitRate;
      usedQuantity = item.usedQuantity;
    };

    boqItems.add(itemId, newItem);
    itemId;
  };

  public shared ({ caller }) func updateBOQItem(item : BoqItem) : async () {
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

  public shared ({ caller }) func deleteBOQItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete BOQ items");
    };

    switch (boqItems.get(id)) {
      case (null) { Runtime.trap("BOQ item not found") };
      case (?_) {
        boqItems.remove(id);
      };
    };
  };

  // Labour - ProjectManager can write, authenticated users can read
  public query ({ caller }) func getLabourByProject(projectId : Nat) : async [Labour] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labour entries");
    };
    labourEntries.values().toArray().filter(
      func(l) { l.projectId == projectId }
    );
  };

  public shared ({ caller }) func addLabour(labour : Labour) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add labour entries");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete labour entries");
    };

    switch (labourEntries.get(id)) {
      case (null) { Runtime.trap("Labour entry not found") };
      case (?_) {
        labourEntries.remove(id);
      };
    };
  };

  // Cost Entries - ProjectManager and QuantitySurveyor can write, authenticated users can read
  public query ({ caller }) func getCostEntriesByProject(projectId : Nat) : async [CostEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost entries");
    };
    costs.values().toArray().filter(
      func(c) { c.projectId == projectId }
    );
  };

  public shared ({ caller }) func addCostEntry(cost : CostEntry) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add cost entries");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete cost entries");
    };

    switch (costs.get(id)) {
      case (null) { Runtime.trap("Cost entry not found") };
      case (?_) {
        costs.remove(id);
      };
    };
  };

  // Dashboard Stats - Read access for authenticated users
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
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
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

  // New Cost Summary Type
  type ProjectCostSummary = {
    projectId : Nat;
    projectName : Text;
    budget : Float;
    materialsCost : Float;
    labourCost : Float;
    totalSpent : Float;
    remainingBudget : Float;
    budgetPct : Float;
    status : ProjectStatus;
  };

  // New query to get project cost summary by projectId
  public query ({ caller }) func getProjectCostSummary(projectId : Nat) : async ?ProjectCostSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost summaries");
    };

    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let materialsCost = materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    ).foldLeft(
      0.0,
      func(acc, m) { acc + (m.quantity * m.unitCost) },
    );

    let labourCost = labourEntries.values().toArray().filter(
      func(l) { l.projectId == projectId }
    ).foldLeft(
      0.0,
      func(acc, l) { acc + (l.dailyWage * l.daysWorked) },
    );

    let totalSpent = materialsCost + labourCost;
    let remainingBudget = project.budget - totalSpent;
    let budgetPct = if (project.budget == 0.0) { 0.0 } else { (totalSpent / project.budget) * 100.0 };

    ?{
      projectId;
      projectName = project.name;
      budget = project.budget;
      materialsCost;
      labourCost;
      totalSpent;
      remainingBudget;
      budgetPct;
      status = project.status;
    };
  };

  // New query to get cost summaries for all projects
  public query ({ caller }) func getAllProjectCostSummaries() : async [ProjectCostSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost summaries");
    };

    projects.map<Nat, Project, ProjectCostSummary>(
      func(_id, project) {
        let materialsCost = materials.values().toArray().filter(
          func(m) { m.projectId == project.id }
        ).foldLeft(
          0.0,
          func(acc, m) { acc + (m.quantity * m.unitCost) },
        );

        let labourCost = labourEntries.values().toArray().filter(
          func(l) { l.projectId == project.id }
        ).foldLeft(
          0.0,
          func(acc, l) { acc + (l.dailyWage * l.daysWorked) },
        );

        let totalSpent = materialsCost + labourCost;
        let remainingBudget = project.budget - totalSpent;
        let budgetPct = if (project.budget == 0.0) { 0.0 } else { (totalSpent / project.budget) * 100.0 };

        {
          projectId = project.id;
          projectName = project.name;
          budget = project.budget;
          materialsCost;
          labourCost;
          totalSpent;
          remainingBudget;
          budgetPct;
          status = project.status;
        };
      }
    ).values().toArray();
  };
};
