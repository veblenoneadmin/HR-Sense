import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from './lib/prisma.js'

// Routes
import employeesRouter from './routes/employees.js'
import attendanceRouter from './routes/attendance.js'
import performanceRouter from './routes/performance.js'
import leavesRouter from './routes/leaves.js'
import payrollRouter from './routes/payroll.js'
import departmentsRouter from './routes/departments.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))

// ─── Health ────────────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/employees', employeesRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/performance', performanceRouter)
app.use('/api/leaves', leavesRouter)
app.use('/api/payroll', payrollRouter)
app.use('/api/departments', departmentsRouter)

// ─── Serve Frontend (production) ─────────────────────────────────────────────
// Same pattern as EverSense: backend serves the Vite dist build

const frontendDist = path.join(__dirname, '../frontend/dist')
app.use(express.static(frontendDist))

// SPA fallback — all non-API routes return index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' })
  }
  res.sendFile(path.join(frontendDist, 'index.html'))
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`HR-Sense backend running on port ${PORT}`)
  console.log(`EverSense API: ${process.env.EVERSENSE_API_URL ?? '(not configured)'}`)
  console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
