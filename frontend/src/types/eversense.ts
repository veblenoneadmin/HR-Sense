// ─── EverSense Data Models ────────────────────────────────────────────────────
// These mirror the EverSense Prisma schema exactly.
// In production, these would be fetched via EverSense API.

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF" | "DEVELOPER" | "CLIENT";

export interface ESUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface ESOrganization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  isActive: boolean;
  ownerId: string;
}

export interface ESOrganizationMember {
  id: string;
  role: UserRole;
  userId: string;
  orgId: string;
  createdAt: string;
  user: ESUser;
}

export interface ESProject {
  id: string;
  name: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  budget?: number;
  spent?: number;
  estimatedHours?: number;
  hoursLogged: number;
  progress: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  orgId: string;
  clientId?: string;
  clientName?: string;
}

export interface ESProjectMember {
  id: string;
  role: string;
  userId: string;
  projectId: string;
  createdAt: string;
  user: ESUser;
  project: ESProject;
}

export interface ESTask {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  orgId: string;
  projectId?: string;
  projectName?: string;
  assignedUserId?: string;
}

export interface ESTimeLog {
  id: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  isRunning: boolean;
  createdAt: string;
  orgId: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
}

export interface ESExpense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  expenseDate: string;
  createdAt: string;
  orgId: string;
  projectId?: string;
}

// ─── HR-Sense Native Models ───────────────────────────────────────────────────

export type LeaveType = "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY" | "BEREAVEMENT";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  createdAt: string;
  approvedBy?: string;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  department: string;
  period: string; // "2026-02"
  baseSalary: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  hoursWorked: number;
  overtimeHours: number;
  status: "DRAFT" | "PROCESSED" | "PAID";
  paidAt?: string;
}

export interface PerformanceMetric {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: string;
  department: string;
  period: string;
  hoursLogged: number;
  tasksCompleted: number;
  reportsSubmitted: number;
  activeDays: number;
  performanceScore: number;
  tier: "STAR" | "GOOD" | "AVERAGE" | "UNDERPERFORMING" | "BURNOUT_RISK";
  trend: "UP" | "DOWN" | "STABLE";
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
  headName?: string;
  memberCount: number;
  orgId: string;
}

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  avatar?: string;
  department: string;
  reportsTo?: string;
  directReports: string[];
}
