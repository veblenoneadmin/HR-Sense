import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ departments: departments.map(d => ({ ...d, memberCount: d._count.employees })) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, headEsId, orgId } = req.body
    const dept = await prisma.department.create({ data: { name, headEsId, orgId } })
    res.status(201).json({ department: dept })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body })
    res.json({ department: dept })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
