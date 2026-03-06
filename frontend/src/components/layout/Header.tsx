import { useLocation } from 'react-router-dom'
import { Bell, Search, RefreshCw } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'Overview of your HR operations' },
  '/employees': { title: 'Employees', description: 'Manage your team members' },
  '/attendance': { title: 'Attendance', description: 'Track time logs from EverSense' },
  '/performance': { title: 'Performance', description: 'KPI metrics synced from EverSense' },
  '/leave': { title: 'Leave Management', description: 'Manage leave requests and approvals' },
  '/payroll': { title: 'Payroll', description: 'Process and review payroll records' },
  '/org-chart': { title: 'Org Chart', description: 'Organizational hierarchy' },
}

export function Header() {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] ?? { title: 'HR-Sense', description: '' }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900">{page.title}</h1>
        <p className="text-xs text-gray-500 hidden sm:block">{page.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-500 w-56">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-3 h-3" />
          Sync EverSense
        </button>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <Avatar name="Jordan Veblen" size="sm" />
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-gray-900">Jordan Veblen</p>
            <p className="text-xs text-gray-500">Owner</p>
          </div>
        </div>
      </div>
    </header>
  )
}
