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

    // Capture the Set-Cookie header from sign-in response to forward to organizations
    const setCookieHeader = response.headers['set-cookie']
    const cookieString = Array.isArray(setCookieHeader)
      ? setCookieHeader.map(c => c.split(';')[0]).join('; ')
      : (setCookieHeader ?? '').split(';')[0]

    console.log('[auth] token:', token ? token.slice(0, 20) + '...' : '(empty)')
    console.log('[auth] set-cookie:', cookieString ? cookieString.slice(0, 100) : '(none)')

    if (!user) {
      return res.status(401).json({ error: 'Login failed' })
    }

    // Check role — only OWNER and ADMIN can access HR-Sense
    try {
      const orgRes = await axios.get(`${eversenseUrl}/api/organizations`, {
        headers: {
          ...(cookieString ? { Cookie: cookieString } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 5000,
        validateStatus: () => true,
      })
      console.log('[auth] /api/organizations status:', orgRes.status)
      console.log('[auth] /api/organizations data:', JSON.stringify(orgRes.data).slice(0, 500))

      // Handle both { organizations: [...] } and direct array responses
      const rawOrgs = orgRes.data?.organizations ?? orgRes.data?.data ?? (Array.isArray(orgRes.data) ? orgRes.data : [])
      const orgs = Array.isArray(rawOrgs) ? rawOrgs : []
      const firstOrg = orgs[0] ?? {}
      // role may be at firstOrg.role or firstOrg.membership?.role
      const rawRole = firstOrg.role ?? firstOrg.membership?.role ?? firstOrg.userRole ?? ''
      const role = rawRole.toUpperCase()
      console.log('[auth] org count:', orgs.length, '| raw role:', rawRole, '| role:', role)

      if (!['OWNER', 'ADMIN'].includes(role)) {
        return res.status(403).json({ error: 'Access denied. Only Owner or Admin can access HR-Sense.' })
      }
      user.role = role
      user.orgId = firstOrg.id ?? firstOrg.organizationId ?? ''
      user.orgName = firstOrg.name ?? firstOrg.organization?.name ?? ''
    } catch (roleErr) {
      console.error('[auth] role check error:', roleErr.message)
      return res.status(403).json({ error: 'Could not verify user role. Access denied.' })
    }

    return res.json({ user, token })
  } catch (err) {
    console.error('Auth proxy error:', err.message)
    return res.status(503).json({ error: 'Authentication service unavailable' })
  }
})

export default router
