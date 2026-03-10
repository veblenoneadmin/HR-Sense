import { useState, useEffect } from "react";
import { DollarSign, Download, TrendingUp, Clock, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { payrollApi, employeesApi, performanceApi, getOrgId, PayrollRecordRow, EmployeeRow, KpiMetric } from "@/lib/api";

const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  PAID: "success", PROCESSED: "default", DRAFT: "secondary",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecordRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [metrics, setMetrics] = useState<KpiMetric[]>([]);
  const [empMap, setEmpMap] = useState<Record<string, EmployeeRow>>({});
  const [summary, setSummary] = useState({ totalGross: 0, totalNet: 0, totalDeductions: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [view, setView] = useState<"records" | "live">("live");
  const [absentDays, setAbsentDays] = useState<Record<string, number>>({});

  const loadData = (p: string) => {
    const orgId = getOrgId();
    setLoading(true);
    Promise.all([
      payrollApi.list(p),
      employeesApi.list(orgId),
      performanceApi.list(orgId, p),
    ])
      .then(([payrollRes, empRes, perfRes]) => {
        setRecords(payrollRes.records);
        setSummary(payrollRes.summary);
        setEmployees(empRes.employees);
        setMetrics(perfRes.metrics);
        const map: Record<string, EmployeeRow> = {};
        empRes.employees.forEach((e) => { map[e.id] = e; });
        setEmpMap(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(period); }, [period]);

  if (loading) return <div className="p-6 text-sm" style={{ color: '#858585' }}>Loading payroll...</div>;
  if (error) return <div className="p-6 text-sm text-red-400">Error: {error}</div>;

  // ── Live payroll computation ──────────────────────────────────────────────
  const perfMap = Object.fromEntries(metrics.map(m => [m.userId, m]));
  const liveRows = employees
    .filter(e => e.profileId && (e.baseSalary ?? 0) > 0)
    .map(e => {
      const gross = e.baseSalary ?? 0;
      const dailyRate = gross / 22;
      const govDeductions = (e.sssContribution ?? 0) + (e.philHealthContribution ?? 0) + (e.pagIbigContribution ?? 0);
      const absenceDeduction = dailyRate * (absentDays[e.id] ?? 0);
      const deductions = govDeductions + absenceDeduction;
      const net = Math.max(0, gross - deductions);
      const perf = perfMap[e.id];
      return { emp: e, gross, dailyRate, govDeductions, absenceDeduction, deductions, net, hours: perf?.hoursLogged ?? 0 };
    });

  const liveGrossTotal = liveRows.reduce((a, r) => a + r.gross, 0);
  const liveDeductTotal = liveRows.reduce((a, r) => a + r.deductions, 0);
  const liveNetTotal = liveRows.reduce((a, r) => a + r.net, 0);

  // ── Records helpers ───────────────────────────────────────────────────────
  const paid = records.filter((r) => r.status === "PAID").length;
  const pending = records.filter((r) => r.status !== "PAID").length;
  const totalOvertimePay = records.reduce((a, r) => a + r.overtimePay, 0);

  const getEmployeeName = (pr: PayrollRecordRow) => {
    const emp = empMap[pr.employee?.esUserId];
    return emp?.name ?? pr.employee?.esUserId ?? "Employee";
  };

  const deptTotals = records.reduce((acc, r) => {
    const dept = r.employee?.department?.name ?? "Unknown";
    if (!acc[dept]) acc[dept] = 0;
    acc[dept] += r.netPay;
    return acc;
  }, {} as Record<string, number>);

  const periodOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    periodOptions.push({ value: val, label });
  }

  const periodLabel = periodOptions.find(o => o.value === period)?.label ?? period;
  const currency = liveRows[0]?.emp.currency ?? "PHP";

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #3c3c3c', backgroundColor: '#252526', color: '#cccccc' }}
          >
            {periodOptions.map((o) => (
              <option key={o.value} value={o.value} style={{ backgroundColor: '#252526' }}>{o.label}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #3c3c3c' }}>
            {([{ key: "live", label: "Live", icon: Zap }, { key: "records", label: "Records", icon: DollarSign }] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
                style={{
                  backgroundColor: view === key ? '#0e639c' : 'transparent',
                  color: view === key ? '#ffffff' : '#999999',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {view === "records" && (
            <>
              <Badge variant="success">{paid} Paid</Badge>
              {pending > 0 && <Badge variant="warning">{pending} Pending</Badge>}
            </>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors" style={{ border: '1px solid #3c3c3c', color: '#999999', backgroundColor: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <Download className="w-3.5 h-3.5" />
          Export Payroll
        </button>
      </div>

      {/* ── LIVE VIEW ─────────────────────────────────────────────────────── */}
      {view === "live" && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Gross", value: `${currency} ${fmt(liveGrossTotal)}`, icon: DollarSign, color: '#7dbfff' },
              { label: "Total Net", value: `${currency} ${fmt(liveNetTotal)}`, icon: TrendingUp, color: '#81c784' },
              { label: "Total Deductions", value: `${currency} ${fmt(liveDeductTotal)}`, icon: DollarSign, color: '#f44747' },
              { label: "Employees", value: String(liveRows.length), icon: Users, color: '#ffb74d' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
                <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#858585' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <CardTitle>Live Payroll — {periodLabel}</CardTitle>
              </div>
              <CardDescription>Computed directly from HR profiles · updates as salary data changes</CardDescription>
            </CardHeader>
            <CardContent>
              {liveRows.length === 0 ? (
                <p className="text-sm" style={{ color: '#6e6e6e' }}>No employees with HR profiles and salary data found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                        <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Employee</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Gross / mo</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Gov't Deductions</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Absent Days</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Absence Deduction</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Net / mo</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Semi-Monthly</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveRows.map(({ emp, gross, govDeductions, absenceDeduction, net, hours }) => (
                        <tr key={emp.id} className="transition-colors" style={{ borderBottom: '1px solid #333333' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={emp.name} size="sm" />
                              <div>
                                <p className="font-medium text-sm" style={{ color: '#e0e0e0' }}>{emp.name}</p>
                                <p className="text-xs" style={{ color: '#6e6e6e' }}>{emp.department ?? "—"} · {emp.title ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right" style={{ color: '#cccccc' }}>{currency} {fmt(gross)}</td>
                          <td className="py-3 px-3 text-right">
                            {govDeductions > 0
                              ? <span style={{ color: '#f44747' }}>- {currency} {fmt(govDeductions)}</span>
                              : <span style={{ color: '#6e6e6e' }}>—</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number" min="0" max="31"
                              value={absentDays[emp.id] ?? 0}
                              onChange={e => setAbsentDays(prev => ({ ...prev, [emp.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="w-14 px-2 py-1 text-sm text-center rounded outline-none"
                              style={{ border: '1px solid #3c3c3c', backgroundColor: '#1e1e1e', color: '#ffb74d' }}
                              onFocus={e => (e.target.style.borderColor = '#007acc')}
                              onBlur={e => (e.target.style.borderColor = '#3c3c3c')}
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            {absenceDeduction > 0
                              ? <span style={{ color: '#ffb74d' }}>- {currency} {fmt(absenceDeduction)}</span>
                              : <span style={{ color: '#6e6e6e' }}>—</span>}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold" style={{ color: '#81c784' }}>{currency} {fmt(net)}</td>
                          <td className="py-3 px-3 text-right" style={{ color: '#7dbfff' }}>{currency} {fmt(net / 2)}</td>
                          <td className="py-3 px-3 text-right" style={{ color: hours > 0 ? '#cccccc' : '#6e6e6e' }}>
                            {hours > 0 ? `${hours.toFixed(1)}h` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #3c3c3c', backgroundColor: '#252526' }}>
                        <td className="py-3 px-3 font-semibold" style={{ color: '#cccccc' }}>
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Total ({liveRows.length})</span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold" style={{ color: '#cccccc' }}>{currency} {fmt(liveGrossTotal)}</td>
                        <td className="py-3 px-3 text-right font-semibold" style={{ color: '#f44747' }}>- {currency} {fmt(liveRows.reduce((a, r) => a + r.govDeductions, 0))}</td>
                        <td className="py-3 px-3 text-center font-semibold" style={{ color: '#ffb74d' }}>
                          {liveRows.reduce((a, r) => a + (absentDays[r.emp.id] ?? 0), 0)}d
                        </td>
                        <td className="py-3 px-3 text-right font-semibold" style={{ color: '#ffb74d' }}>- {currency} {fmt(liveRows.reduce((a, r) => a + r.absenceDeduction, 0))}</td>
                        <td className="py-3 px-3 text-right font-bold" style={{ color: '#81c784' }}>{currency} {fmt(liveNetTotal)}</td>
                        <td className="py-3 px-3 text-right font-bold" style={{ color: '#7dbfff' }}>{currency} {fmt(liveNetTotal / 2)}</td>
                        <td className="py-3 px-3 text-right font-semibold" style={{ color: '#cccccc' }}>
                          {metrics.reduce((a, m) => a + m.hoursLogged, 0).toFixed(1)}h
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-xs" style={{ color: '#6e6e6e' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Live payroll · computed from HR profiles in real-time · {liveRows.length} employees with salary data</span>
          </div>
        </>
      )}

      {/* ── RECORDS VIEW ──────────────────────────────────────────────────── */}
      {view === "records" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Gross Payroll", value: `$${summary.totalGross.toLocaleString()}`, icon: DollarSign, color: '#7dbfff' },
              { label: "Net Payroll", value: `$${summary.totalNet.toLocaleString()}`, icon: TrendingUp, color: '#81c784' },
              { label: "Total Deductions", value: `$${summary.totalDeductions.toLocaleString()}`, icon: DollarSign, color: '#f44747' },
              { label: "Overtime Pay", value: `$${totalOvertimePay.toLocaleString()}`, icon: Clock, color: '#ffb74d' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
                <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#858585' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Employee Payroll — {periodLabel}</CardTitle>
                <CardDescription>Derived from EverSense time logs and configured base salaries</CardDescription>
              </CardHeader>
              <CardContent>
                {records.length === 0 ? (
                  <p className="text-sm" style={{ color: '#6e6e6e' }}>No payroll records for this period. Switch to Live view to see computed estimates.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                          <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Employee</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Base</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>OT Pay</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Deductions</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Net</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Hours</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((pr) => {
                          const name = getEmployeeName(pr);
                          return (
                            <tr key={pr.id} className="transition-colors" style={{ borderBottom: '1px solid #333333' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Avatar name={name} size="sm" />
                                  <div>
                                    <p className="font-medium text-sm" style={{ color: '#e0e0e0' }}>{name}</p>
                                    <p className="text-xs" style={{ color: '#6e6e6e' }}>{pr.employee?.department?.name ?? "—"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right" style={{ color: '#cccccc' }}>${pr.baseSalary.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right">
                                {pr.overtimePay > 0
                                  ? <span className="font-medium" style={{ color: '#ffb74d' }}>+${pr.overtimePay.toLocaleString()}</span>
                                  : <span style={{ color: '#6e6e6e' }}>—</span>}
                              </td>
                              <td className="py-3 px-3 text-right" style={{ color: '#f44747' }}>-${pr.deductions.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right font-semibold" style={{ color: '#e0e0e0' }}>${pr.netPay.toLocaleString()}</td>
                              <td className="py-3 px-3 text-right" style={{ color: '#cccccc' }}>
                                {pr.hoursWorked}h
                                {pr.overtimeHours > 0 && <span className="text-xs ml-1" style={{ color: '#ffb74d' }}>(+{pr.overtimeHours})</span>}
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant={STATUS_VARIANT[pr.status] ?? "secondary"}>{pr.status}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #3c3c3c', backgroundColor: '#252526' }}>
                          <td className="py-3 px-3 font-semibold" style={{ color: '#cccccc' }}>
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Total ({records.length})</span>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold" style={{ color: '#cccccc' }}>${records.reduce((a, r) => a + r.baseSalary, 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-semibold" style={{ color: '#ffb74d' }}>+${totalOvertimePay.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-semibold" style={{ color: '#f44747' }}>-${summary.totalDeductions.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-bold" style={{ color: '#e0e0e0' }}>${summary.totalNet.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-semibold" style={{ color: '#cccccc' }}>{records.reduce((a, r) => a + r.hoursWorked, 0)}h</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>By Department</CardTitle>
                  <CardDescription>Net pay breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(deptTotals).length === 0 ? (
                    <p className="text-xs" style={{ color: '#6e6e6e' }}>No data.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(deptTotals)
                        .sort(([, a], [, b]) => b - a)
                        .map(([dept, amount]) => {
                          const pct = summary.totalNet > 0 ? Math.round((amount / summary.totalNet) * 100) : 0;
                          return (
                            <div key={dept}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium" style={{ color: '#cccccc' }}>{dept}</span>
                                <span className="text-xs font-semibold" style={{ color: '#e0e0e0' }}>${amount.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 rounded-full" style={{ backgroundColor: '#3c3c3c' }}>
                                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: '#6e6e6e' }}>{pct}% of total</p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overtime Summary</CardTitle>
                  <CardDescription>Employees with OT this period</CardDescription>
                </CardHeader>
                <CardContent>
                  {records.filter((r) => r.overtimeHours > 0).length === 0 ? (
                    <p className="text-xs" style={{ color: '#6e6e6e' }}>No overtime this period.</p>
                  ) : (
                    <div className="space-y-2">
                      {records.filter((r) => r.overtimeHours > 0).map((r) => {
                        const name = getEmployeeName(r);
                        return (
                          <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.2)' }}>
                            <Avatar name={name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium" style={{ color: '#e0e0e0' }}>{name}</p>
                              <p className="text-xs" style={{ color: '#ffb74d' }}>{r.overtimeHours}h overtime · +${r.overtimePay}</p>
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

          <div className="flex items-center gap-2 text-xs" style={{ color: '#6e6e6e' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>Payroll calculated from EverSense TimeLog duration data + configured base salaries</span>
          </div>
        </>
      )}
    </div>
  );
}
