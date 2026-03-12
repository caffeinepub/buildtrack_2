import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Material {
    id: bigint;
    supplier: string;
    name: string;
    unit: string;
    projectId: bigint;
    quantity: number;
    unitCost: number;
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
export type Time = bigint;
export interface Project {
    id: bigint;
    status: ProjectStatus;
    endDate: Time;
    name: string;
    description: string;
    budget: number;
    location: string;
    startDate: Time;
}
export interface UserProfile {
    name: string;
}
export interface CostEntry {
    id: bigint;
    date: Time;
    description: string;
    projectId: bigint;
    category: string;
    amount: number;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCostEntry(cost: CostEntry): Promise<bigint>;
    createMaterial(material: Material): Promise<bigint>;
    createProject(project: Project): Promise<bigint>;
    createReport(report: DailySiteReport): Promise<bigint>;
    deleteCostEntry(id: bigint): Promise<void>;
    deleteMaterial(id: bigint): Promise<void>;
    deleteProject(id: bigint): Promise<void>;
    deleteReport(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCostEntry(id: bigint): Promise<CostEntry | null>;
    getCostsByProject(projectId: bigint): Promise<Array<CostEntry>>;
    getDashboardStats(): Promise<{
        onHoldCount: bigint;
        completedCount: bigint;
        totalSpent: number;
        totalBudget: number;
        activeCount: bigint;
        planningCount: bigint;
    }>;
    getMaterial(id: bigint): Promise<Material | null>;
    getMaterialsByProject(projectId: bigint): Promise<Array<Material>>;
    getProject(id: bigint): Promise<Project | null>;
    getProjectSummary(projectId: bigint): Promise<{
        totalMaterialCost: number;
        totalCostEntries: number;
        variance: number;
        totalSpent: number;
        budget: number;
    }>;
    getProjectsByStatus(status: ProjectStatus): Promise<Array<Project>>;
    getReport(id: bigint): Promise<DailySiteReport | null>;
    getReportsByProject(projectId: bigint): Promise<Array<DailySiteReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCostEntry(cost: CostEntry): Promise<void>;
    updateMaterial(material: Material): Promise<void>;
    updateProject(project: Project): Promise<void>;
    updateReport(report: DailySiteReport): Promise<void>;
}
