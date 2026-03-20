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
    status: ProjectStatus;
    endDate: Time;
    name: string;
    description: string;
    stage: ProjectStage;
    budget: number;
    location: string;
    startDate: Time;
}
export interface UserProfile {
    name: string;
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
    addProjectPhoto(photo: ProjectPhoto): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBoqItem(item: BoqItem): Promise<bigint>;
    createCostEntry(cost: CostEntry): Promise<bigint>;
    createLabour(labour: Labour): Promise<bigint>;
    createMaterial(material: Material): Promise<bigint>;
    createProject(project: Project): Promise<bigint>;
    createReport(report: DailySiteReport): Promise<bigint>;
    deleteBoqItem(id: bigint): Promise<void>;
    deleteCostEntry(id: bigint): Promise<void>;
    deleteLabour(id: bigint): Promise<void>;
    deleteMaterial(id: bigint): Promise<void>;
    deleteProject(id: bigint): Promise<void>;
    deleteProjectPhoto(id: bigint): Promise<void>;
    deleteReport(id: bigint): Promise<void>;
    getAllProjects(): Promise<Array<Project>>;
    getBoqItem(id: bigint): Promise<BoqItem | null>;
    getBoqItemsByProject(projectId: bigint): Promise<Array<BoqItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCostControlByProject(projectId: bigint): Promise<{
        remainingBudget: number;
        projectBudget: number;
        totalSpent: number;
        labourCost: number;
        materialsCost: number;
    }>;
    getCostEntry(id: bigint): Promise<CostEntry | null>;
    getCostsByProject(projectId: bigint): Promise<Array<CostEntry>>;
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
    getLabour(id: bigint): Promise<Labour | null>;
    getLabourByProject(projectId: bigint): Promise<Array<Labour>>;
    getMaterial(id: bigint): Promise<Material | null>;
    getMaterialsByProject(projectId: bigint): Promise<Array<Material>>;
    getPhotosByProject(projectId: bigint): Promise<Array<ProjectPhoto>>;
    getProject(id: bigint): Promise<Project | null>;
    getProjectSummary(projectId: bigint): Promise<{
        totalMaterialCost: number;
        totalCostEntries: number;
        totalLabourCost: number;
        variance: number;
        totalSpent: number;
        budget: number;
    }>;
    getProjectsByStage(stage: ProjectStage): Promise<Array<Project>>;
    getProjectsByStatus(status: ProjectStatus): Promise<Array<Project>>;
    getReport(id: bigint): Promise<DailySiteReport | null>;
    getReportsByProject(projectId: bigint): Promise<Array<DailySiteReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBoqItem(item: BoqItem): Promise<void>;
    updateCostEntry(cost: CostEntry): Promise<void>;
    updateLabour(labour: Labour): Promise<void>;
    updateMaterial(material: Material): Promise<void>;
    updateProject(project: Project): Promise<void>;
    updateProjectStage(id: bigint, stage: ProjectStage): Promise<void>;
    updateReport(report: DailySiteReport): Promise<void>;
}
