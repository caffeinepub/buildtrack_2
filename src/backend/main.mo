import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

import UserApproval "user-approval/approval";


actor {
  include MixinStorage();

  // Legacy type for migration from pre-v19 (no clientName/createdAt)
  type ProjectLegacy = {
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

  /// -- Project Types --

  type Project = {
    id : Nat;
    name : Text;
    clientName : Text;
    description : Text;
    location : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : ProjectStatus;
    budget : Float;
    stage : ProjectStage;
    estimatedDurationDays : Float;
    currentProgressPercentage : Float;
    createdAt : Time.Time;
  };

  type ProjectStatus = { #planning; #active; #completed; #onHold };

  type ProjectStage = {
    #planning;
    #foundation;
    #structure;
    #finishing;
    #completed;
  };

  /// --- Project Modules ---

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

  /// -- Daily Site Report Types --

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

  /// -- Material Types --

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

  /// -- Cost Entry Types --

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

  /// -- BOQ Types --

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

  /// -- Labour Types --

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

  /// -- Project Photo Types --

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

  /// --- User Types ---

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

  type UserProfile = {
    name : Text;
  };

  type UserLoginStatus = {
    lastLoginTime : Time.Time;
    isActive : Bool;
  };

  /// --- Stable Storage ---

  // "projects" keeps the old type to absorb pre-v19 stable data during upgrade
  let projects = Map.empty<Nat, ProjectLegacy>();
  // Runtime storage with new Project type (populated via postupgrade migration)
  let projectsStore = Map.empty<Nat, Project>();
  let reports = Map.empty<Nat, DailySiteReport>();
  let materials = Map.empty<Nat, Material>();
  let costs = Map.empty<Nat, CostEntry>();
  let boqItems = Map.empty<Nat, BoqItem>();
  let boqFiles = Map.empty<Nat, BoqFile>();
  let labourEntries = Map.empty<Nat, Labour>();
  let projectPhotos = Map.empty<Nat, ProjectPhoto>();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userLoginStatuses = Map.empty<Principal, UserLoginStatus>();

  // Dropped (but still needed for migration) persistent user maps
  let users = Map.empty<Nat, User>();
  let sessions = Map.empty<Nat, UserSession>();

  // ID counters
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

  /// --- Guards ---

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  include MixinAuthorization(accessControlState);

  // Helper function to check if user is approved (admins bypass approval)
  func requireApprovedUser(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      if (not UserApproval.isApproved(approvalState, caller)) {
        Runtime.trap("Unauthorized: User approval required");
      };
    };
  };

  /// --- Approval System (admin guard required) ---

  // Add admin guard to approval/invitation management function calls!
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (UserApproval.isApproved(approvalState, caller)) {
      Runtime.trap("User is already approved");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  /// Trivial invite admin function (TO REMOVE) (admin guard)
  // public shared ({ caller }) func inviteAdmin(_ : Principal) : async () {
  //   if (not AccessControl.isAdmin(caller, state)) {
  //     Runtime.trap("Unauthorized: Only admins can invite admins");
  //   };
  //   state.inviteAdmin(principal);
  // };

  /// --- User Active Tracking ---

  // Active user tracking - requires authentication but not approval (login/logout are basic auth features)
  public shared ({ caller }) func recordLogin() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    let currentTime = Time.now();
    userLoginStatuses.add(
      caller,
      {
        lastLoginTime = currentTime;
        isActive = true;
      },
    );
  };

  public shared ({ caller }) func recordLogout() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };
    switch (userLoginStatuses.get(caller)) {
      case (null) { Runtime.trap("Logout: No login status found for caller") };
      case (?status) {
        userLoginStatuses.add(
          caller,
          {
            lastLoginTime = status.lastLoginTime;
            isActive = false;
          },
        );
      };
    };
  };

  public query ({ caller }) func getActiveUsers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view active users");
    };
    userLoginStatuses.toArray().filter(
      func((principal, status)) {
        status.isActive;
      }
    ).map(func((principal, _status)) { principal });
  };

  /// --- User Profiles ---

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    requireApprovedUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      requireApprovedUser(caller);
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    requireApprovedUser(caller);
    userProfiles.add(caller, profile);
  };

  /// --- Projects ---

  // Projects - Admin and approved users can write, approved users can read
  public query ({ caller }) func getProjects() : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    requireApprovedUser(caller);
    projectsStore.values().toArray();
  };

  public query ({ caller }) func getProjectById(id : Nat) : async ?Project {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };
    requireApprovedUser(caller);
    projectsStore.get(id);
  };

  public shared ({ caller }) func createProject(project : Project) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };
    requireApprovedUser(caller);

    let projectId = nextProjectId;
    nextProjectId += 1;

    let newProject : Project = {
      id = projectId;
      name = project.name;
      clientName = project.clientName;
      description = project.description;
      location = project.location;
      startDate = project.startDate;
      endDate = project.endDate;
      status = project.status;
      budget = project.budget;
      stage = project.stage;
      estimatedDurationDays = project.estimatedDurationDays;
      currentProgressPercentage = project.currentProgressPercentage;
      createdAt = Time.now();
    };

    projectsStore.add(projectId, newProject);
    projectId;
  };

  public shared ({ caller }) func updateProject(id : Nat, updatedProject : Project) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };
    requireApprovedUser(caller);

    let existingProject = switch (projectsStore.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    let projectWithId = { updatedProject with id; createdAt = existingProject.createdAt };
    projectsStore.add(id, projectWithId);
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete projects");
    };

    switch (projectsStore.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?_) {
        projectsStore.remove(id);
      };
    };
  };

  /// --- Daily Site Reports ---

  // Daily Site Reports - approved users can write and read
  public query ({ caller }) func getReportsByProject(projectId : Nat) : async [DailySiteReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    requireApprovedUser(caller);
    reports.values().toArray().filter(
      func(r) { r.projectId == projectId }
    );
  };

  public shared ({ caller }) func createReport(report : DailySiteReport) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reports");
    };
    requireApprovedUser(caller);

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
    requireApprovedUser(caller);

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

  /// --- Materials ---

  // Materials - approved users can write and read
  public query ({ caller }) func getMaterialsByProject(projectId : Nat) : async [Material] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view materials");
    };
    requireApprovedUser(caller);
    materials.values().toArray().filter(
      func(m) { m.projectId == projectId }
    );
  };

  public shared ({ caller }) func addMaterial(material : Material) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add materials");
    };
    requireApprovedUser(caller);

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
    requireApprovedUser(caller);

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

  /// --- BOQ Items ---

  // BOQ Items - approved users can write and read
  public query ({ caller }) func getBoqItemsByProject(projectId : Nat) : async [BoqItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view BOQ items");
    };
    requireApprovedUser(caller);
    boqItems.values().toArray().filter(
      func(b) { b.projectId == projectId }
    );
  };

  public shared ({ caller }) func addBOQItem(item : BoqItem) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add BOQ items");
    };
    requireApprovedUser(caller);

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
    requireApprovedUser(caller);

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

  /// --- Labour ---

  // Labour - approved users can write and read
  public query ({ caller }) func getLabourByProject(projectId : Nat) : async [Labour] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labour entries");
    };
    requireApprovedUser(caller);
    labourEntries.values().toArray().filter(
      func(l) { l.projectId == projectId }
    );
  };

  public shared ({ caller }) func addLabour(labour : Labour) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add labour entries");
    };
    requireApprovedUser(caller);

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
    requireApprovedUser(caller);

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

  /// --- Cost Entries ---

  // Cost Entries - approved users can write and read
  public query ({ caller }) func getCostEntriesByProject(projectId : Nat) : async [CostEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cost entries");
    };
    requireApprovedUser(caller);
    costs.values().toArray().filter(
      func(c) { c.projectId == projectId }
    );
  };

  public shared ({ caller }) func addCostEntry(cost : CostEntry) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add cost entries");
    };
    requireApprovedUser(caller);

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
    requireApprovedUser(caller);

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

  /// --- Dashboard Stats ---

  // Dashboard Stats - Read access for approved users
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
    requireApprovedUser(caller);

    let allProjects = projectsStore.values().toArray();

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

  /// --- Project Cost Summaries ---

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
    requireApprovedUser(caller);

    let project = switch (projectsStore.get(projectId)) {
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
    requireApprovedUser(caller);

    projectsStore.map<Nat, Project, ProjectCostSummary>(
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

  /// --- Project Photos (by project or report) ---

  // New query to get photos by project id
  public query ({ caller }) func getProjectPhotosByProject(projectId : Nat) : async [ProjectPhoto] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view project photos");
    };
    requireApprovedUser(caller);
    projectPhotos.values().toArray().filter(
      func(p) { p.projectId == projectId }
    );
  };

  // New function to add photo
  public shared ({ caller }) func addProjectPhoto(photo : ProjectPhoto) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add project photos");
    };
    requireApprovedUser(caller);

    let photoId = nextPhotoId;
    nextPhotoId += 1;

    let newPhoto : ProjectPhoto = {
      id = photoId;
      projectId = photo.projectId;
      reportId = photo.reportId;
      imageUrl = photo.imageUrl;
      description = photo.description;
      dateUploaded = Time.now();
    };

    projectPhotos.add(photoId, newPhoto);
    photoId;
  };

  /// Deletes a project photo by id
  /// #user permission required (any authenticated user)
  public shared ({ caller }) func deleteProjectPhoto(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User authentication required");
    };
    requireApprovedUser(caller);

    switch (projectPhotos.get(id)) {
      case (null) { Runtime.trap("Project photo not found") };
      case (?_) {
        projectPhotos.remove(id);
      };
    };
  };

  /// --- Legacy Pre-v19 Project Migration (no clientName, no createdAt) ---
  system func postupgrade() {
    // Migrate legacy projects (pre-v19, missing clientName/createdAt) into projectsStore
    for (old in projects.values()) {
      switch (projectsStore.get(old.id)) {
        case null {
          projectsStore.add(old.id, {
            id = old.id;
            name = old.name;
            clientName = "";
            description = old.description;
            location = old.location;
            startDate = old.startDate;
            endDate = old.endDate;
            status = old.status;
            budget = old.budget;
            stage = old.stage;
            estimatedDurationDays = old.estimatedDurationDays;
            currentProgressPercentage = old.currentProgressPercentage;
            createdAt = 0;
          });
          if (old.id >= nextProjectId) {
            nextProjectId := old.id + 1;
          };
        };
        case _ {};
      };
    };
  };

};
