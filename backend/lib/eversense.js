/**
 * EverSense API client
 * Uses a service account (EVERSENSE_SERVICE_EMAIL / PASSWORD) to authenticate
 * server-to-server. Session is cached and auto-refreshed.
 */
import axios from 'axios'

const BASE_URL = process.env.EVERSENSE_API_URL || 'https://eversense-ai.up.railway.app'

// ─── Service-account session cache ────────────────────────────────────────────

let _cachedToken = null
let _cachedCookie = null  // full "CookieName=Value" string to forward as-is
let _tokenExpiry = 0

async function getServiceSession() {
  if (_cachedToken && Date.now() < _tokenExpiry) return { token: _cachedToken, cookie: _cachedCookie }

  const email = process.env.EVERSENSE_SERVICE_EMAIL
  const password = process.env.EVERSENSE_SERVICE_PASSWORD

  if (!email || !password) {
    console.warn('[eversense] EVERSENSE_SERVICE_EMAIL / PASSWORD not set — unauthenticated requests will likely fail')
    return { token: null, cookie: null }
  }

  console.log('[eversense] signing in service account:', email)
  const res = await axios.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000, validateStatus: () => true }
  )

  if (res.status >= 400) {
    console.error('[eversense] service account login failed:', res.status, res.data)
    return { token: null, cookie: null }
  }

  // EverSense on Railway uses __Secure-better-auth.session_token (HTTPS prefix)
  // cookiePart = full "CookieName=Value" before the semicolon
  const setCookieHeader = res.headers['set-cookie']
  const allCookies = Array.isArray(setCookieHeader) ? setCookieHeader : (setCookieHeader ? [setCookieHeader] : [])
  const authCookie = allCookies.find(c => c.includes('better-auth.session_token='))
  const cookiePart = authCookie ? authCookie.split(';')[0].trim() : null
  // token = value only (everything after the first "=")
  const token = cookiePart
    ? cookiePart.split('=').slice(1).join('=')
    : (res.data?.session?.token || res.data?.token || null)

  if (!token) {
    console.error('[eversense] service account login: no token in response')
    return { token: null, cookie: null }
  }

  _cachedToken = token
  _cachedCookie = cookiePart  // e.g. "__Secure-better-auth.session_token=VALUE"
  _tokenExpiry = Date.now() + 22 * 60 * 60 * 1000
  console.log('[eversense] service account session acquired, cookie:', cookiePart?.slice(0, 40) + '...')
  return { token, cookie: cookiePart }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function buildHeaders(token, cookie) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  if (cookie) h['Cookie'] = cookie
  return h
}

// userToken: the logged-in user's EverSense token (forwarded from Authorization header).
// If provided, use it directly. If not (or if it 401s), fall back to service account.
async function esGet(path, params, userToken = null) {
  // Prefer the user's own token — it has access to their org
  let token = userToken
  let cookie = userToken ? `__Secure-better-auth.session_token=${userToken}` : null

  if (!token) {
    const svc = await getServiceSession()
    token = svc.token
    cookie = svc.cookie
  }

  const res = await axios.get(`${BASE_URL}${path}`, {
    params,
    headers: buildHeaders(token, cookie),
    timeout: 10000,
    validateStatus: () => true,
  })

  // On 401, try the service account as a fallback (user token may have expired)
  if (res.status === 401) {
    console.warn('[eversense] 401 on', path, '— trying service account fallback')
    _cachedToken = null
    _cachedCookie = null
    _tokenExpiry = 0
    const fresh = await getServiceSession()
    if (!fresh.token) return null
    const retry = await axios.get(`${BASE_URL}${path}`, {
      params,
      headers: buildHeaders(fresh.token, fresh.cookie),
      timeout: 10000,
      validateStatus: () => true,
    })
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

async function esPost(path, body) {
  const svc = await getServiceSession()
  let { token, cookie } = svc

  const res = await axios.post(`${BASE_URL}${path}`, body, {
    headers: buildHeaders(token, cookie),
    timeout: 10000,
    validateStatus: () => true,
  })

  // On 401, refresh service session and retry once
  if (res.status === 401) {
    console.warn('[eversense] 401 on POST', path, '— trying service account fallback')
    _cachedToken = null
    _cachedCookie = null
    _tokenExpiry = 0
    const fresh = await getServiceSession()
    if (!fresh.token) return null
    const retry = await axios.post(`${BASE_URL}${path}`, body, {
      headers: buildHeaders(fresh.token, fresh.cookie),
      timeout: 10000,
      validateStatus: () => true,
    })
    if (retry.status >= 400) {
      console.error(`[eversense] POST ${path} → ${retry.status}`, JSON.stringify(retry.data).slice(0, 200))
    }
    return retry.data
  }

  if (res.status >= 400) {
    console.error(`[eversense] POST ${path} → ${res.status}`, JSON.stringify(res.data).slice(0, 200))
  }
  return res.data
}

// ─── Leave Sync ───────────────────────────────────────────────────────────────

export async function syncLeaveToEverSense(leave) {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    console.warn('[eversense] INTERNAL_API_SECRET not set — skipping leave sync')
    return
  }

  const { esUserId, type, status, startDate, endDate, days, reason, approvedAt } = leave

  // Temporarily inject the secret header via axios interceptor-free approach:
  // esPost uses service session auth — also pass the internal secret so EverSense accepts it
  const res = await axios.post(
    `${BASE_URL}/api/leaves`,
    { userId: esUserId, type, status: status || 'APPROVED', startDate, endDate, days, reason, approvedAt },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      timeout: 10000,
      validateStatus: () => true,
    }
  )

  if (res.status === 201) {
    console.log(`[eversense] ✅ Leave synced for esUserId=${esUserId} type=${type} days=${days}`)
  } else {
    console.error(`[eversense] ❌ Leave sync failed: ${res.status}`, JSON.stringify(res.data).slice(0, 200))
  }
}

// ─── Employees / Users ────────────────────────────────────────────────────────

export async function getOrgMembers(orgId, userToken) {
  // Try the members endpoint first; fall back to allMembers from attendance/logs
  const data = await esGet(`/api/organizations/${orgId}/members`, null, userToken)
  if (data && !data.error) return data

  console.warn('[eversense] members endpoint failed, falling back to attendance/logs allMembers')
  const attendance = await esGet(`/api/attendance/logs`, { orgId }, userToken)
  const allMembers = attendance?.allMembers ?? []
  // Normalize to the same shape the rest of the code expects: { members: [{ user: {...} }] }
  return { members: allMembers.map(m => ({ userId: m.id, role: m.role, user: m })) }
}

export async function getUser(userId, userToken) {
  return esGet(`/api/users/${userId}`, null, userToken)
}

// ─── Time Logs ────────────────────────────────────────────────────────────────
// EverSense endpoints: /api/timers/recent (all entries), /api/timers/team (grouped by member)

export async function getTimeLogs(orgId, params = {}, userToken) {
  return esGet(`/api/timers/recent`, { orgId, ...params }, userToken)
}

export async function getUserTimeLogs(userId, params = {}, userToken) {
  return esGet(`/api/timers/recent`, { userId, ...params }, userToken)
}

export async function getTeamTimerStats(orgId, params = {}, userToken) {
  return esGet(`/api/timers/team`, { orgId, ...params }, userToken)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(orgId, params = {}, userToken) {
  return esGet(`/api/tasks/org/${orgId}`, params, userToken)
}

export async function getUserTasks(userId, params = {}, userToken) {
  return esGet(`/api/tasks`, { assignedUserId: userId, ...params }, userToken)
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(orgId, userToken) {
  return esGet(`/api/projects`, { orgId }, userToken)
}

// ─── Reports / KPIs ───────────────────────────────────────────────────────────

export async function getReports(orgId, params = {}, userToken) {
  return esGet(`/api/user-reports`, { orgId, ...params }, userToken)
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function getAttendanceLogs(orgId, params = {}, userToken) {
  return esGet(`/api/attendance/logs`, { orgId, ...params }, userToken)
}

// ─── KPI aggregation ─────────────────────────────────────────────────────────

export async function buildKpiForUser(userId, period, userToken, orgId = null) {
  const [startDate, endDate] = getPeriodBounds(period)
  const [timerLogs, tasks, reports] = await Promise.all([
    getUserTimeLogs(userId, { startDate, endDate }, userToken),
    getUserTasks(userId, { startDate, endDate }, userToken),
    getReports(orgId, { userId, startDate, endDate }, userToken),
  ])

  // Use task-based timer logs for hours — if no timers exist for the period, hours = 0
  const logs = timerLogs?.data ?? timerLogs?.logs ?? timerLogs ?? []
  const hoursLogged = Array.isArray(logs) && logs.length > 0
    ? logs.reduce((sum, t) => {
        // EverSense timer: duration in seconds
        const secs = t.duration ?? t.durationSeconds ?? 0
        return sum + secs
      }, 0) / 3600
    : 0

  const taskList = tasks?.data ?? tasks?.tasks ?? tasks ?? []
  const completedTasks = Array.isArray(taskList)
    ? taskList.filter(t => t.status === 'DONE' || t.status === 'completed' || t.status === 'done').length
    : 0

  const reportList = reports?.data ?? reports?.reports ?? reports ?? []
  const reportsCount = Array.isArray(reportList) ? reportList.length : 0

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
