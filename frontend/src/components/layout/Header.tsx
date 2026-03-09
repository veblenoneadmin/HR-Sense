import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell, ChevronDown, LogOut, RefreshCw,
  CheckCheck, X, CheckSquare, AlertTriangle,
  Clock, CalendarDays, Users, Video, Info,
} from 'lucide-react'
import { authSignOut, getStoredSession } from '@/lib/auth-client'
import { useSession } from '@/contexts/SessionContext'
import { VS } from '@/lib/theme'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/':            { title: 'Dashboard',        description: 'Overview of your HR operations' },
  '/employees':   { title: 'Employees',        description: 'Manage your team members' },
  '/attendance':  { title: 'Attendance',       description: 'Track time logs from EverSense' },
  '/performance': { title: 'Performance',      description: 'KPI metrics synced from EverSense' },
  '/leave':       { title: 'Leave Management', description: 'Manage leave requests and approvals' },
  '/payroll':     { title: 'Payroll',          description: 'Process and review payroll records' },
  '/org-chart':   { title: 'Org Chart',        description: 'Organizational hierarchy' },
}

type Notif = {
  id: string
  title: string
  body: string | null
  link: string | null
  type: string
  isRead: boolean
  createdAt: string
}

const NOTIF_META: Record<string, { icon: React.ElementType; color: string }> = {
  task:     { icon: CheckSquare,   color: '#007acc' },
  comment:  { icon: CheckSquare,   color: '#c586c0' },
  due_soon: { icon: Clock,         color: '#dcdcaa' },
  overdue:  { icon: AlertTriangle, color: '#f44747' },
  project:  { icon: Info,          color: '#4ec9b0' },
  calendar: { icon: CalendarDays,  color: '#4ec9b0' },
  meeting:  { icon: Video,         color: '#569cd6' },
  member:   { icon: Users,         color: '#6a9955' },
  info:     { icon: Info,          color: '#858585' },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2) || 'U'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function Header() {
  const { pathname } = useLocation()
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const page = PAGE_TITLES[pathname] ?? { title: 'HR-Sense', description: '' }
  const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'
  const email = session?.user?.email ?? ''

  useEffect(() => {
    if (!session) return
    const stored = getStoredSession()
    const headers: Record<string, string> = {}
    if (stored?.token) headers['Authorization'] = `Bearer ${stored.token}`

    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications', { headers })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications ?? [])
          setUnreadCount(data.unreadCount ?? 0)
        }
      } catch { /* ignore */ }
    }
    fetchNotifs()
    const poll = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(poll)
  }, [session?.user?.id])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const handleNotifClick = async (notif: Notif) => {
    if (!notif.isRead) {
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' })
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    if (notif.link) window.location.href = notif.link
    setShowNotifications(false)
  }

  const handleSignOut = async () => {
    await authSignOut()
    window.location.href = '/login'
  }

  return (
    <header
      className="h-14 flex items-center justify-between px-6 gap-4 flex-shrink-0"
      style={{ background: VS.bg1, borderBottom: `1px solid ${VS.border}` }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold" style={{ color: VS.text0 }}>{page.title}</h1>
        <p className="text-xs hidden sm:block" style={{ color: VS.text2 }}>{page.description}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Sync button */}
        <button
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ border: `1px solid ${VS.border}`, color: VS.text2, background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = VS.text0; (e.currentTarget as HTMLElement).style.background = VS.bg2 }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = VS.text2; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <RefreshCw className="w-3 h-3" />
          Sync EverSense
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(v => !v); setShowDropdown(false) }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150"
            style={{ background: showNotifications ? VS.bg3 : 'transparent', color: VS.text1 }}
            onMouseEnter={e => { if (!showNotifications) (e.currentTarget as HTMLElement).style.background = VS.bg2 }}
            onMouseLeave={e => { if (!showNotifications) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: VS.red, minWidth: 16 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl z-20 overflow-hidden flex flex-col"
                style={{ background: VS.bg1, border: `1px solid ${VS.border}`, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', maxHeight: 420 }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${VS.border}` }}>
                  <span className="text-[12px] font-semibold" style={{ color: VS.text0 }}>Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[11px]" style={{ color: VS.accent }}>
                        <CheckCheck className="h-3 w-3" />Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="flex h-5 w-5 items-center justify-center rounded" style={{ color: VS.text2 }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: VS.text2 }}>
                      <Bell className="h-6 w-6 opacity-30" />
                      <p className="text-[12px]">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => {
                      const meta = NOTIF_META[n.type] ?? NOTIF_META.info
                      const TypeIcon = meta.icon
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors duration-100"
                          style={{ background: n.isRead ? 'transparent' : `${VS.accent}0f`, borderBottom: `1px solid ${VS.border}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = VS.bg2}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : `${VS.accent}0f`}
                        >
                          <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                            <TypeIcon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[12px] font-medium leading-snug truncate" style={{ color: n.isRead ? VS.text1 : VS.text0 }}>{n.title}</p>
                              {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: VS.accent }} />}
                            </div>
                            {n.body && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: VS.text2 }}>{n.body}</p>}
                            <p className="text-[10px] mt-1" style={{ color: VS.text2 }}>{timeAgo(n.createdAt)}</p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowDropdown(v => !v); setShowNotifications(false) }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors duration-150"
            style={{ background: showDropdown ? VS.bg3 : 'transparent' }}
            onMouseEnter={e => { if (!showDropdown) (e.currentTarget as HTMLElement).style.background = VS.bg2 }}
            onMouseLeave={e => { if (!showDropdown) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(252 87% 62%), hsl(260 80% 70%))' }}
            >
              {getInitials(displayName)}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-[12px] font-medium capitalize" style={{ color: VS.text0 }}>{displayName}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: VS.text2 }} />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl z-20 overflow-hidden"
                style={{ background: VS.bg1, border: `1px solid ${VS.border}`, boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${VS.border}` }}>
                  <p className="text-[12px] font-medium capitalize" style={{ color: VS.text0 }}>{displayName}</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: VS.text2 }}>{email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] transition-colors duration-150"
                  style={{ color: VS.text1 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${VS.red}14`; (e.currentTarget as HTMLElement).style.color = VS.red }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = VS.text1 }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
