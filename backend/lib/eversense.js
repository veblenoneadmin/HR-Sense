/**
 * EverSense API client
 * Uses a service account (EVERSENSE_SERVICE_EMAIL / PASSWORD) to authenticate
 * server-to-server. Session is cached and auto-refreshed.
 */
import axios from 'axios'

const BASE_URL = process.env.EVERSENSE_API_URL || 'https://eversense-ai.up.railway.app'

// ─── Service-account session cache ────────────────────────────────────────────

let _cachedToken = null
let _tokenExpiry = 0

async function getServiceToken() {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const email = process.env.EVERSENSE_SERVICE_EMAIL
  const password = process.env.EVERSENSE_SERVICE_PASSWORD

  if (!email || !password) {
    console.warn('[eversense] EVERSENSE_SERVICE_EMAIL / PASSWORD not set — unauthenticated requests will likely fail')
    return null
  }

  console.log('[eversense] signing in service account:', email)
  const res = await axios.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000, validateStatus: () => true }
  )

  if (res.status >= 400) {
    console.error('[eversense] service account login failed:', res.status, res.data)
    return null
  }

  // Extract the cookie token (same logic as auth.js)
  const setCookieHeader = res.headers['set-cookie']
  const allCookies = Array.isArray(setCookieHeader) ? setCookieHeader : (setCookieHeader ? [setCookieHeader] : [])
  const authCookie = allCookies.find(c => c.includes('better-auth.session_token='))
  const token = authCookie
    ? authCookie.split(';')[0].replace('better-auth.session_token=', '').trim()
    : (res.data?.session?.token || res.data?.token || null)

  if (!token) {
    console.error('[eversense] service account login: no token in response')
    return null
  }

  _cachedToken = token
  _tokenExpiry = Date.now() + 22 * 60 * 60 * 1000 // refresh every 22 hours
  console.log('[eversense] service account session acquired:', token.slice(0, 20) + '...')
  return token
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function esGet(path, params) {
  const token = await getServiceToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    headers['Cookie'] = `better-auth.session_token=${token}`
  }

  const res = await axios.get(`${BASE_URL}${path}`, {
    params,
    headers,
    timeout: 10000,
    validateStatus: () => true,
  })

  if (res.status === 401) {
    // Token may have expired — invalidate cache and retry once
    console.warn('[eversense] 401 on', path, '— invalidating session cache and retrying')
    _cachedToken = null
    _tokenExpiry = 0
    const fresh = await getServiceToken()
    if (!fresh) return null
    headers['Authorization'] = `Bearer ${fresh}`
    headers['Cookie'] = `better-auth.session_token=${fresh}`
    const retry = await axios.get(`${BASE_URL}${path}`, { params, headers, timeout: 10000, validateStatus: () => true })
    if (retry.status >= 400) {
      console.error(`[eversense] ${path} → ${retry.status}`, JSON.stringify(retry.data).slice(0, 200))
    }
    return retry.data
  }

  if (res.status >= 400) {
    console.error(`[eversense] ${path} → ${res.status}`, JSON.stringify(res.data).slice(0, 200))
  }
  return res.data
}

// ─── Employees / Users ────────────────────────────────────────────────────────

export async function getOrgMembers(orgId) {
  return esGet(`/api/organizations/${orgId}/members`)
}

export async function getUser(userId) {
  return esGet(`/api/users/${userId}`)
}

// ─── Time Logs ────────────────────────────────────────────────────────────────

export async function getTimeLogs(orgId, params = {}) {
  return esGet(`/api/timers`, { orgId, ...params })
}

export async function getUserTimeLogs(userId, params = {}) {
  return esGet(`/api/timers`, { userId, ...params })
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(orgId, params = {}) {
  return esGet(`/api/tasks`, { orgId, ...params })
}

export async function getUserTasks(userId, params = {}) {
  return esGet(`/api/tasks`, { assignedUserId: userId, ...params })
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(orgId) {
  return esGet(`/api/projects`, { orgId })
}

// ─── Reports / KPIs ───────────────────────────────────────────────────────────

export async function getReports(orgId, params = {}) {
  return esGet(`/api/reports`, { orgId, ...params })
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function getAttendance(orgId, params = {}) {
  return esGet(`/api/attendance`, { orgId, ...params })
}

// ─── KPI aggregation ─────────────────────────────────────────────────────────

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
