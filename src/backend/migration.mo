import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    projects : Map.Map<Nat, { id : Nat; name : Text; description : Text; location : Text; startDate : Time.Time; endDate : Time.Time; status : { #planning; #active; #completed; #onHold }; budget : Float; stage : { #planning; #foundation; #structure; #finishing; #completed }; estimatedDurationDays : Float; currentProgressPercentage : Float }>;
    projectsStore : Map.Map<Nat, { id : Nat; name : Text; clientName : Text; description : Text; location : Text; startDate : Time.Time; endDate : Time.Time; status : { #planning; #active; #completed; #onHold }; budget : Float; stage : { #planning; #foundation; #structure; #finishing; #completed }; estimatedDurationDays : Float; currentProgressPercentage : Float; createdAt : Time.Time }>;
    reports : Map.Map<Nat, { id : Nat; projectId : Nat; date : Time.Time; weather : Text; workersOnSite : Nat; hoursWorked : Float; activities : Text; notes : Text }>;
    materials : Map.Map<Nat, { id : Nat; projectId : Nat; name : Text; unit : Text; quantity : Float; unitCost : Float; supplier : Text }>;
    costs : Map.Map<Nat, { id : Nat; projectId : Nat; category : Text; description : Text; amount : Float; date : Time.Time }>;
    boqItems : Map.Map<Nat, { id : Nat; projectId : Nat; itemName : Text; description : Text; unit : Text; plannedQuantity : Float; unitRate : Float; usedQuantity : Float }>;
    boqFiles : Map.Map<Nat, { id : Nat; projectId : Nat; fileUrl : Storage.ExternalBlob; uploadDate : Time.Time }>;
    labourEntries : Map.Map<Nat, { id : Nat; projectId : Nat; workerName : Text; role : Text; dailyWage : Float; daysWorked : Float }>;
    projectPhotos : Map.Map<Nat, { id : Nat; projectId : Nat; reportId : Nat; imageUrl : Storage.ExternalBlob; dateUploaded : Time.Time; description : Text }>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    users : Map.Map<Nat, { id : Nat; fullName : Text; email : Text; passwordHash : Text; role : { #admin; #projectManager; #siteEngineer; #quantitySurveyor; #storeManager; #viewer }; isActive : Bool; createdAt : Time.Time }>;
    sessions : Map.Map<Nat, { id : Nat; userId : Nat; tokenHash : Text; createdAt : Time.Time; expiresAt : Time.Time }>;
    nextProjectId : Nat;
    nextReportId : Nat;
    nextMaterialId : Nat;
    nextCostId : Nat;
    nextBoqItemId : Nat;
    nextBoqFileId : Nat;
    nextLabourId : Nat;
    nextPhotoId : Nat;
    nextUserId : Nat;
    nextSessionId : Nat;
  };

  type NewActor = {
    projects : Map.Map<Nat, { id : Nat; name : Text; description : Text; location : Text; startDate : Time.Time; endDate : Time.Time; status : { #planning; #active; #completed; #onHold }; budget : Float; stage : { #planning; #foundation; #structure; #finishing; #completed }; estimatedDurationDays : Float; currentProgressPercentage : Float }>;
    projectsStore : Map.Map<Nat, { id : Nat; name : Text; clientName : Text; description : Text; location : Text; startDate : Time.Time; endDate : Time.Time; status : { #planning; #active; #completed; #onHold }; budget : Float; stage : { #planning; #foundation; #structure; #finishing; #completed }; estimatedDurationDays : Float; currentProgressPercentage : Float; createdAt : Time.Time }>;
    reports : Map.Map<Nat, { id : Nat; projectId : Nat; date : Time.Time; weather : Text; workersOnSite : Nat; hoursWorked : Float; activities : Text; notes : Text }>;
    materials : Map.Map<Nat, { id : Nat; projectId : Nat; name : Text; unit : Text; quantity : Float; unitCost : Float; supplier : Text }>;
    costs : Map.Map<Nat, { id : Nat; projectId : Nat; category : Text; description : Text; amount : Float; date : Time.Time }>;
    boqItems : Map.Map<Nat, { id : Nat; projectId : Nat; itemName : Text; description : Text; unit : Text; plannedQuantity : Float; unitRate : Float; usedQuantity : Float }>;
    boqFiles : Map.Map<Nat, { id : Nat; projectId : Nat; fileUrl : Storage.ExternalBlob; uploadDate : Time.Time }>;
    labourEntries : Map.Map<Nat, { id : Nat; projectId : Nat; workerName : Text; role : Text; dailyWage : Float; daysWorked : Float }>;
    projectPhotos : Map.Map<Nat, { id : Nat; projectId : Nat; reportId : Nat; imageUrl : Storage.ExternalBlob; dateUploaded : Time.Time; description : Text }>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    userLoginStatuses : Map.Map<Principal, { lastLoginTime : Time.Time; isActive : Bool }>;
    users : Map.Map<Nat, { id : Nat; fullName : Text; email : Text; passwordHash : Text; role : { #admin; #projectManager; #siteEngineer; #quantitySurveyor; #storeManager; #viewer }; isActive : Bool; createdAt : Time.Time }>;
    sessions : Map.Map<Nat, { id : Nat; userId : Nat; tokenHash : Text; createdAt : Time.Time; expiresAt : Time.Time }>;
    nextProjectId : Nat;
    nextReportId : Nat;
    nextMaterialId : Nat;
    nextCostId : Nat;
    nextBoqItemId : Nat;
    nextBoqFileId : Nat;
    nextLabourId : Nat;
    nextPhotoId : Nat;
    nextUserId : Nat;
    nextSessionId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    { old with userLoginStatuses = Map.empty<Principal, { lastLoginTime : Time.Time; isActive : Bool }>() };
  };
};
