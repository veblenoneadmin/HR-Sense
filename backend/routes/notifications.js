import express from 'express'
import axios from 'axios'

const router = express.Router()

function getToken(req) {
  return req.headers.authorization?.replace('Bearer ', '') || ''
}

// GET /api/notifications — proxy to EverSense using session token
router.get('/', async (req, res) => {
  const token = getToken(req)
  const eversenseUrl = process.env.EVERSENSE_API_URL

  if (eversenseUrl && token) {
    try {
      const response = await axios.get(`${eversenseUrl}/api/notifications`, {
        headers: { Cookie: `better-auth.session_token=${token}` },
        timeout: 5000,
        validateStatus: () => true,
      })
      if (response.status < 400) return res.json(response.data)
    } catch { /* fall through to empty */ }
  }

  res.json({ notifications: [], unreadCount: 0 })
})

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  const token = getToken(req)
  const eversenseUrl = process.env.EVERSENSE_API_URL
  if (eversenseUrl && token) {
    try {
      await axios.put(`${eversenseUrl}/api/notifications/read-all`, {}, {
        headers: { Cookie: `better-auth.session_token=${token}` },
        timeout: 5000,
      })
    } catch { /* ignore */ }
  }
  res.json({ success: true })
})

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  const token = getToken(req)
  const eversenseUrl = process.env.EVERSENSE_API_URL
  if (eversenseUrl && token) {
    try {
      await axios.put(`${eversenseUrl}/api/notifications/${req.params.id}/read`, {}, {
        headers: { Cookie: `better-auth.session_token=${token}` },
        timeout: 5000,
      })
    } catch { /* ignore */ }
  }
  res.json({ success: true })
})

export default router
