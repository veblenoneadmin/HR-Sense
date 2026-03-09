/**
 * GET /api/attendance
 * Proxies time log data from EverSense and computes attendance summaries.
 */
import { Router } from 'express'
import { getAttendanceLogs, getOrgMembers } from '../lib/eversense.js'

const router = Router()

// GET /api/attendance?orgId=xxx&startDate=2026-02-16&endDate=2026-02-22
router.get('/', async (req, res) => {
  try {
    const { orgId, startDate, endDate, userId } = req.query
    if (!orgId) return res.status(400).json({ error: 'orgId required' })

    const userToken = req.headers.authorization?.replace('Bearer ', '') || null
    const [timeLogs, members] = await Promise.all([
      getAttendanceLogs(orgId, { startDate, endDate, userId }, userToken),
      getOrgMembers(orgId, userToken),
    ])

    const rawLogs = timeLogs?.data ?? timeLogs?.logs ?? timeLogs ?? []
    const users = (members?.members ?? members ?? []).map(m => m.user ?? m)

    // Normalize EverSense attendance format to HR-Sense format
    const logs = rawLogs.map(log => ({
      id: log.id,
      userId: log.memberId ?? log.userId,
      userName: log.memberName ?? log.userName,
      duration: log.durationMins != null ? log.durationMins * 60 : (log.duration ?? 0), // normalize to seconds (frontend divides by 3600)
      startTime: log.timeIn ?? log.startTime,
      endTime: log.timeOut ?? log.endTime,
      projectId: log.projectId ?? null,
      projectName: log.projectName ?? null,
      isRunning: log.isActive ?? false,
    }))

    // Aggregate by user
    const userMap = {}
    for (const log of logs) {
      const uid = log.userId
      if (!uid) continue
      if (!userMap[uid]) {
        const user = users.find(u => u.id === uid) ?? { id: uid, name: log.userName ?? 'Unknown' }
        userMap[uid] = { userId: uid, userName: user.name ?? log.userName, totalMinutes: 0, sessions: 0, projects: new Set() }
      }
      userMap[uid].totalMinutes += (log.duration ?? 0) / 60 // duration is in seconds, accumulate minutes
      userMap[uid].sessions++
      if (log.projectId) userMap[uid].projects.add(log.projectId)
    }

    const summary = Object.values(userMap).map(u => ({
      ...u,
      totalHours: parseFloat((u.totalMinutes / 60).toFixed(2)),
      projectCount: u.projects.size,
      projects: undefined,
      status: u.totalMinutes / 60 > 50 ? 'OVERTIME' : u.totalMinutes / 60 < 20 ? 'LOW' : 'NORMAL',
    }))

    res.json({ logs, summary, period: { startDate, endDate } })
  } catch (err) {
    console.error('GET /api/attendance error:', err.message)
    res.status(500).json({ error: 'Failed to fetch attendance', detail: err.message })
  }
})

export default router

