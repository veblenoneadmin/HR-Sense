import { DollarSign, Download, TrendingUp, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MOCK_PAYROLL } from "@/lib/mock-data";

const totalGross = MOCK_PAYROLL.reduce((a, p) => a + p.baseSalary + p.overtimePay, 0);
const totalNet = MOCK_PAYROLL.reduce((a, p) => a + p.netPay, 0);
const totalDeductions = MOCK_PAYROLL.reduce((a, p) => a + p.deductions, 0);
const totalOvertimePay = MOCK_PAYROLL.reduce((a, p) => a + p.overtimePay, 0);
const paid = MOCK_PAYROLL.filter((p) => p.status === "PAID").length;
const pending = MOCK_PAYROLL.filter((p) => p.status !== "PAID").length;

const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  PAID: "success",
  PROCESSED: "default",
  DRAFT: "secondary",
};

export default function PayrollPage() {
  const deptTotals = MOCK_PAYROLL.reduce((acc, p) => {
    if (!acc[p.department]) acc[p.department] = 0;
    acc[p.department] += p.netPay;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
            <option>February 2026</option>
            <option>January 2026</option>
            <option>December 2025</option>
          </select>
          <Badge variant="success">{paid} Paid</Badge>
          {pending > 0 && <Badge variant="warning">{pending} Pending</Badge>}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
          <Download className="w-3.5 h-3.5" />
          Export Payroll
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Gross Payroll", value: `$${totalGross.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Net Payroll", value: `$${totalNet.toLocaleString()}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Deductions", value: `$${totalDeductions.toLocaleString()}`, icon: DollarSign, color: "text-red-500", bg: "bg-red-50" },
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
        {/* Payroll table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee Payroll — February 2026</CardTitle>
            <CardDescription>Derived from EverSense time logs and hourly rates</CardDescription>
          </CardHeader>
          <CardContent>
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
                  {MOCK_PAYROLL.map((pr) => (
                    <tr key={pr.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={pr.userName} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{pr.userName}</p>
                            <p className="text-xs text-gray-400">{pr.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700">${pr.baseSalary.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">
                        {pr.overtimePay > 0 ? (
                          <span className="text-orange-600 font-medium">+${pr.overtimePay.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-red-500">-${pr.deductions.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-900">${pr.netPay.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-gray-600">
                        {pr.hoursWorked}h
                        {pr.overtimeHours > 0 && (
                          <span className="text-xs text-orange-500 ml-1">(+{pr.overtimeHours})</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={STATUS_VARIANT[pr.status]}>{pr.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="py-3 px-3 font-semibold text-gray-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Total ({MOCK_PAYROLL.length})
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">${MOCK_PAYROLL.reduce((a, p) => a + p.baseSalary, 0).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-semibold text-orange-600">+${totalOvertimePay.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-semibold text-red-500">-${totalDeductions.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">${totalNet.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-semibold">{MOCK_PAYROLL.reduce((a, p) => a + p.hoursWorked, 0)}h</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Side panels */}
        <div className="space-y-4">
          {/* By department */}
          <Card>
            <CardHeader>
              <CardTitle>By Department</CardTitle>
              <CardDescription>Net pay breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(deptTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([dept, amount]) => {
                    const pct = Math.round((amount / totalNet) * 100);
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
            </CardContent>
          </Card>

          {/* Overtime summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overtime Summary</CardTitle>
              <CardDescription>Employees with OT this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_PAYROLL.filter((p) => p.overtimeHours > 0).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
                    <Avatar name={p.userName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{p.userName}</p>
                      <p className="text-xs text-orange-600">{p.overtimeHours}h overtime · +${p.overtimePay}</p>
                    </div>
                  </div>
                ))}
                {MOCK_PAYROLL.filter((p) => p.overtimeHours > 0).length === 0 && (
                  <p className="text-xs text-gray-400">No overtime this period</p>
                )}
              </div>
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
