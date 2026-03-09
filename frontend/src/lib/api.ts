/**
 * HR-Sense API client
 * In dev, calls go to /api/* which Vite proxies to the backend.
 * In production, the backend serves everything from the same origin.
 */
import { getStoredSession } from './auth-client'

function getAuthHeaders(): Record<string, string> {
  const session = getStoredSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.token) headers['Authorization'] = `Bearer ${session.token}`
  if (session?.user?.orgId) headers['X-Org-Id'] = session.user.orgId
  return headers
}

// Returns the logged-in user's orgId — use this instead of hardcoding
export function getOrgId(): string {
  return getStoredSession()?.user?.orgId ?? ''
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: getAuthHeaders(),
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

const get = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })

// ─── Employees ────────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (orgId: string) => get<{ employees: EmployeeRow[] }>(`/employees?orgId=${orgId}`),
  get: (esUserId: string) => get<{ profile: EmployeeProfileDetail }>(`/employees/${esUserId}`),
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceApi = {
  get: (orgId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ orgId })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    return get<AttendanceResponse>(`/attendance?${params}`)
  },
}

// ─── Performance ─────────────────────────────────────────────────────────────

export const performanceApi = {
  list: (orgId: string, period: string) =>
    get<PerformanceResponse>(`/performance?orgId=${orgId}&period=${period}`),
  get: (userId: string, period: string) =>
    get<KpiMetric>(`/performance/${userId}?period=${period}`),
}

// ─── Leaves ───────────────────────────────────────────────────────────────────

export const leavesApi = {
  list: (params?: { status?: string; employeeId?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return get<{ requests: LeaveRequestRow[] }>(`/leaves${qs ? '?' + qs : ''}`)
  },
  create: (body: CreateLeaveRequest) => post<{ request: LeaveRequestRow }>('/leaves', body),
  approve: (id: string, approvedBy: string, notes?: string) =>
    patch<{ request: LeaveRequestRow }>(`/leaves/${id}/approve`, { approvedBy, notes }),
  reject: (id: string, rejectedBy: string, notes?: string) =>
    patch<{ request: LeaveRequestRow }>(`/leaves/${id}/reject`, { rejectedBy, notes }),
  cancel: (id: string) => patch<{ request: LeaveRequestRow }>(`/leaves/${id}/cancel`),
  balance: (employeeId: string, year?: number) =>
    get<{ balances: LeaveBalance[]; year: number }>(`/leaves/balance/${employeeId}${year ? '?year=' + year : ''}`),
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const payrollApi = {
  list: (period?: string) => get<PayrollListResponse>(`/payroll${period ? '?period=' + period : ''}`),
  generate: (period: string) => post<{ records: PayrollRecordRow[]; period: string }>('/payroll/generate', { period }),
  process: (id: string) => patch<{ record: PayrollRecordRow }>(`/payroll/${id}/process`),
  pay: (id: string) => patch<{ record: PayrollRecordRow }>(`/payroll/${id}/pay`),
  bulkPay: (period: string) => patch<{ updated: number }>('/payroll/bulk-pay', { period }),
}

// ─── Departments ─────────────────────────────────────────────────────────────

export const departmentsApi = {
  list: () => get<{ departments: DepartmentRow[] }>('/departments'),
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmployeeRow {
  id: string
  name: string
  email: string
  image?: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  employeeCode?: string
  title?: string
  department?: string
  baseSalary?: number
  startDate?: string
}

export interface EmployeeProfileDetail {
  id: string
  esUserId: string
  employeeCode: string
  title: string
  baseSalary: number
  department: DepartmentRow
  leaveBalances: LeaveBalance[]
  leaveRequests: LeaveRequestRow[]
  payrollRecords: PayrollRecordRow[]
}

export interface AttendanceResponse {
  logs: TimeLogEntry[]
  summary: AttendanceSummary[]
  period: { startDate?: string; endDate?: string }
}

export interface TimeLogEntry {
  id: string
  userId: string
  duration: number
  startTime: string
  endTime?: string
  projectId?: string
  projectName?: string
  isRunning: boolean
}

export interface AttendanceSummary {
  userId: string
  userName: string
  totalHours: number
  sessions: number
  projectCount: number
  status: 'OVERTIME' | 'LOW' | 'NORMAL'
}

export interface KpiMetric {
  userId: string
  userName?: string
  period: string
  hoursLogged: number
  tasksCompleted: number
  reportsSubmitted: number
  performanceScore: number
  tier: 'STAR' | 'GOOD' | 'AVERAGE' | 'BURNOUT_RISK' | 'UNDERPERFORMING'
}

export interface PerformanceResponse {
  metrics: KpiMetric[]
  summary: { avgHours: number; avgScore: number; total: number }
  period: string
}

export interface LeaveRequestRow {
  id: string
  type: string
  status: string
  startDate: string
  endDate: string
  days: number
  reason: string
  approvedBy?: string
  createdAt: string
  employee: { esUserId: string; title: string; department: { name: string } }
}

export interface CreateLeaveRequest {
  employeeId: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
}

export interface LeaveBalance {
  id: string
  year: number
  type: string
  entitled: number
  used: number
  remaining: number
}

export interface PayrollRecordRow {
  id: string
  period: string
  baseSalary: number
  overtimePay: number
  bonus: number
  deductions: number
  taxAmount: number
  netPay: number
  hoursWorked: number
  overtimeHours: number
  status: string
  paidAt?: string
  employee: { esUserId: string; title: string; department: { name: string } }
}

export interface PayrollListResponse {
  records: PayrollRecordRow[]
  summary: { totalGross: number; totalNet: number; totalDeductions: number; count: number }
}

export interface DepartmentRow {
  id: string
  name: string
  headEsId?: string
  memberCount?: number
}
