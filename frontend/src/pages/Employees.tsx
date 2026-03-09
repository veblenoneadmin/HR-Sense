import { useState, useEffect, useRef } from "react";
import { Search, Filter, UserPlus, Mail, Shield, Circle, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { employeesApi, performanceApi, getOrgId, EmployeeRow, KpiMetric } from "@/lib/api";
import EmployeeDetailModal from "@/components/EmployeeDetailModal";
import CreateProfileModal from "@/components/CreateProfileModal";

const ROLE_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  OWNER: "destructive", ADMIN: "warning", MANAGER: "default",
  DEVELOPER: "secondary", STAFF: "outline", CLIENT: "secondary",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function CardMenu({ user, onEdit, onCreate, onDelete }: {
  user: EmployeeRow;
  onEdit: () => void;
  onCreate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1 rounded-md transition-colors"
        style={{ color: '#6e6e6e' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3c3c3c'; e.currentTarget.style.color = '#cccccc'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6e6e6e'; }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-44 rounded-lg overflow-hidden z-20"
          style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          {user.profileId ? (
            <>
              <button
                onClick={() => { setOpen(false); onEdit(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                style={{ color: '#cccccc' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3c3c3c')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Pencil className="w-3.5 h-3.5" style={{ color: '#7dbfff' }} />
                Edit Profile
              </button>
              <button
                onClick={() => { setOpen(false); onDelete(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                style={{ color: '#f44747' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(244,71,71,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => { setOpen(false); onCreate(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
              style={{ color: '#cccccc' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3c3c3c')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <UserPlus className="w-3.5 h-3.5" style={{ color: '#81c784' }} />
              Create Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [metrics, setMetrics] = useState<KpiMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [creating, setCreating] = useState<EmployeeRow | null>(null);

  useEffect(() => {
    const orgId = getOrgId();
    const period = currentPeriod();
    setLoading(true);
    Promise.all([employeesApi.list(orgId), performanceApi.list(orgId, period)])
      .then(([empRes, perfRes]) => { setEmployees(empRes.employees); setMetrics(perfRes.metrics); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(user: EmployeeRow) {
    if (!user.profileId) return;
    if (!confirm(`Delete HR profile for ${user.name}? This cannot be undone.`)) return;
    try {
      await employeesApi.deleteProfile(user.profileId);
      setEmployees(prev => prev.map(e => e.id === user.id
        ? { ...e, profileId: undefined, employeeCode: undefined, title: undefined, department: undefined, departmentId: undefined, baseSalary: undefined, ratePerHour: undefined, startDate: undefined, sssNumber: undefined, sssContribution: undefined, philHealthNumber: undefined, philHealthContribution: undefined, pagIbigNumber: undefined, pagIbigContribution: undefined, hasHealthCard: undefined, healthCardProvider: undefined }
        : e));
    } catch (e: any) {
      alert(e.message ?? "Delete failed");
    }
  }

  if (loading) return <div className="p-6 text-sm" style={{ color: '#858585' }}>Loading employees...</div>;
  if (error) return <div className="p-6 text-sm text-red-400">Error: {error}</div>;

  const perfMap = Object.fromEntries(metrics.map((m) => [m.userId, m]));
  const filtered = search
    ? employees.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.department ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const managers = employees.filter((u) => u.role === "MANAGER" || u.role === "OWNER" || u.role === "ADMIN").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-full sm:w-72" style={{ border: '1px solid #3c3c3c', backgroundColor: '#252526' }}>
          <Search className="w-4 h-4" style={{ color: '#6e6e6e' }} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-transparent outline-none w-full placeholder-gray-600"
            style={{ color: '#cccccc' }}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors" style={{ border: '1px solid #3c3c3c', color: '#999999', backgroundColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: employees.length, color: '#e0e0e0' },
          { label: "Active", value: employees.filter((u) => u.isActive).length, color: '#81c784' },
          { label: "Managers", value: managers, color: '#7dbfff' },
          { label: "Showing", value: filtered.length, color: '#ffb74d' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg px-4 py-3" style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
            <p className="text-xs" style={{ color: '#858585' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((user) => {
          const perf = perfMap[user.id];
          return (
            <Card key={user.id} className="hover:shadow-lg transition-all cursor-pointer" onDoubleClick={() => setSelected(user)}
              style={{ backgroundColor: '#2d2d2d', borderColor: '#3c3c3c' }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#505050')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#3c3c3c')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Avatar name={user.name} size="lg" />
                  <div className="flex items-start gap-1">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={ROLE_COLORS[user.role] ?? "secondary"}>{user.role}</Badge>
                      <div className="flex items-center gap-1">
                        <Circle className={`w-2 h-2 ${user.isActive ? "text-green-400 fill-green-400" : "fill-current"}`} style={user.isActive ? {} : { color: '#6e6e6e' }} />
                        <span className="text-xs" style={{ color: '#858585' }}>{user.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                    <CardMenu
                      user={user}
                      onEdit={() => setSelected(user)}
                      onCreate={() => setCreating(user)}
                      onDelete={() => handleDelete(user)}
                    />
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="font-semibold text-sm" style={{ color: '#e0e0e0' }}>{user.name}</p>
                  {user.title && <p className="text-xs" style={{ color: '#999999' }}>{user.title}</p>}
                  {user.department && <p className="text-xs" style={{ color: '#6e6e6e' }}>{user.department}</p>}
                </div>

                <div className="flex items-center gap-2 text-xs mb-3" style={{ color: '#858585' }}>
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>

                {perf ? (
                  <div className="pt-3 grid grid-cols-3 gap-2 text-center" style={{ borderTop: '1px solid #3c3c3c' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#7dbfff' }}>{perf.hoursLogged}h</p>
                      <p className="text-xs" style={{ color: '#6e6e6e' }}>Hours</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#81c784' }}>{perf.tasksCompleted}</p>
                      <p className="text-xs" style={{ color: '#6e6e6e' }}>Tasks</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#ce93d8' }}>{perf.performanceScore.toFixed(1)}</p>
                      <p className="text-xs" style={{ color: '#6e6e6e' }}>Score</p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3" style={{ borderTop: '1px solid #3c3c3c' }}>
                    <p className="text-xs italic" style={{ color: '#6e6e6e' }}>No performance data</p>
                  </div>
                )}

                <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: '#6e6e6e' }}>
                  <Shield className="w-3 h-3" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: '#6e6e6e' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span>Employee data sourced from EverSense · {employees.length} members · Double-click a card to view/edit profile</span>
      </div>

      {selected && (
        <EmployeeDetailModal
          employee={selected}
          perf={perfMap[selected.id]}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setSelected(updated);
          }}
        />
      )}

      {creating && (
        <CreateProfileModal
          employee={creating}
          onClose={() => setCreating(null)}
          onCreated={(updated) => {
            setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setCreating(null);
          }}
        />
      )}
    </div>
  );
}
