import { useState, useEffect } from "react";
import { CalendarOff, CheckCircle2, XCircle, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { leavesApi, employeesApi, getOrgId, LeaveRequestRow, EmployeeRow } from "@/lib/api";

const LEAVE_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  ANNUAL:      { bg: 'rgba(0,122,204,0.15)',    color: '#7dbfff' },
  SICK:        { bg: 'rgba(244,71,71,0.15)',     color: '#f44747' },
  UNPAID:      { bg: 'rgba(255,255,255,0.08)',   color: '#999999' },
  MATERNITY:   { bg: 'rgba(233,30,99,0.15)',     color: '#f48fb1' },
  PATERNITY:   { bg: 'rgba(63,81,181,0.15)',     color: '#9fa8da' },
  BEREAVEMENT: { bg: 'rgba(156,39,176,0.15)',    color: '#ce93d8' },
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

  if (loading) return <div className="p-6 text-sm" style={{ color: '#858585' }}>Loading leaves...</div>;
  if (error) return <div className="p-6 text-sm text-red-400">Error: {error}</div>;

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
    } catch (err) { alert((err as Error).message); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "-reject");
    try {
      await leavesApi.reject(id, "HR Admin");
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: "REJECTED" } : l));
    } catch (err) { alert((err as Error).message); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filter === f ? '#007acc' : 'transparent',
                color: filter === f ? '#ffffff' : '#999999',
                border: `1px solid ${filter === f ? '#007acc' : '#3c3c3c'}`,
              }}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pending, icon: Clock, color: '#ffd54f' },
          { label: "Approved", value: approved, icon: CheckCircle2, color: '#81c784' },
          { label: "Rejected", value: rejected, icon: XCircle, color: '#f44747' },
          { label: "Days Approved", value: totalDays, icon: CalendarOff, color: '#7dbfff' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#858585' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: '#cccccc' }}>{filtered.length} requests</h2>
          {filtered.length === 0 && (
            <p className="text-sm" style={{ color: '#6e6e6e' }}>No leave requests found.</p>
          )}
          {filtered.map((leave) => {
            const name = getEmployeeName(leave);
            const typeStyle = LEAVE_TYPE_COLORS[leave.type] ?? { bg: 'rgba(255,255,255,0.08)', color: '#999999' };
            return (
              <Card key={leave.id} className="transition-shadow hover:shadow-md" style={{ backgroundColor: '#2d2d2d', borderColor: '#3c3c3c' }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{name}</p>
                          <p className="text-xs" style={{ color: '#6e6e6e' }}>{leave.employee?.title ?? ""} {leave.employee?.department?.name ? `· ${leave.employee.department.name}` : ""}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>
                              {leave.type}
                            </span>
                            <Badge variant={STATUS_VARIANT[leave.status] ?? "secondary"}>{leave.status}</Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{leave.days} day{leave.days !== 1 ? "s" : ""}</p>
                          <p className="text-xs" style={{ color: '#858585' }}>{leave.startDate} → {leave.endDate}</p>
                        </div>
                      </div>
                      <p className="text-xs mt-2 italic" style={{ color: '#858585' }}>&ldquo;{leave.reason}&rdquo;</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs" style={{ color: '#6e6e6e' }}>
                          Submitted {new Date(leave.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {leave.approvedBy && ` · Reviewed by ${leave.approvedBy}`}
                        </p>
                        {leave.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(leave.id)}
                              disabled={actionLoading !== null}
                              className="px-2.5 py-1 rounded-lg text-white text-xs transition-colors disabled:opacity-50"
                              style={{ backgroundColor: '#2e7d32' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#388e3c')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2e7d32')}>
                              {actionLoading === leave.id + "-approve" ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              disabled={actionLoading !== null}
                              className="px-2.5 py-1 rounded-lg text-xs transition-colors disabled:opacity-50"
                              style={{ border: '1px solid rgba(244,71,71,0.4)', color: '#f44747', backgroundColor: 'transparent' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(244,71,71,0.1)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
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
                <p className="text-xs" style={{ color: '#6e6e6e' }}>No upcoming approved leaves.</p>
              ) : (
                <div className="space-y-2">
                  {leaves
                    .filter((l) => l.status === "APPROVED" && new Date(l.startDate) > new Date())
                    .slice(0, 5)
                    .map((l) => {
                      const name = getEmployeeName(l);
                      return (
                        <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c' }}>
                          <Avatar name={name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium" style={{ color: '#e0e0e0' }}>{name}</p>
                            <p className="text-xs" style={{ color: '#858585' }}>{l.type} · {l.startDate}</p>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: '#cccccc' }}>{l.days}d</span>
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
