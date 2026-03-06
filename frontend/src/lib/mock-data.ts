// ─── Mock Data (mirroring EverSense's data models) ───────────────────────────
// In production, this would be replaced by EverSense API calls.

import type {
  ESUser,
  ESOrganizationMember,
  ESProject,
  ESTask,
  ESTimeLog,
  LeaveRequest,
  PayrollRecord,
  PerformanceMetric,
  OrgNode,
  Department,
} from "@/types/eversense";

export const MOCK_USERS: ESUser[] = [
  { id: "u1", email: "jordan@veblen.com", name: "Jordan Veblen", role: "OWNER", isActive: true, createdAt: "2025-01-01", updatedAt: "2026-03-01", lastLoginAt: "2026-03-05", image: undefined },
  { id: "u2", email: "alice@veblen.com", name: "Alice Johnson", role: "MANAGER", isActive: true, createdAt: "2025-01-15", updatedAt: "2026-03-01", lastLoginAt: "2026-03-05" },
  { id: "u3", email: "bob@veblen.com", name: "Bob Smith", role: "DEVELOPER", isActive: true, createdAt: "2025-02-01", updatedAt: "2026-03-01", lastLoginAt: "2026-03-04" },
  { id: "u4", email: "charlie@veblen.com", name: "Charlie Brown", role: "STAFF", isActive: true, createdAt: "2025-02-15", updatedAt: "2026-03-01", lastLoginAt: "2026-03-03" },
  { id: "u5", email: "diana@veblen.com", name: "Diana Prince", role: "STAFF", isActive: true, createdAt: "2025-03-01", updatedAt: "2026-03-01", lastLoginAt: "2026-02-28" },
  { id: "u6", email: "eve@veblen.com", name: "Eve Wilson", role: "DEVELOPER", isActive: true, createdAt: "2025-03-15", updatedAt: "2026-03-01", lastLoginAt: "2026-03-05" },
  { id: "u7", email: "frank@veblen.com", name: "Frank Miller", role: "STAFF", isActive: true, createdAt: "2025-04-01", updatedAt: "2026-03-01", lastLoginAt: "2026-03-02" },
  { id: "u8", email: "grace@veblen.com", name: "Grace Lee", role: "MANAGER", isActive: true, createdAt: "2025-04-15", updatedAt: "2026-03-01", lastLoginAt: "2026-03-05" },
  { id: "u9", email: "henry@veblen.com", name: "Henry Davis", role: "DEVELOPER", isActive: false, createdAt: "2025-05-01", updatedAt: "2026-02-01", lastLoginAt: "2026-01-30" },
  { id: "u10", email: "marcus@veblen.com", name: "Marcus Chen", role: "DEVELOPER", isActive: true, createdAt: "2025-05-15", updatedAt: "2026-03-01", lastLoginAt: "2026-03-05" },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "d1", name: "Engineering", headId: "u2", headName: "Alice Johnson", memberCount: 4, orgId: "org1" },
  { id: "d2", name: "Product", headId: "u8", headName: "Grace Lee", memberCount: 2, orgId: "org1" },
  { id: "d3", name: "Operations", headId: "u1", headName: "Jordan Veblen", memberCount: 2, orgId: "org1" },
  { id: "d4", name: "Marketing", headId: "u4", headName: "Charlie Brown", memberCount: 2, orgId: "org1" },
];

export const USER_DEPARTMENTS: Record<string, string> = {
  u1: "Operations",
  u2: "Engineering",
  u3: "Engineering",
  u4: "Marketing",
  u5: "Operations",
  u6: "Engineering",
  u7: "Marketing",
  u8: "Product",
  u9: "Engineering",
  u10: "Product",
};

export const USER_TITLES: Record<string, string> = {
  u1: "Founder & CEO",
  u2: "Engineering Manager",
  u3: "Senior Developer",
  u4: "Marketing Specialist",
  u5: "Operations Coordinator",
  u6: "Full Stack Developer",
  u7: "Marketing Associate",
  u8: "Product Manager",
  u9: "Backend Developer",
  u10: "Frontend Developer",
};

export const MOCK_ORG_MEMBERS: ESOrganizationMember[] = MOCK_USERS.map((u) => ({
  id: `om-${u.id}`,
  role: u.role,
  userId: u.id,
  orgId: "org1",
  createdAt: u.createdAt,
  user: u,
}));

export const MOCK_PROJECTS: ESProject[] = [
  { id: "p1", name: "Website Redesign v2.0", status: "ACTIVE", priority: "HIGH", budget: 85000, spent: 52000, estimatedHours: 600, hoursLogged: 385, progress: 65, startDate: "2026-01-01", endDate: "2026-04-30", createdAt: "2026-01-01", orgId: "org1", clientId: "c1", clientName: "InnovateTech Solutions" },
  { id: "p2", name: "VebTask - Time Tracking Platform", status: "ACTIVE", priority: "URGENT", budget: 250000, spent: 162000, estimatedHours: 2000, hoursLogged: 1240, progress: 62, startDate: "2025-09-01", endDate: "2026-06-30", createdAt: "2025-09-01", orgId: "org1", clientName: "Internal" },
  { id: "p3", name: "AI Scheduler Integration", status: "PLANNING", priority: "HIGH", budget: 45000, spent: 8000, estimatedHours: 400, hoursLogged: 72, progress: 18, startDate: "2026-03-01", endDate: "2026-07-31", createdAt: "2026-02-15", orgId: "org1", clientId: "c2", clientName: "TechCorp" },
  { id: "p4", name: "Mobile App MVP", status: "ON_HOLD", priority: "MEDIUM", budget: 120000, spent: 37000, estimatedHours: 800, hoursLogged: 312, progress: 39, startDate: "2025-11-01", createdAt: "2025-11-01", orgId: "org1", clientId: "c3", clientName: "StartupXYZ" },
  { id: "p5", name: "Data Analytics Dashboard", status: "COMPLETED", priority: "HIGH", budget: 60000, spent: 58500, estimatedHours: 480, hoursLogged: 476, progress: 100, startDate: "2025-07-01", endDate: "2025-12-31", createdAt: "2025-07-01", orgId: "org1", clientName: "Internal" },
];

export const MOCK_TASKS: ESTask[] = [
  { id: "t1", title: "Design system component library", status: "DONE", priority: "HIGH", completedAt: "2026-02-20", createdAt: "2026-01-15", orgId: "org1", projectId: "p1", projectName: "Website Redesign v2.0", assignedUserId: "u2" },
  { id: "t2", title: "Implement auth flow with Better Auth", status: "DONE", priority: "URGENT", completedAt: "2026-02-22", createdAt: "2026-01-20", orgId: "org1", projectId: "p2", projectName: "VebTask", assignedUserId: "u3" },
  { id: "t3", title: "Build time tracking UI", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-03-15", createdAt: "2026-02-01", orgId: "org1", projectId: "p2", projectName: "VebTask", assignedUserId: "u10" },
  { id: "t4", title: "AI prompt engineering for scheduler", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-03-20", createdAt: "2026-02-15", orgId: "org1", projectId: "p3", projectName: "AI Scheduler", assignedUserId: "u6" },
  { id: "t5", title: "Mobile navigation redesign", status: "TODO", priority: "MEDIUM", dueDate: "2026-04-01", createdAt: "2026-03-01", orgId: "org1", projectId: "p4", projectName: "Mobile App", assignedUserId: "u3" },
  { id: "t6", title: "Write KPI report Q1", status: "DONE", priority: "MEDIUM", completedAt: "2026-02-18", createdAt: "2026-02-10", orgId: "org1", assignedUserId: "u2" },
  { id: "t7", title: "Expense reconciliation February", status: "IN_REVIEW", priority: "MEDIUM", dueDate: "2026-03-07", createdAt: "2026-03-01", orgId: "org1", assignedUserId: "u5" },
  { id: "t8", title: "Setup CI/CD pipeline", status: "DONE", priority: "HIGH", completedAt: "2026-02-21", createdAt: "2026-02-05", orgId: "org1", projectId: "p2", projectName: "VebTask", assignedUserId: "u3" },
  { id: "t9", title: "Content calendar March", status: "TODO", priority: "LOW", dueDate: "2026-03-10", createdAt: "2026-03-01", orgId: "org1", assignedUserId: "u4" },
  { id: "t10", title: "Database optimization pass", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-03-12", createdAt: "2026-03-01", orgId: "org1", projectId: "p2", projectName: "VebTask", assignedUserId: "u10" },
];

// Weekly time logs (Feb 16-22, 2026 — matching the KPI report)
export const MOCK_TIMELOGS: ESTimeLog[] = [
  { id: "tl1", userId: "u2", duration: 3750, startTime: "2026-02-16T09:00:00", endTime: "2026-02-16T17:30:00", isRunning: false, createdAt: "2026-02-16", orgId: "org1", projectId: "p1", projectName: "Website Redesign" },
  { id: "tl2", userId: "u10", duration: 3495, startTime: "2026-02-16T08:30:00", endTime: "2026-02-16T16:45:00", isRunning: false, createdAt: "2026-02-16", orgId: "org1", projectId: "p2", projectName: "VebTask" },
  { id: "tl3", userId: "u3", duration: 4695, startTime: "2026-02-16T07:00:00", endTime: "2026-02-16T19:15:00", isRunning: false, createdAt: "2026-02-16", orgId: "org1", projectId: "p2", projectName: "VebTask" },
  { id: "tl4", userId: "u6", duration: 3120, startTime: "2026-02-17T09:00:00", endTime: "2026-02-17T17:12:00", isRunning: false, createdAt: "2026-02-17", orgId: "org1", projectId: "p3", projectName: "AI Scheduler" },
  { id: "tl5", userId: "u5", duration: 750, startTime: "2026-02-18T10:00:00", endTime: "2026-02-18T12:30:00", isRunning: false, createdAt: "2026-02-18", orgId: "org1", projectId: "p4" },
  { id: "tl6", userId: "u7", duration: 1110, startTime: "2026-02-19T09:00:00", endTime: "2026-02-19T12:30:00", isRunning: false, createdAt: "2026-02-19", orgId: "org1" },
  { id: "tl7", userId: "u4", duration: 2400, startTime: "2026-02-20T08:00:00", endTime: "2026-02-20T16:00:00", isRunning: false, createdAt: "2026-02-20", orgId: "org1" },
  { id: "tl8", userId: "u8", duration: 2760, startTime: "2026-02-20T09:00:00", endTime: "2026-02-20T16:36:00", isRunning: false, createdAt: "2026-02-20", orgId: "org1", projectId: "p1", projectName: "Website Redesign" },
];

export const MOCK_PERFORMANCE: PerformanceMetric[] = [
  { userId: "u2", userName: "Alice Johnson", role: "Engineering Manager", department: "Engineering", period: "2026-02", hoursLogged: 62.5, tasksCompleted: 8, reportsSubmitted: 3, activeDays: 20, performanceScore: 1.85, tier: "STAR", trend: "UP" },
  { userId: "u10", userName: "Marcus Chen", role: "Frontend Developer", department: "Product", period: "2026-02", hoursLogged: 58.25, tasksCompleted: 7, reportsSubmitted: 2, activeDays: 20, performanceScore: 1.72, tier: "STAR", trend: "STABLE" },
  { userId: "u8", userName: "Grace Lee", role: "Product Manager", department: "Product", period: "2026-02", hoursLogged: 46.0, tasksCompleted: 5, reportsSubmitted: 4, activeDays: 19, performanceScore: 1.30, tier: "GOOD", trend: "UP" },
  { userId: "u6", userName: "Eve Wilson", role: "Full Stack Developer", department: "Engineering", period: "2026-02", hoursLogged: 44.5, tasksCompleted: 4, reportsSubmitted: 2, activeDays: 18, performanceScore: 1.10, tier: "GOOD", trend: "STABLE" },
  { userId: "u3", userName: "Bob Smith", role: "Senior Developer", department: "Engineering", period: "2026-02", hoursLogged: 78.25, tasksCompleted: 6, reportsSubmitted: 1, activeDays: 22, performanceScore: 0.95, tier: "BURNOUT_RISK", trend: "DOWN" },
  { userId: "u4", userName: "Charlie Brown", role: "Marketing Specialist", department: "Marketing", period: "2026-02", hoursLogged: 40.0, tasksCompleted: 3, reportsSubmitted: 1, activeDays: 17, performanceScore: 0.80, tier: "AVERAGE", trend: "STABLE" },
  { userId: "u1", userName: "Jordan Veblen", role: "Founder & CEO", department: "Operations", period: "2026-02", hoursLogged: 52.0, tasksCompleted: 4, reportsSubmitted: 5, activeDays: 21, performanceScore: 1.20, tier: "GOOD", trend: "UP" },
  { userId: "u5", userName: "Diana Prince", role: "Operations Coordinator", department: "Operations", period: "2026-02", hoursLogged: 12.5, tasksCompleted: 0, reportsSubmitted: 0, activeDays: 5, performanceScore: 0.20, tier: "UNDERPERFORMING", trend: "DOWN" },
  { userId: "u7", userName: "Frank Miller", role: "Marketing Associate", department: "Marketing", period: "2026-02", hoursLogged: 18.5, tasksCompleted: 1, reportsSubmitted: 0, activeDays: 8, performanceScore: 0.35, tier: "UNDERPERFORMING", trend: "DOWN" },
];

export const MOCK_LEAVES: LeaveRequest[] = [
  { id: "l1", userId: "u5", userName: "Diana Prince", type: "SICK", status: "APPROVED", startDate: "2026-02-20", endDate: "2026-02-28", days: 7, reason: "Medical recovery", createdAt: "2026-02-19", approvedBy: "Alice Johnson" },
  { id: "l2", userId: "u4", userName: "Charlie Brown", type: "ANNUAL", status: "PENDING", startDate: "2026-03-10", endDate: "2026-03-14", days: 5, reason: "Family vacation", createdAt: "2026-03-01" },
  { id: "l3", userId: "u7", userName: "Frank Miller", type: "SICK", status: "PENDING", startDate: "2026-03-05", endDate: "2026-03-06", days: 2, reason: "Flu symptoms", createdAt: "2026-03-05" },
  { id: "l4", userId: "u3", userName: "Bob Smith", type: "ANNUAL", status: "APPROVED", startDate: "2026-04-01", endDate: "2026-04-05", days: 5, reason: "Pre-planned holiday", createdAt: "2026-02-25", approvedBy: "Alice Johnson" },
  { id: "l5", userId: "u6", userName: "Eve Wilson", type: "MATERNITY", status: "APPROVED", startDate: "2026-05-01", endDate: "2026-07-31", days: 65, reason: "Maternity leave", createdAt: "2026-02-10", approvedBy: "Jordan Veblen" },
  { id: "l6", userId: "u8", userName: "Grace Lee", type: "ANNUAL", status: "REJECTED", startDate: "2026-03-20", endDate: "2026-03-22", days: 3, reason: "Personal trip", createdAt: "2026-03-02", approvedBy: "Jordan Veblen" },
  { id: "l7", userId: "u10", userName: "Marcus Chen", type: "SICK", status: "APPROVED", startDate: "2026-02-12", endDate: "2026-02-13", days: 2, reason: "Not feeling well", createdAt: "2026-02-12", approvedBy: "Alice Johnson" },
];

export const MOCK_PAYROLL: PayrollRecord[] = [
  { id: "pr1", userId: "u1", userName: "Jordan Veblen", department: "Operations", period: "2026-02", baseSalary: 12500, overtimePay: 0, deductions: 2200, netPay: 10300, hoursWorked: 160, overtimeHours: 0, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr2", userId: "u2", userName: "Alice Johnson", department: "Engineering", period: "2026-02", baseSalary: 10800, overtimePay: 850, deductions: 1950, netPay: 9700, hoursWorked: 172, overtimeHours: 12, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr3", userId: "u3", userName: "Bob Smith", department: "Engineering", period: "2026-02", baseSalary: 9200, overtimePay: 1640, deductions: 1820, netPay: 9020, hoursWorked: 188, overtimeHours: 28, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr4", userId: "u4", userName: "Charlie Brown", department: "Marketing", period: "2026-02", baseSalary: 5800, overtimePay: 0, deductions: 900, netPay: 4900, hoursWorked: 152, overtimeHours: 0, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr5", userId: "u5", userName: "Diana Prince", department: "Operations", period: "2026-02", baseSalary: 5200, overtimePay: 0, deductions: 780, netPay: 4420, hoursWorked: 48, overtimeHours: 0, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr6", userId: "u6", userName: "Eve Wilson", department: "Engineering", period: "2026-02", baseSalary: 8500, overtimePay: 0, deductions: 1500, netPay: 7000, hoursWorked: 156, overtimeHours: 0, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr7", userId: "u7", userName: "Frank Miller", department: "Marketing", period: "2026-02", baseSalary: 4800, overtimePay: 0, deductions: 700, netPay: 4100, hoursWorked: 74, overtimeHours: 0, status: "PROCESSED" },
  { id: "pr8", userId: "u8", userName: "Grace Lee", department: "Product", period: "2026-02", baseSalary: 9800, overtimePay: 0, deductions: 1720, netPay: 8080, hoursWorked: 164, overtimeHours: 0, status: "PAID", paidAt: "2026-03-01" },
  { id: "pr9", userId: "u10", userName: "Marcus Chen", department: "Product", period: "2026-02", baseSalary: 8200, overtimePay: 280, deductions: 1460, netPay: 7020, hoursWorked: 162, overtimeHours: 4, status: "PROCESSED" },
];

export const MOCK_ORG_CHART: OrgNode[] = [
  { id: "u1", name: "Jordan Veblen", title: "Founder & CEO", role: "OWNER", department: "Operations", reportsTo: undefined, directReports: ["u2", "u8", "u5"] },
  { id: "u2", name: "Alice Johnson", title: "Engineering Manager", role: "MANAGER", department: "Engineering", reportsTo: "u1", directReports: ["u3", "u6", "u10"] },
  { id: "u8", name: "Grace Lee", title: "Product Manager", role: "MANAGER", department: "Product", reportsTo: "u1", directReports: ["u4"] },
  { id: "u5", name: "Diana Prince", title: "Operations Coordinator", role: "STAFF", department: "Operations", reportsTo: "u1", directReports: [] },
  { id: "u3", name: "Bob Smith", title: "Senior Developer", role: "DEVELOPER", department: "Engineering", reportsTo: "u2", directReports: [] },
  { id: "u6", name: "Eve Wilson", title: "Full Stack Developer", role: "DEVELOPER", department: "Engineering", reportsTo: "u2", directReports: [] },
  { id: "u10", name: "Marcus Chen", title: "Frontend Developer", role: "DEVELOPER", department: "Product", reportsTo: "u2", directReports: [] },
  { id: "u4", name: "Charlie Brown", title: "Marketing Specialist", role: "STAFF", department: "Marketing", reportsTo: "u8", directReports: ["u7"] },
  { id: "u7", name: "Frank Miller", title: "Marketing Associate", role: "STAFF", department: "Marketing", reportsTo: "u4", directReports: [] },
];

// ─── Aggregate helpers ────────────────────────────────────────────────────────

export function getUser(id: string) {
  return MOCK_USERS.find((u) => u.id === id);
}

export function getUserPerformance(userId: string) {
  return MOCK_PERFORMANCE.find((p) => p.userId === userId);
}

export function getUserTimeLogs(userId: string) {
  return MOCK_TIMELOGS.filter((t) => t.userId === userId);
}

export function getUserTasks(userId: string) {
  return MOCK_TASKS.filter((t) => t.assignedUserId === userId);
}

export function getUserLeaves(userId: string) {
  return MOCK_LEAVES.filter((l) => l.userId === userId);
}

export function totalHours(timelogs: { duration: number }[]) {
  return timelogs.reduce((acc, t) => acc + t.duration, 0) / 60;
}
