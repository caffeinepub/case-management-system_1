import Array "mo:core/Array";
import Bool "mo:core/Bool";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";



actor {
  // Authorization component
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage component
  include MixinStorage();

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  // Case data types
  type Status = {
    #scheduled;
    #accepted;
    #rejected : { reason : Text; comments : Text };
    #reviewing;
    #pending;
  };

  module Status {
    public func compare(s1 : Status, s2 : Status) : Order.Order {
      switch (s1, s2) {
        case (#pending, #pending) { #equal };
        case (#pending, _) { #less };
        case (#reviewing, #pending) { #greater };
        case (#reviewing, #reviewing) { #equal };
        case (#reviewing, _) { #less };
        case (#scheduled, #scheduled) { #equal };
        case (#scheduled, #reviewing) { #greater };
        case (#scheduled, #pending) { #greater };
        case (#scheduled, _) { #less };
        case (#accepted, #accepted) { #equal };
        case (#accepted, _) { #greater };
        case (#rejected _, #rejected _) { #equal };
        case (#rejected _, _) { #greater };
      };
    };
  };

  public type Case = {
    caseNumber : Text;
    clientName : Text;
    hearingDate : Time.Time;
    status : Status;
    createdDate : Time.Time;
    documents : [Storage.ExternalBlob];
    jlNo : Text;
    mutionNo : Text;
    khationNo : Text;
  };

  module Case {
    public func compareByHearingDate(c1 : Case, c2 : Case) : Order.Order {
      Int.compare(c1.hearingDate, c2.hearingDate);
    };
    public func compareByClientName(c1 : Case, c2 : Case) : Order.Order {
      Text.compare(c1.clientName, c2.clientName);
    };
    public func compareByCaseNumber(c1 : Case, c2 : Case) : Order.Order {
      Text.compare(c1.caseNumber, c2.caseNumber);
    };
    public func compareByStatus(c1 : Case, c2 : Case) : Order.Order {
      Status.compare(c1.status, c2.status);
    };
  };

  type CaseId = Nat;

  // Main storage
  let cases = Map.empty<CaseId, Case>();
  var nextCaseId = 1;

  // Document metadata storage
  let documentMetadata = List.empty<{
    caseId : CaseId;
    documentId : Storage.ExternalBlob;
  }>();

  // Main functions
  public shared ({ caller }) func addCase(
    caseNumber : Text,
    clientName : Text,
    hearingDate : Time.Time,
    jlNo : Text,
    mutionNo : Text,
  ) : async CaseId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add cases");
    };
    let newCase : Case = {
      caseNumber;
      clientName;
      hearingDate;
      status = #pending;
      createdDate = Time.now();
      documents = [];
      jlNo;
      mutionNo;
      khationNo = "";
    };

    cases.add(nextCaseId, newCase);
    nextCaseId += 1;
    nextCaseId - 1;
  };

  public shared ({ caller }) func acceptCase(caseId : CaseId, documentIds : [Storage.ExternalBlob], khationNo : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can accept cases");
    };
    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : Case = {
          existingCase with
          status = #accepted;
          documents = documentIds;
          khationNo;
        };
        cases.add(caseId, updatedCase);

        // Store linked document metadata
        let metadataEntries = documentIds.map(
          func(doc) {
            {
              caseId;
              documentId = doc;
            };
          }
        );
        documentMetadata.addAll(metadataEntries.values());
      };
    };
  };

  public shared ({ caller }) func rejectCase(caseId : CaseId, reason : Text, comments : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reject cases");
    };
    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : Case = {
          existingCase with
          status = #rejected({
            reason;
            comments;
          });
        };
        cases.add(caseId, updatedCase);
      };
    };
  };

  public shared ({ caller }) func editCase(
    caseId : CaseId,
    caseNumber : Text,
    clientName : Text,
    hearingDate : Time.Time,
    jlNo : Text,
    mutionNo : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can edit cases");
    };
    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : Case = {
          existingCase with
          caseNumber;
          clientName;
          hearingDate;
          jlNo;
          mutionNo;
        };
        cases.add(caseId, updatedCase);
      };
    };
  };

  public query ({ caller }) func getCase(caseId : CaseId) : async ?Case {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.get(caseId);
  };

  public query ({ caller }) func getAllCases() : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray();
  };

  public query ({ caller }) func getCasesSortedByHearingDate() : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray().sort(Case.compareByHearingDate);
  };

  public query ({ caller }) func getCasesSortedByClientName() : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray().sort(Case.compareByClientName);
  };

  public query ({ caller }) func getCasesSortedByCaseNumber() : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray().sort(Case.compareByCaseNumber);
  };

  public query ({ caller }) func getCasesByStatus(status : Status) : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray().filter(
      func(c) {
        switch (c.status, status) {
          case (#pending, #pending) { true };
          case (#reviewing, #reviewing) { true };
          case (#scheduled, #scheduled) { true };
          case (#accepted, #accepted) { true };
          case (#rejected _, #rejected _) { true };
          case (_) { false };
        };
      }
    );
  };

  public query ({ caller }) func getCaseDocuments(caseId : CaseId) : async [Storage.ExternalBlob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access documents");
    };
    switch (cases.get(caseId)) {
      case (null) { [] };
      case (?caseEntry) { caseEntry.documents };
    };
  };

  public query ({ caller }) func getDocumentsByCaseStatus(status : Status) : async [Storage.ExternalBlob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access documents");
    };
    cases.values().toArray().filter(
      func(c) {
        switch (c.status, status) {
          case (#pending, #pending) { true };
          case (#reviewing, #reviewing) { true };
          case (#scheduled, #scheduled) { true };
          case (#accepted, #accepted) { true };
          case (#rejected _, #rejected _) { true };
          case (_) { false };
        };
      }
    ).map(
      func(c) { c.documents }
    ).flatten();
  };

  public query ({ caller }) func getAllDocumentMetadata() : async [{
    caseId : CaseId;
    documentId : Storage.ExternalBlob;
  }] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access all document metadata");
    };
    documentMetadata.toArray();
  };
};
