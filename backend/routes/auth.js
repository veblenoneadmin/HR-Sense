import express from 'express'
import axios from 'axios'

const router = express.Router()

// POST /api/auth/login — proxy credentials to EverSense better-auth
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const eversenseUrl = process.env.EVERSENSE_API_URL || 'https://eversense-ai.up.railway.app'

  try {
    const response = await axios.post(
      `${eversenseUrl}/api/auth/sign-in/email`,
      { email, password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: () => true,
      }
    )

    if (response.status >= 400) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const data = response.data
    // better-auth returns { user: {...}, session: { token: '...' } }
    const user = data?.user
    const token = data?.session?.token || data?.token || ''

    if (!user) {
      return res.status(401).json({ error: 'Login failed' })
    }

    // Check role — only OWNER and ADMIN can access HR-Sense
    try {
      const orgRes = await axios.get(`${eversenseUrl}/api/organizations`, {
        headers: { Cookie: `better-auth.session_token=${token}` },
        timeout: 5000,
        validateStatus: () => true,
      })
      const orgs = orgRes.data?.organizations ?? []
      const role = orgs[0]?.role?.toUpperCase() ?? ''
      if (!['OWNER', 'ADMIN'].includes(role)) {
        return res.status(403).json({ error: 'Access denied. Only Owner or Admin can access HR-Sense.' })
      }
      user.role = role
      user.orgId = orgs[0]?.id ?? ''
      user.orgName = orgs[0]?.name ?? ''
    } catch {
      // If we can't verify role, deny access to be safe
      return res.status(403).json({ error: 'Could not verify user role. Access denied.' })
    }

    return res.json({ user, token })
  } catch (err) {
    console.error('Auth proxy error:', err.message)
    return res.status(503).json({ error: 'Authentication service unavailable' })
  }
})

export default router
