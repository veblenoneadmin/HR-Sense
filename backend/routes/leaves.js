/**
 * Leave management routes — HR-Sense native (stored in own MySQL DB)
 */
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { syncLeaveToEverSense } from '../lib/eversense.js'

const router = Router()

// GET /api/leaves?orgId=xxx&status=PENDING
router.get('/', async (req, res) => {
  try {
    const { status, employeeId, year } = req.query
    const where = {}
    if (status) where.status = status
    if (employeeId) where.employeeId = employeeId

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { esUserId: true, title: true, department: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ requests })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/leaves/:id
router.get('/:id', async (req, res) => {
  try {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: { employee: { include: { department: true } } },
    })
    if (!request) return res.status(404).json({ error: 'Not found' })
    res.json({ request })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/leaves
router.post('/', async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, days, reason } = req.body
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days,
        reason,
        status: 'PENDING',
      },
      include: { employee: { include: { department: true } } },
    })
    res.status(201).json({ request })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/leaves/:id/approve
router.patch('/:id/approve', async (req, res) => {
  try {
    const { approvedBy, notes } = req.body
    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date(), notes },
      include: { employee: { select: { esUserId: true } } },
    })
    // Update leave balance
    await _deductLeaveBalance(request.employeeId, request.type, request.days)
    res.json({ request })

    // Fire-and-forget sync to EverSense (after response is sent)
    if (request.employee?.esUserId) {
      syncLeaveToEverSense({
        esUserId:   request.employee.esUserId,
        type:       request.type,
        status:     'APPROVED',
        startDate:  request.startDate,
        endDate:    request.endDate,
        days:       request.days,
        reason:     request.reason,
        approvedAt: request.approvedAt,
      }).catch(err => console.error('[leaves] EverSense sync error:', err.message))
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/leaves/:id/reject
router.patch('/:id/reject', async (req, res) => {
  try {
    const { rejectedBy, notes } = req.body
    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectedBy, rejectedAt: new Date(), notes },
    })
    res.json({ request })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/leaves/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const request = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })
    res.json({ request })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/leaves/balance/:employeeId?year=2026
router.get('/balance/:employeeId', async (req, res) => {
  try {
    const year = parseInt(req.query.year ?? new Date().getFullYear())
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: req.params.employeeId, year },
    })
    res.json({ balances, year })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function _deductLeaveBalance(employeeId, type, days) {
  const year = new Date().getFullYear()
  await prisma.leaveBalance.updateMany({
    where: { employeeId, year, type },
    data: { used: { increment: days }, remaining: { decrement: days } },
  })
}

export default router
