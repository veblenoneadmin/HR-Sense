/**
 * GET /api/performance
 * Computes KPI metrics from EverSense time logs + tasks + reports.
 */
import { Router } from 'express'
import { getOrgMembers, buildKpiForUser } from '../lib/eversense.js'

const router = Router()

// GET /api/performance?orgId=xxx&period=2026-02
router.get('/', async (req, res) => {
  try {
    const { orgId, period } = req.query
    if (!orgId || !period) return res.status(400).json({ error: 'orgId and period required' })

    const members = await getOrgMembers(orgId)
    const users = (members?.members ?? members ?? [])
      .map(m => m.user ?? m)
      .filter(u => u.isActive !== false)

    const metrics = await Promise.all(
      users.map(async user => {
        try {
          const kpi = await buildKpiForUser(user.id, period)
          return { ...kpi, userName: user.name, userImage: user.image }
        } catch {
          return { userId: user.id, userName: user.name, period, hoursLogged: 0, tasksCompleted: 0, reportsSubmitted: 0, performanceScore: 0, tier: 'UNDERPERFORMING' }
        }
      })
    )

    const sorted = metrics.sort((a, b) => b.performanceScore - a.performanceScore)

    // Team averages
    const avgHours = metrics.reduce((a, m) => a + m.hoursLogged, 0) / metrics.length
    const avgScore = metrics.reduce((a, m) => a + m.performanceScore, 0) / metrics.length

    res.json({ metrics: sorted, summary: { avgHours: parseFloat(avgHours.toFixed(2)), avgScore: parseFloat(avgScore.toFixed(2)), total: metrics.length }, period })
  } catch (err) {
    console.error('GET /api/performance error:', err.message)
    res.status(500).json({ error: 'Failed to compute performance', detail: err.message })
  }
})

// GET /api/performance/:userId?period=2026-02
router.get('/:userId', async (req, res) => {
  try {
    const { period } = req.query
    if (!period) return res.status(400).json({ error: 'period required' })
    const kpi = await buildKpiForUser(req.params.userId, period)
    res.json(kpi)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
