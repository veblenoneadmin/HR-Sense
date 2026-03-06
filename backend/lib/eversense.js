/**
 * EverSense API client
 * Fetches employee, task, time log, and KPI data from the EverSense backend.
 * Set EVERSENSE_API_URL and EVERSENSE_API_KEY in .env
 */
import axios from 'axios'

const client = axios.create({
  baseURL: process.env.EVERSENSE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.EVERSENSE_API_KEY && {
      Authorization: `Bearer ${process.env.EVERSENSE_API_KEY}`,
    }),
  },
  timeout: 10000,
})

// ─── Employees / Users ────────────────────────────────────────────────────────

export async function getOrgMembers(orgId) {
  const res = await client.get(`/api/organizations/${orgId}/members`)
  return res.data
}

export async function getUser(userId) {
  const res = await client.get(`/api/users/${userId}`)
  return res.data
}

// ─── Time Logs ────────────────────────────────────────────────────────────────

export async function getTimeLogs(orgId, params = {}) {
  // params: { userId, startDate, endDate, projectId }
  const res = await client.get(`/api/timers`, { params: { orgId, ...params } })
  return res.data
}

export async function getUserTimeLogs(userId, params = {}) {
  const res = await client.get(`/api/timers`, { params: { userId, ...params } })
  return res.data
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(orgId, params = {}) {
  const res = await client.get(`/api/tasks`, { params: { orgId, ...params } })
  return res.data
}

export async function getUserTasks(userId, params = {}) {
  const res = await client.get(`/api/tasks`, { params: { assignedUserId: userId, ...params } })
  return res.data
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(orgId) {
  const res = await client.get(`/api/projects`, { params: { orgId } })
  return res.data
}

// ─── Reports / KPIs ───────────────────────────────────────────────────────────

export async function getReports(orgId, params = {}) {
  const res = await client.get(`/api/reports`, { params: { orgId, ...params } })
  return res.data
}

// ─── Attendance (EverSense native) ───────────────────────────────────────────

export async function getAttendance(orgId, params = {}) {
  const res = await client.get(`/api/attendance`, { params: { orgId, ...params } })
  return res.data
}

// ─── KPI aggregation (computed from EverSense data) ──────────────────────────

export async function buildKpiForUser(userId, period) {
  const [startDate, endDate] = getPeriodBounds(period)
  const [timeLogs, tasks, reports] = await Promise.all([
    getUserTimeLogs(userId, { startDate, endDate }),
    getUserTasks(userId, { startDate, endDate }),
    getReports(null, { userId, startDate, endDate }),
  ])

  const hoursLogged = (timeLogs?.data ?? timeLogs ?? [])
    .reduce((sum, t) => sum + (t.duration ?? 0), 0) / 60

  const completedTasks = (tasks?.data ?? tasks ?? [])
    .filter(t => t.status === 'DONE' || t.status === 'completed').length

  const reportsCount = Array.isArray(reports?.data ?? reports) ? (reports?.data ?? reports).length : 0

  // Score algorithm from EverSense SAMPLE_KPI_REPORT.json
  const AVG_HOURS = 48.19
  const AVG_TASKS = 3.5
  const hoursScore = hoursLogged / AVG_HOURS
  const taskScore = completedTasks / AVG_TASKS
  const performanceScore = (hoursScore + taskScore + (reportsCount > 0 ? 0.1 : 0)) / 2

  const tier =
    hoursLogged > AVG_HOURS * 1.6 ? 'BURNOUT_RISK'
    : performanceScore >= 1.5 ? 'STAR'
    : performanceScore >= 1.0 ? 'GOOD'
    : performanceScore >= 0.5 ? 'AVERAGE'
    : 'UNDERPERFORMING'

  return { userId, period, hoursLogged, tasksCompleted: completedTasks, reportsSubmitted: reportsCount, performanceScore, tier }
}

function getPeriodBounds(period) {
  // period = "2026-02"
  const [year, month] = period.split('-').map(Number)
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()
  return [start, end]
}
