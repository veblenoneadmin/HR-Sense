import { CalendarOff, CheckCircle2, XCircle, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MOCK_LEAVES } from "@/lib/mock-data";
import { useState } from "react";

const LEAVE_TYPE_COLORS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-red-100 text-red-800",
  UNPAID: "bg-gray-100 text-gray-800",
  MATERNITY: "bg-pink-100 text-pink-800",
  PATERNITY: "bg-indigo-100 text-indigo-800",
  BEREAVEMENT: "bg-purple-100 text-purple-800",
};

const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function LeavePage() {
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filtered = filter === "ALL" ? MOCK_LEAVES : MOCK_LEAVES.filter((l) => l.status === filter);
  const pending = MOCK_LEAVES.filter((l) => l.status === "PENDING").length;
  const approved = MOCK_LEAVES.filter((l) => l.status === "APPROVED").length;
  const rejected = MOCK_LEAVES.filter((l) => l.status === "REJECTED").length;
  const totalDays = MOCK_LEAVES.filter((l) => l.status === "APPROVED").reduce((a, l) => a + l.days, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5" />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Approved", value: approved, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Rejected", value: rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Days Approved", value: totalDays, icon: CalendarOff, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">{filtered.length} requests</h2>
          {filtered.map((leave) => (
            <Card key={leave.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={leave.userName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{leave.userName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_TYPE_COLORS[leave.type]}`}>
                            {leave.type}
                          </span>
                          <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{leave.days} day{leave.days !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-gray-500">
                          {leave.startDate} → {leave.endDate}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">&ldquo;{leave.reason}&rdquo;</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">
                        Submitted {new Date(leave.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {leave.approvedBy && ` · ${leave.status === "APPROVED" ? "Approved" : "Reviewed"} by ${leave.approvedBy}`}
                      </p>
                      {leave.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 transition-colors">
                            Approve
                          </button>
                          <button className="px-2.5 py-1 rounded-lg border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leave balance summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance Summary</CardTitle>
              <CardDescription>2026 annual entitlements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: "Annual Leave", entitlement: 20, used: 5, color: "bg-blue-500" },
                  { type: "Sick Leave", entitlement: 10, used: 9, color: "bg-red-500" },
                  { type: "Maternity", entitlement: 90, used: 65, color: "bg-pink-500" },
                  { type: "Unpaid", entitlement: 30, used: 0, color: "bg-gray-400" },
                ].map((b) => {
                  const pct = Math.round((b.used / b.entitlement) * 100);
                  return (
                    <div key={b.type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{b.type}</span>
                        <span className="text-xs text-gray-500">{b.used}/{b.entitlement} days</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${b.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Leaves</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_LEAVES.filter((l) => l.status === "APPROVED" && new Date(l.startDate) > new Date("2026-03-01")).map((l) => (
                  <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <Avatar name={l.userName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{l.userName}</p>
                      <p className="text-xs text-gray-500">{l.type} · {l.startDate}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{l.days}d</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
