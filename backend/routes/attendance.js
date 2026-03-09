/**
 * GET /api/attendance
 * Proxies time log data from EverSense and computes attendance summaries.
 */
import { Router } from 'express'
import { getTimeLogs, getOrgMembers } from '../lib/eversense.js'

const router = Router()

// GET /api/attendance?orgId=xxx&startDate=2026-02-16&endDate=2026-02-22
router.get('/', async (req, res) => {
  try {
    const { orgId, startDate, endDate, userId } = req.query
    if (!orgId) return res.status(400).json({ error: 'orgId required' })

    const token = req.headers.authorization?.replace('Bearer ', '') || ''

    const [timeLogs, members] = await Promise.all([
      getTimeLogs(orgId, { startDate, endDate, userId }, token),
      getOrgMembers(orgId, token),
    ])

    const logs = timeLogs?.data ?? timeLogs ?? []
    const users = (members?.members ?? members ?? []).map(m => m.user ?? m)

    // Aggregate by user
    const userMap = {}
    for (const log of logs) {
      const uid = log.userId
      if (!userMap[uid]) {
        const user = users.find(u => u.id === uid) ?? { id: uid, name: 'Unknown' }
        userMap[uid] = { userId: uid, userName: user.name, totalMinutes: 0, sessions: 0, projects: new Set() }
      }
      userMap[uid].totalMinutes += log.duration ?? 0
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
