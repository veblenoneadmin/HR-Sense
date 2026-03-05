/**
 * GET /api/employees
 * Fetches members from EverSense and enriches with HR-Sense profile data.
 */
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { getOrgMembers } from '../lib/eversense.js'

const router = Router()

// GET /api/employees?orgId=xxx
router.get('/', async (req, res) => {
  try {
    const { orgId } = req.query
    if (!orgId) return res.status(400).json({ error: 'orgId required' })

    // Fetch from EverSense
    const esMembers = await getOrgMembers(orgId)

    // Enrich with HR-Sense profiles
    const profiles = await prisma.employeeProfile.findMany({
      where: { esUserId: { in: (esMembers?.members ?? esMembers ?? []).map(m => m.userId ?? m.id) } },
      include: { department: true },
    })

    const profileMap = Object.fromEntries(profiles.map(p => [p.esUserId, p]))

    const employees = (esMembers?.members ?? esMembers ?? []).map(member => {
      const user = member.user ?? member
      const profile = profileMap[user.id]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: member.role ?? user.role,
        isActive: user.isActive ?? true,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        // HR-Sense enrichment
        employeeCode: profile?.employeeCode ?? null,
        title: profile?.title ?? null,
        department: profile?.department?.name ?? null,
        baseSalary: profile?.baseSalary ?? null,
        startDate: profile?.startDate ?? null,
      }
    })

    res.json({ employees })
  } catch (err) {
    console.error('GET /api/employees error:', err.message)
    res.status(500).json({ error: 'Failed to fetch employees', detail: err.message })
  }
})

// GET /api/employees/:esUserId
router.get('/:esUserId', async (req, res) => {
  try {
    const profile = await prisma.employeeProfile.findUnique({
      where: { esUserId: req.params.esUserId },
      include: {
        department: true,
        leaveBalances: true,
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
        payrollRecords: { orderBy: { period: 'desc' }, take: 6 },
      },
    })
    if (!profile) return res.status(404).json({ error: 'Employee not found' })
    res.json({ profile })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/employees  — create HR profile for an EverSense user
router.post('/', async (req, res) => {
  try {
    const { esUserId, employeeCode, title, baseSalary, currency, startDate, departmentId } = req.body
    const profile = await prisma.employeeProfile.create({
      data: { esUserId, employeeCode, title, baseSalary: baseSalary ?? 0, currency: currency ?? 'USD', startDate: new Date(startDate), departmentId },
      include: { department: true },
    })
    res.status(201).json({ profile })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/employees/:id
router.patch('/:id', async (req, res) => {
  try {
    const profile = await prisma.employeeProfile.update({
      where: { id: req.params.id },
      data: req.body,
      include: { department: true },
    })
    res.json({ profile })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
