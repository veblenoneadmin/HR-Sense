import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Mail, Shield, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { employeesApi, performanceApi, getOrgId, EmployeeRow, KpiMetric } from "@/lib/api";

const ROLE_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  OWNER: "destructive", ADMIN: "warning", MANAGER: "default",
  DEVELOPER: "secondary", STAFF: "outline", CLIENT: "secondary",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [metrics, setMetrics] = useState<KpiMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const orgId = getOrgId();
    const period = currentPeriod();
    setLoading(true);
    Promise.all([employeesApi.list(orgId), performanceApi.list(orgId, period)])
      .then(([empRes, perfRes]) => {
        setEmployees(empRes.employees);
        setMetrics(perfRes.metrics);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading employees...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

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
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-700 bg-transparent outline-none w-full placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <UserPlus className="w-3.5 h-3.5" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: employees.length, color: "text-gray-900" },
          { label: "Active", value: employees.filter((u) => u.isActive).length, color: "text-green-600" },
          { label: "Managers", value: managers, color: "text-blue-600" },
          { label: "Showing", value: filtered.length, color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((user) => {
          const perf = perfMap[user.id];
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Avatar name={user.name} size="lg" />
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={ROLE_COLORS[user.role] ?? "secondary"}>{user.role}</Badge>
                    <div className="flex items-center gap-1">
                      <Circle className={`w-2 h-2 ${user.isActive ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"}`} />
                      <span className="text-xs text-gray-500">{user.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                  {user.title && <p className="text-xs text-gray-500">{user.title}</p>}
                  {user.department && <p className="text-xs text-gray-400">{user.department}</p>}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>

                {perf ? (
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{perf.hoursLogged}h</p>
                      <p className="text-xs text-gray-400">Hours</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{perf.tasksCompleted}</p>
                      <p className="text-xs text-gray-400">Tasks</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{perf.performanceScore.toFixed(1)}</p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 italic">No performance data</p>
                  </div>
                )}

                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                  <Shield className="w-3 h-3" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span>Employee data sourced from EverSense · {employees.length} members</span>
      </div>
    </div>
  );
}
