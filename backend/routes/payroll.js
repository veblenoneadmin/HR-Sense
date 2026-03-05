/**
 * Payroll routes — HR-Sense native, uses EverSense time log data as input.
 */
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { buildKpiForUser, getUserTimeLogs } from '../lib/eversense.js'

const router = Router()

// GET /api/payroll?period=2026-02
router.get('/', async (req, res) => {
  try {
    const { period } = req.query
    const where = {}
    if (period) where.period = period

    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          select: { esUserId: true, title: true, department: { select: { name: true } } },
        },
      },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
    })

    const totalGross = records.reduce((a, r) => a + r.baseSalary + r.overtimePay + r.bonus, 0)
    const totalNet = records.reduce((a, r) => a + r.netPay, 0)
    const totalDeductions = records.reduce((a, r) => a + r.deductions + r.taxAmount, 0)

    res.json({ records, summary: { totalGross, totalNet, totalDeductions, count: records.length } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payroll/generate — generate payroll for a period from EverSense data
router.post('/generate', async (req, res) => {
  try {
    const { period } = req.body
    if (!period) return res.status(400).json({ error: 'period required' })

    const employees = await prisma.employeeProfile.findMany({
      where: { isActive: true },
      include: { department: true },
    })

    const results = await Promise.all(
      employees.map(async (emp) => {
        // Check if payroll already exists
        const existing = await prisma.payrollRecord.findUnique({
          where: { employeeId_period: { employeeId: emp.id, period } },
        })
        if (existing) return existing

        // Pull EverSense KPI data
        let esHours = 0
        let esTasks = 0
        let overtimeHours = 0
        try {
          const kpi = await buildKpiForUser(emp.esUserId, period)
          esHours = kpi.hoursLogged
          esTasks = kpi.tasksCompleted
          const settings = await prisma.hrSettings.findFirst()
          const weeklyThreshold = (settings?.overtimeThreshold ?? 40)
          const monthlyThreshold = weeklyThreshold * 4
          overtimeHours = Math.max(0, esHours - monthlyThreshold)
        } catch { /* skip if EverSense unavailable */ }

        // Calculate pay
        const hourlyRate = emp.baseSalary / 160 // assuming 160h/month standard
        const overtimePay = overtimeHours * hourlyRate * 1.5
        const grossPay = emp.baseSalary + overtimePay
        const taxRate = 0.15 // simplified flat tax
        const taxAmount = grossPay * taxRate
        const deductions = grossPay * 0.05 // health/pension
        const netPay = grossPay - taxAmount - deductions

        return prisma.payrollRecord.create({
          data: {
            employeeId: emp.id,
            period,
            baseSalary: emp.baseSalary,
            overtimePay: parseFloat(overtimePay.toFixed(2)),
            bonus: 0,
            deductions: parseFloat(deductions.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            netPay: parseFloat(netPay.toFixed(2)),
            hoursWorked: esHours,
            overtimeHours,
            esHoursLogged: esHours,
            esTasksCompleted: esTasks,
            status: 'DRAFT',
          },
        })
      })
    )

    res.status(201).json({ records: results, period })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/payroll/:id/process
router.patch('/:id/process', async (req, res) => {
  try {
    const record = await prisma.payrollRecord.update({
      where: { id: req.params.id },
      data: { status: 'PROCESSED' },
    })
    res.json({ record })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/payroll/:id/pay
router.patch('/:id/pay', async (req, res) => {
  try {
    const record = await prisma.payrollRecord.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
    })
    res.json({ record })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/payroll/bulk-pay — pay all PROCESSED records for a period
router.patch('/bulk-pay', async (req, res) => {
  try {
    const { period } = req.body
    const result = await prisma.payrollRecord.updateMany({
      where: { period, status: 'PROCESSED' },
      data: { status: 'PAID', paidAt: new Date() },
    })
    res.json({ updated: result.count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
