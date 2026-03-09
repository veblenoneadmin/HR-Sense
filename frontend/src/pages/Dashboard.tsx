import { useState, useEffect, type ComponentType } from "react";
import { Users, Clock, CalendarOff, DollarSign, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { employeesApi, performanceApi, leavesApi, payrollApi, getOrgId, EmployeeRow, KpiMetric, LeaveRequestRow, PayrollRecordRow } from "@/lib/api";

const TIER_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  STAR: "success", GOOD: "default", AVERAGE: "secondary", BURNOUT_RISK: "warning", UNDERPERFORMING: "destructive",
};
const TIER_LABELS: Record<string, string> = {
  STAR: "Star", GOOD: "Good", AVERAGE: "Average", BURNOUT_RISK: "Burnout Risk", UNDERPERFORMING: "Needs Review",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [metrics, setMetrics] = useState<KpiMetric[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const orgId = getOrgId();
    const period = currentPeriod();
    setLoading(true);
    Promise.all([
      employeesApi.list(orgId),
      performanceApi.list(orgId, period),
      leavesApi.list(),
      payrollApi.list(period),
    ])
      .then(([empRes, perfRes, leavesRes, payrollRes]) => {
        setEmployees(empRes.employees);
        setMetrics(perfRes.metrics);
        setLeaves(leavesRes.requests);
        setPayroll(payrollRes.records);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

  const activeEmployees = employees.filter((u) => u.isActive).length;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
  const totalHours = metrics.reduce((a, m) => a + m.hoursLogged, 0);
  const totalNet = payroll.reduce((a, p) => a + p.netPay, 0);
  const burnoutRisk = metrics.filter((m) => m.tier === "BURNOUT_RISK").length;
  const underperforming = metrics.filter((m) => m.tier === "UNDERPERFORMING").length;
  const period = currentPeriod();
  const periodLabel = new Date(period + "-01").toLocaleString("en-US", { month: "long", year: "numeric" });

  // Build employee name lookup from leave & payroll employee.esUserId
  const empMap: Record<string, string> = {};
  employees.forEach((e) => { empMap[e.id] = e.name; });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <p className="text-sm text-blue-700">
          <span className="font-semibold">EverSense Connected</span> — Live data synced for {employees.length} employees · {periodLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Employees" value={activeEmployees} sub={`${employees.length - activeEmployees} inactive`} color="blue" />
        <StatCard icon={Clock} label="Hours This Month" value={`${totalHours.toFixed(0)}h`} sub="Across all projects" color="green" />
        <StatCard icon={CalendarOff} label="Pending Leaves" value={pendingLeaves} sub="Awaiting approval" color="orange" />
        <StatCard icon={DollarSign} label={`${periodLabel} Payroll`} value={totalNet > 0 ? `$${(totalNet / 1000).toFixed(0)}k` : "—"} sub="Net pay" color="purple" />
      </div>

      {(burnoutRisk > 0 || underperforming > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {burnoutRisk > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">{burnoutRisk} Burnout Risk</p>
                <p className="text-xs text-yellow-700">
                  {metrics.filter((m) => m.tier === "BURNOUT_RISK").map((m) => m.userName).join(", ")} — workload review recommended.
                </p>
              </div>
            </div>
          )}
          {underperforming > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">{underperforming} Underperforming</p>
                <p className="text-xs text-red-700">
                  {metrics.filter((m) => m.tier === "UNDERPERFORMING").map((m) => m.userName).join(", ")} — performance review recommended.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Snapshot</CardTitle>
            <CardDescription>{periodLabel} — synced from EverSense KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.length === 0 ? (
              <p className="text-sm text-gray-400">No performance data for this period.</p>
            ) : (
              <div className="space-y-3">
                {metrics.slice(0, 7).map((m) => (
                  <div key={m.userId} className="flex items-center gap-3">
                    <Avatar name={m.userName ?? m.userId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.userName ?? m.userId}</p>
                        <Badge variant={TIER_COLORS[m.tier]}>{TIER_LABELS[m.tier]}</Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{m.hoursLogged}h</p>
                      <p className="text-xs text-gray-500">{m.tasksCompleted} tasks</p>
                    </div>
                    <div className="w-20 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div
                          className={`h-1.5 rounded-full ${m.tier === "STAR" ? "bg-green-500" : m.tier === "GOOD" ? "bg-blue-500" : m.tier === "BURNOUT_RISK" ? "bg-yellow-500" : m.tier === "UNDERPERFORMING" ? "bg-red-500" : "bg-gray-400"}`}
                          style={{ width: `${Math.min((m.performanceScore / 2) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest HR events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaves.slice(0, 3).map((l) => {
                const name = empMap[l.employee?.esUserId] ?? l.employee?.esUserId ?? "Employee";
                return (
                  <div key={l.id} className="flex items-start gap-3">
                    <CalendarOff className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">{name} — {l.type} leave ({l.status})</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l.startDate} → {l.endDate}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">EverSense KPI sync completed — {metrics.length} employees updated</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <CardDescription>{pendingLeaves} requests awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLeaves === 0 ? (
              <p className="text-sm text-gray-400">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {leaves.filter((l) => l.status === "PENDING").map((leave) => {
                  const name = empMap[leave.employee?.esUserId] ?? leave.employee?.esUserId ?? "Employee";
                  return (
                    <div key={leave.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Avatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">{leave.type} · {leave.days} days · from {leave.startDate}</p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll Status — {periodLabel}</CardTitle>
            <CardDescription>Processing overview</CardDescription>
          </CardHeader>
          <CardContent>
            {payroll.length === 0 ? (
              <p className="text-sm text-gray-400">No payroll records for this period.</p>
            ) : (
              <div className="space-y-2">
                {payroll.map((pr) => {
                  const name = empMap[pr.employee?.esUserId] ?? pr.employee?.esUserId ?? "Employee";
                  return (
                    <div key={pr.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <Avatar name={name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">{pr.employee?.department?.name ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">${pr.netPay.toLocaleString()}</span>
                        <Badge variant={pr.status === "PAID" ? "success" : pr.status === "PROCESSED" ? "default" : "secondary"}>
                          {pr.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: ComponentType<{ className?: string }>;
  label: string; value: string | number; sub: string;
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
