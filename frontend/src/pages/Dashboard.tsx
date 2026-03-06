import { Users, Clock, CalendarOff, DollarSign, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  MOCK_USERS,
  MOCK_PERFORMANCE,
  MOCK_LEAVES,
  MOCK_PAYROLL,
  MOCK_TIMELOGS,
  USER_TITLES,
} from "@/lib/mock-data";

const activeEmployees = MOCK_USERS.filter((u) => u.isActive).length;
const pendingLeaves = MOCK_LEAVES.filter((l) => l.status === "PENDING").length;
const totalHoursThisWeek = MOCK_TIMELOGS.reduce((a, t) => a + t.duration, 0) / 60;
const totalPayroll = MOCK_PAYROLL.reduce((a, p) => a + p.netPay, 0);
const burnoutRisk = MOCK_PERFORMANCE.filter((p) => p.tier === "BURNOUT_RISK").length;
const underperforming = MOCK_PERFORMANCE.filter((p) => p.tier === "UNDERPERFORMING").length;

const TIER_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  STAR: "success",
  GOOD: "default",
  AVERAGE: "secondary",
  BURNOUT_RISK: "warning",
  UNDERPERFORMING: "destructive",
};

const TIER_LABELS: Record<string, string> = {
  STAR: "Star",
  GOOD: "Good",
  AVERAGE: "Average",
  BURNOUT_RISK: "Burnout Risk",
  UNDERPERFORMING: "Needs Review",
};

export default function DashboardPage() {
  const recentActivity = [
    { icon: CheckCircle2, color: "text-green-500", text: "Diana Prince's sick leave approved", time: "2h ago" },
    { icon: AlertTriangle, color: "text-yellow-500", text: "Bob Smith logged 78h this week — burnout risk flagged", time: "5h ago" },
    { icon: CalendarOff, color: "text-blue-500", text: "Charlie Brown submitted annual leave request", time: "1d ago" },
    { icon: DollarSign, color: "text-purple-500", text: "February payroll processed for 9 employees", time: "3d ago" },
    { icon: Activity, color: "text-orange-500", text: "EverSense KPI sync completed — 9 employees updated", time: "6h ago" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* EverSense sync banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">EverSense Connected</span> — Employee, time log, task, and KPI data synced from{" "}
          <span className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">veblenoneadmin/EverSense</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Employees" value={activeEmployees} sub="1 inactive" color="blue" />
        <StatCard icon={Clock} label="Hours This Week" value={`${totalHoursThisWeek.toFixed(0)}h`} sub="Across all projects" color="green" />
        <StatCard icon={CalendarOff} label="Pending Leaves" value={pendingLeaves} sub="Awaiting approval" color="orange" />
        <StatCard icon={DollarSign} label="Feb Payroll" value={`$${(totalPayroll / 1000).toFixed(0)}k`} sub="Net pay processed" color="purple" />
      </div>

      {/* Alerts */}
      {(burnoutRisk > 0 || underperforming > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {burnoutRisk > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">{burnoutRisk} Burnout Risk</p>
                <p className="text-xs text-yellow-700">Bob Smith logged 78h last week (162% above avg). Workload review recommended.</p>
              </div>
            </div>
          )}
          {underperforming > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">{underperforming} Underperforming</p>
                <p className="text-xs text-red-700">Diana Prince & Frank Miller are significantly below team averages. Review recommended.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance snapshot */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Snapshot</CardTitle>
            <CardDescription>February 2026 — synced from EverSense KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_PERFORMANCE.slice(0, 7).map((p) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <Avatar name={p.userName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.userName}</p>
                      <Badge variant={TIER_COLORS[p.tier]}>{TIER_LABELS[p.tier]}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{USER_TITLES[p.userId]} · {p.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{p.hoursLogged}h</p>
                    <p className="text-xs text-gray-500">{p.tasksCompleted} tasks</p>
                  </div>
                  <div className="w-20 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${
                          p.tier === "STAR" ? "bg-green-500"
                          : p.tier === "GOOD" ? "bg-blue-500"
                          : p.tier === "BURNOUT_RISK" ? "bg-yellow-500"
                          : p.tier === "UNDERPERFORMING" ? "bg-red-500"
                          : "bg-gray-400"
                        }`}
                        style={{ width: `${Math.min((p.performanceScore / 2) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest HR events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending leaves & payroll status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <CardDescription>{pendingLeaves} requests awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_LEAVES.filter((l) => l.status === "PENDING").map((leave) => (
                <div key={leave.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <Avatar name={leave.userName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{leave.userName}</p>
                    <p className="text-xs text-gray-500">{leave.type} · {leave.days} days · from {leave.startDate}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Status — Feb 2026</CardTitle>
            <CardDescription>Processing overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_PAYROLL.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={pr.userName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pr.userName}</p>
                      <p className="text-xs text-gray-500">{pr.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">${pr.netPay.toLocaleString()}</span>
                    <Badge variant={pr.status === "PAID" ? "success" : pr.status === "PROCESSED" ? "default" : "secondary"}>
                      {pr.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  }[color];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
