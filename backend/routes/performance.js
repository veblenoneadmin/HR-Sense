/**
 * GET /api/performance
 * Computes KPI metrics from EverSense time logs + tasks + reports.
 */
import { Router } from 'express'
import { getOrgMembers, buildKpiForAllUsers, buildKpiForUser } from '../lib/eversense.js'

const router = Router()

// GET /api/performance?orgId=xxx&period=2026-02
router.get('/', async (req, res) => {
  try {
    const { orgId, period } = req.query
    if (!orgId || !period) return res.status(400).json({ error: 'orgId and period required' })

    const userToken = req.headers.authorization?.replace('Bearer ', '') || null
    const members = await getOrgMembers(orgId, userToken)
    const users = (members?.members ?? members ?? [])
      .map(m => m.user ?? m)
      .filter(u => u.isActive !== false)

    // Fetch all org data in 3 API calls instead of 3× per user
    const metrics = await buildKpiForAllUsers(users, period, userToken, orgId)

    const sorted = metrics.sort((a, b) => b.performanceScore - a.performanceScore)

    const avgHours = metrics.length > 0 ? metrics.reduce((a, m) => a + m.hoursLogged, 0) / metrics.length : 0
    const avgScore = metrics.length > 0 ? metrics.reduce((a, m) => a + m.performanceScore, 0) / metrics.length : 0

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
