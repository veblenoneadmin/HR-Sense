import React, { createContext, useContext, useState, useEffect } from 'react'
import { getStoredSession, storeSession, clearSession } from '../lib/auth-client'
import type { StoredSession } from '../lib/auth-client'

interface SessionContextType {
  session: StoredSession | null
  isLoading: boolean
  setSession: (s: StoredSession | null) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setSessionState(getStoredSession())
    setIsLoading(false)
  }, [])

  const setSession = (s: StoredSession | null) => {
    if (s) storeSession(s)
    else clearSession()
    setSessionState(s)
  }

  return (
    <SessionContext.Provider value={{ session, isLoading, setSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used inside SessionProvider')
  return ctx
}

export function useSession() {
  const { session, isLoading } = useSessionContext()
  return {
    data: session ? { user: session.user } : null,
    isPending: isLoading,
  }
}
