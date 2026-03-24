/**
 * EverSense data layer — direct DB queries via shared MySQL database.
 * Both HR-Sense and EverSense share the same MySQL instance, so we query
 * EverSense tables directly instead of calling the HTTP API.
 */
import { prisma } from './prisma.js'

// ─── Org Members ─────────────────────────────────────────────────────────────

export async function getOrgMembers(orgId) {
  const memberships = await prisma.esMembership.findMany({ where: { orgId } })
  const userIds = memberships.map(m => m.userId)
  const users = await prisma.esUser.findMany({ where: { id: { in: userIds } } })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return {
    members: memberships.map(m => ({
      userId: m.userId,
      role: m.role,
      user: userMap[m.userId] ?? { id: m.userId, name: 'Unknown', email: '' },
    })),
  }
}

export async function getUser(userId) {
  return prisma.esUser.findUnique({ where: { id: userId } })
}

// ─── Time Logs ────────────────────────────────────────────────────────────────

export async function getTimeLogs(orgId, params = {}) {
  const { startDate, endDate, userId } = params
  const where = { orgId }
  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.begin = {}
    if (startDate) where.begin.gte = new Date(startDate)
    if (endDate) where.begin.lte = new Date(endDate)
  }
  const logs = await prisma.esTimeLog.findMany({ where, orderBy: { begin: 'desc' } })
  return { data: logs }
}

export async function getUserTimeLogs(userId, params = {}) {
  const { startDate, endDate } = params
  const where = { userId }
  if (startDate || endDate) {
    where.begin = {}
    if (startDate) where.begin.gte = new Date(startDate)
    if (endDate) where.begin.lte = new Date(endDate)
  }
  const logs = await prisma.esTimeLog.findMany({ where, orderBy: { begin: 'desc' } })
  return logs
}

export async function getTeamTimerStats(orgId, params = {}) {
  const { startDate, endDate } = params
  const where = { orgId }
  if (startDate || endDate) {
    where.begin = {}
    if (startDate) where.begin.gte = new Date(startDate)
    if (endDate) where.begin.lte = new Date(endDate)
  }
  const logs = await prisma.esTimeLog.findMany({ where })
  const grouped = {}
  for (const log of logs) {
    if (!grouped[log.userId]) grouped[log.userId] = { userId: log.userId, totalDuration: 0 }
    grouped[log.userId].totalDuration += log.duration
  }
  return Object.values(grouped)
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(orgId, params = {}) {
  const { startDate, endDate } = params
  const where = { orgId }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }
  const tasks = await prisma.esMacroTask.findMany({ where, orderBy: { createdAt: 'desc' } })
  return { tasks }
}

export async function getUserTasks(userId, params = {}) {
  const { startDate, endDate, orgId } = params
  const where = { userId }
  if (orgId) where.orgId = orgId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }
  const tasks = await prisma.esMacroTask.findMany({ where, orderBy: { createdAt: 'desc' } })
  return tasks
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function getAttendanceLogs(orgId, params = {}) {
  const { startDate, endDate, userId } = params
  const where = { orgId }
  if (userId) where.userId = userId
  if (startDate || endDate) {
    where.timeIn = {}
    if (startDate) where.timeIn.gte = new Date(startDate)
    if (endDate) where.timeIn.lte = new Date(endDate)
  }
  const logs = await prisma.esAttendanceLog.findMany({ where, orderBy: { timeIn: 'desc' } })
  return {
    data: logs.map(log => ({
      id: log.id,
      userId: log.userId,
      memberId: log.userId,
      timeIn: log.timeIn,
      timeOut: log.timeOut,
      duration: log.duration,
      durationMins: Math.floor(log.duration / 60),
      isActive: log.timeOut == null,
      date: log.date,
    })),
  }
}

// ─── Leave Sync ──────────────────────────────────────────────────────────────
// Leave data is written directly to the shared `leaves` table in the approve
// handler (leaves.js). This function is kept for import compatibility.
export async function syncLeaveToEverSense(_leave) {}

// ─── Leave Query ──────────────────────────────────────────────────────────────

export async function getEverSenseLeaves({ userId, orgId } = {}) {
  const where = {}
  if (userId) where.userId = userId
  if (orgId) where.orgId = orgId
  return prisma.leave.findMany({ where, orderBy: { startDate: 'desc' }, take: 100 })
}

// ─── KPI aggregation ─────────────────────────────────────────────────────────

export async function buildKpiForUser(userId, period, _userToken = null, orgId = null) {
  const [startDate, endDate] = getPeriodBounds(period)

  const [timeLogs, tasks] = await Promise.all([
    prisma.esTimeLog.findMany({
      where: {
        userId,
        begin: { gte: new Date(startDate), lte: new Date(endDate) },
        ...(orgId ? { orgId } : {}),
      },
    }),
    prisma.esMacroTask.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        ...(orgId ? { orgId } : {}),
      },
    }),
  ])

  const hoursLogged = timeLogs.reduce((sum, t) => sum + (t.duration ?? 0), 0) / 3600
  const completedTasks = tasks.filter(t => ['done', 'completed', 'DONE'].includes(t.status)).length

  const AVG_HOURS = 48.19
  const AVG_TASKS = 3.5
  const performanceScore = (hoursLogged / AVG_HOURS + completedTasks / AVG_TASKS) / 2

  const tier =
    hoursLogged > AVG_HOURS * 1.6 ? 'BURNOUT_RISK'
    : performanceScore >= 1.5 ? 'STAR'
    : performanceScore >= 1.0 ? 'GOOD'
    : performanceScore >= 0.5 ? 'AVERAGE'
    : 'UNDERPERFORMING'

  return { userId, period, hoursLogged, tasksCompleted: completedTasks, reportsSubmitted: 0, performanceScore, tier }
}

function getPeriodBounds(period) {
  const [year, month] = period.split('-').map(Number)
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()
  return [start, end]
}
