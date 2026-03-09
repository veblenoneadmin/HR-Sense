const SESSION_KEY = 'hr_sense_session'

export interface HRUser {
  id: string
  email: string
  name: string
  image?: string | null
}

export interface StoredSession {
  user: HRUser
  token: string
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.clear()
}

export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: { message: data.error || 'Login failed' }, data: null }
      return { data, error: null }
    } catch {
      return { error: { message: 'Network error. Please try again.' }, data: null }
    }
  },
}

export async function authSignOut() {
  clearSession()
}
