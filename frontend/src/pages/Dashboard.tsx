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

  if (loading) return <div className="p-6 text-sm" style={{ color: '#858585' }}>Loading dashboard...</div>;
  if (error) return <div className="p-6 text-sm text-red-400">Error: {error}</div>;

  const activeEmployees = employees.filter((u) => u.isActive).length;
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;
  const totalHours = metrics.reduce((a, m) => a + m.hoursLogged, 0);
  const totalNet = payroll.reduce((a, p) => a + p.netPay, 0);
  const burnoutRisk = metrics.filter((m) => m.tier === "BURNOUT_RISK").length;
  const underperforming = metrics.filter((m) => m.tier === "UNDERPERFORMING").length;
  const period = currentPeriod();
  const periodLabel = new Date(period + "-01").toLocaleString("en-US", { month: "long", year: "numeric" });

  const empMap: Record<string, string> = {};
  employees.forEach((e) => { empMap[e.id] = e.name; });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(0,122,204,0.12)', border: '1px solid rgba(0,122,204,0.25)' }}>
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <p className="text-sm" style={{ color: '#7dbfff' }}>
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
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.25)' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ff9800' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#ffb74d' }}>{burnoutRisk} Burnout Risk</p>
                <p className="text-xs mt-0.5" style={{ color: '#cc7a00' }}>
                  {metrics.filter((m) => m.tier === "BURNOUT_RISK").map((m) => m.userName).join(", ")} — workload review recommended.
                </p>
              </div>
            </div>
          )}
          {underperforming > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.25)' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f44747' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#f44747' }}>{underperforming} Underperforming</p>
                <p className="text-xs mt-0.5" style={{ color: '#c03030' }}>
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
              <p className="text-sm" style={{ color: '#6e6e6e' }}>No performance data for this period.</p>
            ) : (
              <div className="space-y-3">
                {metrics.slice(0, 7).map((m) => (
                  <div key={m.userId} className="flex items-center gap-3">
                    <Avatar name={m.userName ?? m.userId} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate" style={{ color: '#e0e0e0' }}>{m.userName ?? m.userId}</p>
                        <Badge variant={TIER_COLORS[m.tier]}>{TIER_LABELS[m.tier]}</Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{m.hoursLogged}h</p>
                      <p className="text-xs" style={{ color: '#858585' }}>{m.tasksCompleted} tasks</p>
                    </div>
                    <div className="w-20 hidden sm:block">
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: '#3c3c3c' }}>
                        <div
                          className={`h-1.5 rounded-full ${m.tier === "STAR" ? "bg-green-400" : m.tier === "GOOD" ? "bg-blue-400" : m.tier === "BURNOUT_RISK" ? "bg-yellow-400" : m.tier === "UNDERPERFORMING" ? "bg-red-400" : "bg-gray-500"}`}
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
                    <CalendarOff className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: '#cccccc' }}>{name} — {l.type} leave ({l.status})</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6e6e6e' }}>{l.startDate} → {l.endDate}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed" style={{ color: '#cccccc' }}>EverSense KPI sync completed — {metrics.length} employees updated</p>
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
              <p className="text-sm" style={{ color: '#6e6e6e' }}>No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {leaves.filter((l) => l.status === "PENDING").map((leave) => {
                  const name = empMap[leave.employee?.esUserId] ?? leave.employee?.esUserId ?? "Employee";
                  return (
                    <div key={leave.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c' }}>
                      <Avatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>{name}</p>
                        <p className="text-xs" style={{ color: '#858585' }}>{leave.type} · {leave.days} days · from {leave.startDate}</p>
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
              <p className="text-sm" style={{ color: '#6e6e6e' }}>No payroll records for this period.</p>
            ) : (
              <div className="space-y-2">
                {payroll.map((pr) => {
                  const name = empMap[pr.employee?.esUserId] ?? pr.employee?.esUserId ?? "Employee";
                  return (
                    <div key={pr.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #3c3c3c' }}>
                      <div className="flex items-center gap-2">
                        <Avatar name={name} size="sm" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>{name}</p>
                          <p className="text-xs" style={{ color: '#858585' }}>{pr.employee?.department?.name ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>${pr.netPay.toLocaleString()}</span>
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
  const configs = {
    blue:   { iconBg: 'rgba(0,122,204,0.15)',   iconColor: '#7dbfff', valueColor: '#7dbfff'   },
    green:  { iconBg: 'rgba(76,175,80,0.15)',    iconColor: '#81c784', valueColor: '#81c784'   },
    orange: { iconBg: 'rgba(255,152,0,0.15)',    iconColor: '#ffb74d', valueColor: '#ffb74d'   },
    purple: { iconBg: 'rgba(156,39,176,0.15)',   iconColor: '#ce93d8', valueColor: '#ce93d8'   },
  }[color];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: '#858585' }}>{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: configs.valueColor }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6e6e6e' }}>{sub}</p>
          </div>
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: configs.iconBg, color: configs.iconColor }}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
