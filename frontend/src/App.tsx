import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import Dashboard from '@/pages/Dashboard'
import Employees from '@/pages/Employees'
import Attendance from '@/pages/Attendance'
import Performance from '@/pages/Performance'
import Leave from '@/pages/Leave'
import Payroll from '@/pages/Payroll'
import OrgChart from '@/pages/OrgChart'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
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
    </BrowserRouter>
  )
}
