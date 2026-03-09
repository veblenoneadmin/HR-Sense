import { useState, useEffect } from "react";
import { DollarSign, Download, TrendingUp, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { payrollApi, employeesApi, getOrgId, PayrollRecordRow, EmployeeRow } from "@/lib/api";

const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  PAID: "success", PROCESSED: "default", DRAFT: "secondary",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecordRow[]>([]);
  const [empMap, setEmpMap] = useState<Record<string, EmployeeRow>>({});
  const [summary, setSummary] = useState({ totalGross: 0, totalNet: 0, totalDeductions: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(currentPeriod());

  const loadData = (p: string) => {
    const orgId = getOrgId();
    setLoading(true);
    Promise.all([payrollApi.list(p), employeesApi.list(orgId)])
      .then(([payrollRes, empRes]) => {
        setRecords(payrollRes.records);
        setSummary(payrollRes.summary);
        const map: Record<string, EmployeeRow> = {};
        empRes.employees.forEach((e) => { map[e.id] = e; });
        setEmpMap(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(period); }, [period]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading payroll...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

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

  // Build period options — last 6 months
  const periodOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    periodOptions.push({ value: val, label });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
          >
            {periodOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Badge variant="success">{paid} Paid</Badge>
          {pending > 0 && <Badge variant="warning">{pending} Pending</Badge>}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" />
          Export Payroll
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Gross Payroll", value: `$${summary.totalGross.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Net Payroll", value: `$${summary.totalNet.toLocaleString()}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Deductions", value: `$${summary.totalDeductions.toLocaleString()}`, icon: DollarSign, color: "text-red-500", bg: "bg-red-50" },
          { label: "Overtime Pay", value: `$${totalOvertimePay.toLocaleString()}`, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee Payroll — {periodOptions.find((o) => o.value === period)?.label}</CardTitle>
            <CardDescription>Derived from EverSense time logs and configured base salaries</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-sm text-gray-400">No payroll records for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Employee</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Base</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">OT Pay</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Deductions</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Net</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Hours</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((pr) => {
                      const name = getEmployeeName(pr);
                      return (
                        <tr key={pr.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={name} size="sm" />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{name}</p>
                                <p className="text-xs text-gray-400">{pr.employee?.department?.name ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-gray-700">${pr.baseSalary.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right">
                            {pr.overtimePay > 0 ? (
                              <span className="text-orange-600 font-medium">+${pr.overtimePay.toLocaleString()}</span>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-3 text-right text-red-500">-${pr.deductions.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">${pr.netPay.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-gray-600">
                            {pr.hoursWorked}h
                            {pr.overtimeHours > 0 && <span className="text-xs text-orange-500 ml-1">(+{pr.overtimeHours})</span>}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={STATUS_VARIANT[pr.status] ?? "secondary"}>{pr.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="py-3 px-3 font-semibold text-gray-700">
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Total ({records.length})</span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold">${records.reduce((a, r) => a + r.baseSalary, 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-semibold text-orange-600">+${totalOvertimePay.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-semibold text-red-500">-${summary.totalDeductions.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">${summary.totalNet.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-semibold">{records.reduce((a, r) => a + r.hoursWorked, 0)}h</td>
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
                <p className="text-xs text-gray-400">No data.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(deptTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dept, amount]) => {
                      const pct = summary.totalNet > 0 ? Math.round((amount / summary.totalNet) * 100) : 0;
                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{dept}</span>
                            <span className="text-xs text-gray-900 font-semibold">${amount.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{pct}% of total</p>
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
                <p className="text-xs text-gray-400">No overtime this period.</p>
              ) : (
                <div className="space-y-2">
                  {records.filter((r) => r.overtimeHours > 0).map((r) => {
                    const name = getEmployeeName(r);
                    return (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                        <Avatar name={name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-orange-600">{r.overtimeHours}h overtime · +${r.overtimePay}</p>
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

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span>Payroll calculated from EverSense TimeLog duration data + configured base salaries</span>
      </div>
    </div>
  );
}
