import { useState, useEffect } from "react";
import { CalendarOff, CheckCircle2, XCircle, Clock, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { leavesApi, employeesApi, getOrgId, LeaveRequestRow, EmployeeRow, CreateLeaveRequest, EverSenseLeave } from "@/lib/api";

const inputCls = "w-full px-2.5 py-1.5 text-sm rounded-md outline-none";
const inputSx: React.CSSProperties = { border: '1px solid #3c3c3c', backgroundColor: '#1e1e1e', color: '#cccccc' };
function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) { e.target.style.borderColor = '#007acc'; }
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) { e.target.style.borderColor = '#3c3c3c'; }
function Label({ text }: { text: string }) {
  return <label className="text-xs block mb-1" style={{ color: '#858585' }}>{text}</label>;
}

// Count weekdays (Mon–Fri) inclusive between two date strings
function countWeekdays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (s > e) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function NewLeaveModal({ employees, onClose, onCreated }: {
  employees: EmployeeRow[];
  onClose: () => void;
  onCreated: (leave: LeaveRequestRow) => void;
}) {
  const eligible = employees.filter(e => e.profileId);
  const [form, setForm] = useState({ employeeId: eligible[0]?.profileId ?? '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const days = countWeekdays(form.startDate, form.endDate);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.employeeId) { setError('Select an employee.'); return; }
    if (!form.startDate || !form.endDate) { setError('Start and end date are required.'); return; }
    if (days < 1) { setError('End date must be on or after start date.'); return; }
    if (!form.reason.trim()) { setError('Reason is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const body: CreateLeaveRequest = { employeeId: form.employeeId, type: form.type, startDate: form.startDate, endDate: form.endDate, days, reason: form.reason.trim() };
      const res = await leavesApi.create(body);
      onCreated(res.request);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create request.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #3c3c3c' }}>
          <h2 className="font-bold text-sm" style={{ color: '#e0e0e0' }}>New Leave Request</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#6e6e6e' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.color = '#cccccc'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6e6e6e'; }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <Label text="Employee *" />
            <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)} className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur}>
              {eligible.length === 0 && <option value="">No employees with HR profile</option>}
              {eligible.map(e => <option key={e.profileId} value={e.profileId!}>{e.name}{e.title ? ` — ${e.title}` : ''}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <Label text="Leave Type *" />
            <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur}>
              {['ANNUAL','SICK','UNPAID','MATERNITY','PATERNITY','BEREAVEMENT'].map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label text="Start Date *" />
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="space-y-1">
              <Label text="End Date *" />
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputCls} style={inputSx} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {days > 0 && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(0,122,204,0.1)', border: '1px solid rgba(0,122,204,0.25)', color: '#7dbfff' }}>
              {days} working day{days !== 1 ? 's' : ''} (weekdays only)
            </p>
          )}

          <div className="space-y-1">
            <Label text="Reason *" />
            <textarea name="reason" value={form.reason} onChange={e => set('reason', e.target.value)} rows={3} placeholder="Briefly describe the reason…"
              className="w-full px-2.5 py-1.5 text-sm rounded-md outline-none resize-none" style={inputSx} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#f44747', backgroundColor: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.25)' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #3c3c3c', backgroundColor: '#1e1e1e' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg"
            style={{ border: '1px solid #3c3c3c', color: '#999999', backgroundColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0e639c' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#1177bb'; }}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0e639c')}>
            <Plus className="w-3.5 h-3.5" />
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [showNewModal, setShowNewModal] = useState(false);
  const [esSynced, setEsSynced] = useState<EverSenseLeave[]>([]);

  const loadData = () => {
    const orgId = getOrgId();
    setLoading(true);
    Promise.all([
      leavesApi.list(),
      employeesApi.list(orgId),
      leavesApi.eversense({ orgId }).catch(() => ({ leaves: [] })),
    ])
      .then(([leavesRes, empRes, esRes]) => {
        setLeaves(leavesRes.requests);
        setEsSynced(esRes.leaves);
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
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors">
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
              <CardTitle>Synced to EverSense</CardTitle>
              <CardDescription>{esSynced.length} approved leave{esSynced.length !== 1 ? 's' : ''} reflected</CardDescription>
            </CardHeader>
            <CardContent>
              {esSynced.length === 0 ? (
                <p className="text-xs" style={{ color: '#6e6e6e' }}>No synced leaves yet.</p>
              ) : (
                <div className="space-y-2">
                  {esSynced.slice(0, 6).map((l) => {
                    const emp = Object.values(empMap).find(e => e.id === l.userId);
                    const typeStyle = LEAVE_TYPE_COLORS[l.type] ?? { bg: 'rgba(255,255,255,0.08)', color: '#999999' };
                    return (
                      <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>{emp?.name ?? l.userId}</p>
                          <p className="text-xs" style={{ color: typeStyle.color }}>{l.type} · {l.days}d</p>
                          <p className="text-xs" style={{ color: '#6e6e6e' }}>{new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

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

      {showNewModal && (
        <NewLeaveModal
          employees={Object.values(empMap)}
          onClose={() => setShowNewModal(false)}
          onCreated={(leave) => {
            setLeaves(prev => [leave, ...prev]);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}
