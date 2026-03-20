import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Case {
    status: Status;
    documents: Array<ExternalBlob>;
    hearingDate: Time;
    clientName: string;
    caseNumber: string;
    jlNo: string;
    khationNo: string;
    createdDate: Time;
    mutionNo: string;
}
export type CaseId = bigint;
export type Time = bigint;
export type Status = {
    __kind__: "scheduled";
    scheduled: null;
} | {
    __kind__: "reviewing";
    reviewing: null;
} | {
    __kind__: "pending";
    pending: null;
} | {
    __kind__: "rejected";
    rejected: {
        comments: string;
        reason: string;
    };
} | {
    __kind__: "accepted";
    accepted: null;
};
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptCase(caseId: CaseId, documentIds: Array<ExternalBlob>, khationNo: string): Promise<void>;
    addCase(caseNumber: string, clientName: string, hearingDate: Time, jlNo: string, mutionNo: string): Promise<CaseId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    editCase(caseId: CaseId, caseNumber: string, clientName: string, hearingDate: Time, jlNo: string, mutionNo: string): Promise<void>;
    getAllCases(): Promise<Array<Case>>;
    getAllDocumentMetadata(): Promise<Array<{
        documentId: ExternalBlob;
        caseId: CaseId;
    }>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCase(caseId: CaseId): Promise<Case | null>;
    getCaseDocuments(caseId: CaseId): Promise<Array<ExternalBlob>>;
    getCasesByStatus(status: Status): Promise<Array<Case>>;
    getCasesSortedByCaseNumber(): Promise<Array<Case>>;
    getCasesSortedByClientName(): Promise<Array<Case>>;
    getCasesSortedByHearingDate(): Promise<Array<Case>>;
    getDocumentsByCaseStatus(status: Status): Promise<Array<ExternalBlob>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    rejectCase(caseId: CaseId, reason: string, comments: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
