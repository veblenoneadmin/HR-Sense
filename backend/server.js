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
import authRouter from './routes/auth.js'
import notificationsRouter from './routes/notifications.js'

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

// Promote X-Org-Id header into req.query.orgId so all routes get it automatically
app.use((req, _res, next) => {
  if (!req.query.orgId && req.headers['x-org-id']) {
    req.query.orgId = req.headers['x-org-id']
  }
  next()
})

// ─── Debug: probe EverSense API structure ─────────────────────────────────────
// Visit /api/debug/eversense?orgId=xxx  (requires Authorization: Bearer <token>)

app.get('/api/debug/service-auth', async (req, res) => {
  const axios = (await import('axios')).default
  const base = process.env.EVERSENSE_API_URL || 'https://eversense-ai.up.railway.app'
  const email = process.env.EVERSENSE_SERVICE_EMAIL
  const password = process.env.EVERSENSE_SERVICE_PASSWORD
  const { orgId } = req.query

  const result = {
    env: {
      EVERSENSE_API_URL: base,
      EVERSENSE_SERVICE_EMAIL: email || '(not set)',
      EVERSENSE_SERVICE_PASSWORD: password ? '(set, ' + password.length + ' chars)' : '(not set)',
    },
    login: null,
    members: null,
    timers: null,
  }

  if (!email || !password) {
    return res.json({ ...result, error: 'Missing env vars' })
  }

  try {
    const loginRes = await axios.post(`${base}/api/auth/sign-in/email`, { email, password }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      validateStatus: () => true,
    })
    const setCookie = loginRes.headers['set-cookie'] ?? []
    const allCookies = Array.isArray(setCookie) ? setCookie : [setCookie]
    const authCookie = allCookies.find(c => c.includes('better-auth.session_token='))
    // cookiePart = "CookieName=Value" (e.g. "__Secure-better-auth.session_token=VALUE")
    const cookiePart = authCookie ? authCookie.split(';')[0].trim() : null
    // token = just the value after the first "="
    const token = cookiePart
      ? cookiePart.split('=').slice(1).join('=')
      : (loginRes.data?.session?.token || loginRes.data?.token || null)

    result.login = {
      status: loginRes.status,
      user: loginRes.data?.user ?? null,
      cookiePart: cookiePart ? cookiePart.slice(0, 50) + '...' : null,
      tokenExtracted: token ? token.slice(0, 20) + '...' : null,
    }

    if (token && orgId) {
      const headers = {
        Authorization: `Bearer ${token}`,
        Cookie: cookiePart,
      }
      const membersRes = await axios.get(`${base}/api/organizations/${orgId}/members`, {
        headers, timeout: 8000, validateStatus: () => true,
      })
      result.members = { status: membersRes.status, data: membersRes.data }

      // Probe correct EverSense time-log endpoints
      for (const ep of ['/api/timers/recent', '/api/timers/team', '/api/attendance/logs', '/api/user-reports']) {
        const r = await axios.get(`${base}${ep}`, {
          params: { orgId }, headers, timeout: 8000, validateStatus: () => true,
        })
        result[`probe_${ep.replace(/\//g, '_')}`] = { status: r.status, sample: JSON.stringify(r.data).slice(0, 300) }
      }
    }
  } catch (e) {
    result.error = e.message
  }

  res.json(result)
})

app.get('/api/debug/eversense', async (req, res) => {
  const axios = (await import('axios')).default
  const base = process.env.EVERSENSE_API_URL || 'https://eversense-ai.up.railway.app'
  const token = req.headers.authorization?.replace('Bearer ', '') || ''
  const { orgId } = req.query
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}`, Cookie: `better-auth.session_token=${token}` }),
  }
  const probe = async (path) => {
    try {
      const r = await axios.get(`${base}${path}`, { headers, timeout: 8000, validateStatus: () => true })
      return { status: r.status, data: r.data }
    } catch (e) {
      return { error: e.message }
    }
  }
  const results = {}
  results['/api/organizations'] = await probe('/api/organizations')
  if (orgId) {
    results[`/api/organizations/${orgId}/members`] = await probe(`/api/organizations/${orgId}/members`)
    results[`/api/organizations/${orgId}`] = await probe(`/api/organizations/${orgId}`)
  }
  results['/api/auth/get-session'] = await probe('/api/auth/get-session')
  results['/api/timers'] = await probe('/api/timers' + (orgId ? `?orgId=${orgId}` : ''))
  res.json(results)
})

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

app.use('/api/auth', authRouter)
app.use('/api/notifications', notificationsRouter)
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
