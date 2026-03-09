import { useState, useEffect } from "react";
import { CalendarOff, CheckCircle2, XCircle, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { leavesApi, employeesApi, getOrgId, LeaveRequestRow, EmployeeRow } from "@/lib/api";

const LEAVE_TYPE_COLORS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800", SICK: "bg-red-100 text-red-800",
  UNPAID: "bg-gray-100 text-gray-800", MATERNITY: "bg-pink-100 text-pink-800",
  PATERNITY: "bg-indigo-100 text-indigo-800", BEREAVEMENT: "bg-purple-100 text-purple-800",
};
const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  PENDING: "warning", APPROVED: "success", REJECTED: "destructive", CANCELLED: "secondary",
};

type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequestRow[]>([]);
  const [empMap, setEmpMap] = useState<Record<string, EmployeeRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = () => {
    const orgId = getOrgId();
    setLoading(true);
    Promise.all([leavesApi.list(), employeesApi.list(orgId)])
      .then(([leavesRes, empRes]) => {
        setLeaves(leavesRes.requests);
        const map: Record<string, EmployeeRow> = {};
        empRes.employees.forEach((e) => { map[e.id] = e; });
        setEmpMap(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading leaves...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

  const filtered = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);
  const pending = leaves.filter((l) => l.status === "PENDING").length;
  const approved = leaves.filter((l) => l.status === "APPROVED").length;
  const rejected = leaves.filter((l) => l.status === "REJECTED").length;
  const totalDays = leaves.filter((l) => l.status === "APPROVED").reduce((a, l) => a + l.days, 0);

  const getEmployeeName = (leave: LeaveRequestRow) => {
    const emp = empMap[leave.employee?.esUserId];
    return emp?.name ?? leave.employee?.esUserId ?? "Employee";
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id + "-approve");
    try {
      await leavesApi.approve(id, "HR Admin");
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: "APPROVED" } : l));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "-reject");
    try {
      await leavesApi.reject(id, "HR Admin");
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: "REJECTED" } : l));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
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
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">{filtered.length} requests</h2>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400">No leave requests found.</p>
          )}
          {filtered.map((leave) => {
            const name = getEmployeeName(leave);
            return (
              <Card key={leave.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{name}</p>
                          <p className="text-xs text-gray-400">{leave.employee?.title ?? ""} {leave.employee?.department?.name ? `· ${leave.employee.department.name}` : ""}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_TYPE_COLORS[leave.type] ?? "bg-gray-100 text-gray-800"}`}>
                              {leave.type}
                            </span>
                            <Badge variant={STATUS_VARIANT[leave.status] ?? "secondary"}>{leave.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">{leave.days} day{leave.days !== 1 ? "s" : ""}</p>
                          <p className="text-xs text-gray-500">{leave.startDate} → {leave.endDate}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">&ldquo;{leave.reason}&rdquo;</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-400">
                          Submitted {new Date(leave.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {leave.approvedBy && ` · Reviewed by ${leave.approvedBy}`}
                        </p>
                        {leave.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(leave.id)}
                              disabled={actionLoading !== null}
                              className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === leave.id + "-approve" ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              disabled={actionLoading !== null}
                              className="px-2.5 py-1 rounded-lg border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === leave.id + "-reject" ? "..." : "Reject"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Leaves</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {leaves.filter((l) => l.status === "APPROVED" && new Date(l.startDate) > new Date()).length === 0 ? (
                <p className="text-xs text-gray-400">No upcoming approved leaves.</p>
              ) : (
                <div className="space-y-2">
                  {leaves
                    .filter((l) => l.status === "APPROVED" && new Date(l.startDate) > new Date())
                    .slice(0, 5)
                    .map((l) => {
                      const name = getEmployeeName(l);
                      return (
                        <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <Avatar name={name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-500">{l.type} · {l.startDate}</p>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{l.days}d</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
