import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Employees from '@/pages/Employees'
import Attendance from '@/pages/Attendance'
import Performance from '@/pages/Performance'
import Leave from '@/pages/Leave'
import Payroll from '@/pages/Payroll'
import OrgChart from '@/pages/OrgChart'
import { VS } from '@/lib/theme'

function AppLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: VS.bg0 }}>
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen" style={{ background: VS.bg0 }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/org-chart" element={<OrgChart />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}
