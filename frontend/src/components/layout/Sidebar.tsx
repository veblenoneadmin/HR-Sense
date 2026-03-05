import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Clock,
  TrendingUp,
  CalendarOff,
  DollarSign,
  GitBranch,
  Settings,
  Zap,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Attendance', href: '/attendance', icon: Clock },
  { label: 'Performance', href: '/performance', icon: TrendingUp },
  { label: 'Leave', href: '/leave', icon: CalendarOff },
  { label: 'Payroll', href: '/payroll', icon: DollarSign },
  { label: 'Org Chart', href: '/org-chart', icon: GitBranch },
]

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-gray-950 flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">HR-Sense</p>
          <p className="text-gray-500 text-xs mt-0.5">Powered by EverSense</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</p>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-3 p-3 rounded-lg bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-gray-300">EverSense Synced</span>
        </div>
        <p className="text-xs text-gray-500">Data synced from project management system</p>
      </div>

      <div className="px-3 pb-4 border-t border-gray-800 pt-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
