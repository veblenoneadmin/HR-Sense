/**
 * EverSense API client
 * Fetches employee, task, time log, and KPI data from the EverSense backend.
 * Forwards the user's Better Auth session token so EverSense can authenticate the request.
 */
import axios from 'axios'

const BASE_URL = process.env.EVERSENSE_API_URL || 'https://eversense-ai.up.railway.app'

// Build a per-request axios instance with the user's session token
function makeClient(token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `better-auth.session_token=${token}`
  }
  return axios.create({ baseURL: BASE_URL, headers, timeout: 10000, validateStatus: () => true })
}

async function esGet(path, params, token) {
  const res = await makeClient(token).get(path, { params })
  if (res.status >= 400) {
    console.error(`[eversense] ${path} → ${res.status}`, JSON.stringify(res.data).slice(0, 200))
  }
  return res.data
}

// ─── Employees / Users ────────────────────────────────────────────────────────

export async function getOrgMembers(orgId, token) {
  return esGet(`/api/organizations/${orgId}/members`, undefined, token)
}

export async function getUser(userId, token) {
  return esGet(`/api/users/${userId}`, undefined, token)
}

// ─── Time Logs ────────────────────────────────────────────────────────────────

export async function getTimeLogs(orgId, params = {}, token) {
  return esGet(`/api/timers`, { orgId, ...params }, token)
}

export async function getUserTimeLogs(userId, params = {}, token) {
  return esGet(`/api/timers`, { userId, ...params }, token)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(orgId, params = {}, token) {
  return esGet(`/api/tasks`, { orgId, ...params }, token)
}

export async function getUserTasks(userId, params = {}, token) {
  return esGet(`/api/tasks`, { assignedUserId: userId, ...params }, token)
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(orgId, token) {
  return esGet(`/api/projects`, { orgId }, token)
}

// ─── Reports / KPIs ───────────────────────────────────────────────────────────

export async function getReports(orgId, params = {}, token) {
  return esGet(`/api/reports`, { orgId, ...params }, token)
}

// ─── Attendance (EverSense native) ───────────────────────────────────────────

export async function getAttendance(orgId, params = {}, token) {
  return esGet(`/api/attendance`, { orgId, ...params }, token)
}

// ─── KPI aggregation (computed from EverSense data) ──────────────────────────

export async function buildKpiForUser(userId, period, token) {
  const [startDate, endDate] = getPeriodBounds(period)
  const [timeLogs, tasks, reports] = await Promise.all([
    getUserTimeLogs(userId, { startDate, endDate }, token),
    getUserTasks(userId, { startDate, endDate }, token),
    getReports(null, { userId, startDate, endDate }, token),
  ])

  const hoursLogged = (timeLogs?.data ?? timeLogs ?? [])
    .reduce((sum, t) => sum + (t.duration ?? 0), 0) / 60

  const completedTasks = (tasks?.data ?? tasks ?? [])
    .filter(t => t.status === 'DONE' || t.status === 'completed').length

  const reportsCount = Array.isArray(reports?.data ?? reports) ? (reports?.data ?? reports).length : 0

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
  const [year, month] = period.split('-').map(Number)
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()
  return [start, end]
}
