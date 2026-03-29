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
export interface Labour {
    id: bigint;
    dailyWage: number;
    role: string;
    projectId: bigint;
    daysWorked: number;
    workerName: string;
}
export interface DailySiteReport {
    id: bigint;
    workersOnSite: bigint;
    date: Time;
    hoursWorked: number;
    activities: string;
    projectId: bigint;
    notes: string;
    weather: string;
}
export interface CostEntry {
    id: bigint;
    date: Time;
    description: string;
    projectId: bigint;
    category: string;
    amount: number;
}
export type Time = bigint;
export interface BoqItem {
    id: bigint;
    plannedQuantity: number;
    unit: string;
    description: string;
    projectId: bigint;
    itemName: string;
    usedQuantity: number;
    unitRate: number;
}
export interface Material {
    id: bigint;
    supplier: string;
    name: string;
    unit: string;
    projectId: bigint;
    quantity: number;
    unitCost: number;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ProjectCostSummary {
    status: ProjectStatus;
    remainingBudget: number;
    projectName: string;
    totalSpent: number;
    labourCost: number;
    projectId: bigint;
    materialsCost: number;
    budgetPct: number;
    budget: number;
}
export interface ProjectPhoto {
    id: bigint;
    description: string;
    dateUploaded: Time;
    imageUrl: ExternalBlob;
    projectId: bigint;
    reportId: bigint;
}
export interface Project {
    id: bigint;
    estimatedDurationDays: number;
    status: ProjectStatus;
    endDate: Time;
    clientName: string;
    name: string;
    createdAt: Time;
    updatedAt: Time;
    description: string;
    currentProgressPercentage: number;
    stage: ProjectStage;
    budget: number;
    location: string;
    startDate: Time;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ProjectStage {
    foundation = "foundation",
    structure = "structure",
    completed = "completed",
    finishing = "finishing",
    planning = "planning"
}
export enum ProjectStatus {
    active = "active",
    completed = "completed",
    onHold = "onHold",
    planning = "planning"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBOQItem(item: BoqItem): Promise<bigint>;
    addCostEntry(cost: CostEntry): Promise<bigint>;
    addLabour(labour: Labour): Promise<bigint>;
    addMaterial(material: Material): Promise<bigint>;
    addProjectPhoto(photo: ProjectPhoto): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(project: Project): Promise<bigint>;
    createReport(report: DailySiteReport): Promise<bigint>;
    deleteBOQItem(id: bigint): Promise<void>;
    deleteCostEntry(id: bigint): Promise<void>;
    deleteLabour(id: bigint): Promise<void>;
    deleteMaterial(id: bigint): Promise<void>;
    deleteProject(id: bigint): Promise<void>;
    deleteProjectPhoto(id: bigint): Promise<void>;
    deleteReport(id: bigint): Promise<void>;
    getActiveUsers(): Promise<Array<Principal>>;
    getAllProjectCostSummaries(): Promise<Array<ProjectCostSummary>>;
    getBoqItemsByProject(projectId: bigint): Promise<Array<BoqItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCostEntriesByProject(projectId: bigint): Promise<Array<CostEntry>>;
    getDashboardStats(): Promise<{
        foundationCount: bigint;
        onHoldCount: bigint;
        structureCount: bigint;
        completedCount: bigint;
        totalSpent: number;
        totalBudget: number;
        activeCount: bigint;
        planningCount: bigint;
        finishingCount: bigint;
    }>;
    getLabourByProject(projectId: bigint): Promise<Array<Labour>>;
    getMaterialsByProject(projectId: bigint): Promise<Array<Material>>;
    getProjectById(id: bigint): Promise<Project | null>;
    getProjectCostSummary(projectId: bigint): Promise<ProjectCostSummary | null>;
    getProjectPhotosByProject(projectId: bigint): Promise<Array<ProjectPhoto>>;
    getProjects(): Promise<Array<Project>>;
    getReportsByProject(projectId: bigint): Promise<Array<DailySiteReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    bootstrapAdmin(): Promise<boolean>;
    recordLogin(): Promise<void>;
    recordLogout(): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateBOQItem(item: BoqItem): Promise<void>;
    updateCostEntry(cost: CostEntry): Promise<void>;
    updateLabour(labour: Labour): Promise<void>;
    updateMaterial(material: Material): Promise<void>;
    updateProject(id: bigint, updatedProject: Project): Promise<void>;
    updateReport(report: DailySiteReport): Promise<void>;
}
