import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type Project = {
    id : Nat;
    name : Text;
    description : Text;
    location : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : ProjectStatus;
    budget : Float;
  };

  type ProjectStatus = { #planning; #active; #completed; #onHold };

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

  let projects = Map.empty<Nat, Project>();
  let reports = Map.empty<Nat, DailySiteReport>();
  let materials = Map.empty<Nat, Material>();
  let costs = Map.empty<Nat, CostEntry>();

  var nextProjectId = 1;
  var nextReportId = 1;
  var nextMaterialId = 1;
  var nextCostId = 1;

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

  // Project operations
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
    };

    projects.add(projectId, newProject);
    projectId;
  };

  public query ({ caller }) func getProject(id : Nat) : async ?Project {
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
    projects.values().toArray().filter(
      func(p) { p.status == status }
    );
  };

  // DailySiteReport operations
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
    reports.values().toArray().filter(
      func(r) { r.projectId == projectId }
    );
  };

  // Material operations
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
    materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );
  };

  // CostEntry operations
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
    costs.values().toArray().filter(
      func(c) { c.projectId == projectId }
    );
  };

  public query ({ caller }) func getProjectSummary(projectId : Nat) : async {
    totalMaterialCost : Float;
    totalCostEntries : Float;
    totalSpent : Float;
    budget : Float;
    variance : Float;
  } {
    let project = switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let projectMaterials = materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );

    let projectCosts = costs.values().toArray().filter(
      func(c) { c.projectId == projectId }
    );

    let totalMaterialCost = projectMaterials.foldLeft(
      0.0,
      func(acc, m) { acc + (m.quantity * m.unitCost) },
    );

    let totalCostEntries = projectCosts.foldLeft(
      0.0,
      func(acc, c) { acc + c.amount },
    );

    let totalSpent = totalMaterialCost + totalCostEntries;
    let variance = project.budget - totalSpent;

    {
      totalMaterialCost;
      totalCostEntries;
      totalSpent;
      budget = project.budget;
      variance;
    };
  };

  public query ({ caller }) func getDashboardStats() : async {
    planningCount : Nat;
    activeCount : Nat;
    completedCount : Nat;
    onHoldCount : Nat;
    totalBudget : Float;
    totalSpent : Float;
  } {
    let allProjects = projects.values().toArray();
    
    let planningCount = allProjects.filter(func(p) { p.status == #planning }).size();
    let activeCount = allProjects.filter(func(p) { p.status == #active }).size();
    let completedCount = allProjects.filter(func(p) { p.status == #completed }).size();
    let onHoldCount = allProjects.filter(func(p) { p.status == #onHold }).size();

    let totalBudget = allProjects.foldLeft(
      0.0,
      func(acc, p) { acc + p.budget },
    );

    let allMaterials = materials.values().toArray();
    let totalMaterialCost = allMaterials.foldLeft(
      0.0,
      func(acc, m) { acc + (m.quantity * m.unitCost) },
    );

    let allCosts = costs.values().toArray();
    let totalCostEntries = allCosts.foldLeft(
      0.0,
      func(acc, c) { acc + c.amount },
    );

    let totalSpent = totalMaterialCost + totalCostEntries;

    {
      planningCount;
      activeCount;
      completedCount;
      onHoldCount;
      totalBudget;
      totalSpent;
    };
  };
};
