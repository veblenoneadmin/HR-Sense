import { useState, useEffect } from "react";
import { Clock, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { attendanceApi, getOrgId, AttendanceSummary, TimeLogEntry } from "@/lib/api";

export default function AttendancePage() {
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [logs, setLogs] = useState<TimeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const orgId = getOrgId();
    // Last 30 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setLoading(true);
    attendanceApi.get(orgId, startDate, endDate)
      .then((res) => {
        setSummary(res.summary);
        setLogs(res.logs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading attendance...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

  const totalHours = summary.reduce((a, s) => a + s.totalHours, 0);
  const overtimeCount = summary.filter((s) => s.status === "OVERTIME").length;
  const lowCount = summary.filter((s) => s.status === "LOW").length;

  const statusBadge = (status: string) => {
    if (status === "OVERTIME") return "warning" as const;
    if (status === "LOW") return "secondary" as const;
    return "success" as const;
  };
  const statusLabel = (status: string) => {
    if (status === "OVERTIME") return "Overtime";
    if (status === "LOW") return "Low Hours";
    return "Normal";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
        <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700">
          <span className="font-semibold">Sourced from EverSense TimeLogs</span> — Last 30 days · {summary.length} active employees
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, sub: "Team total", color: "blue" },
          { label: "Avg / Employee", value: summary.length > 0 ? `${(totalHours / summary.length).toFixed(1)}h` : "—", sub: "Per person", color: "green" },
          { label: "Overtime", value: overtimeCount, sub: "Above normal", color: "orange" },
          { label: "Low Hours", value: lowCount, sub: "Below average", color: "red" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color === "blue" ? "text-blue-600" : s.color === "green" ? "text-green-600" : s.color === "orange" ? "text-orange-600" : "text-red-600"}`}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Last 30 days · Synced from EverSense</CardDescription>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              <Download className="w-3 h-3" />
              Export
            </button>
          </CardHeader>
          <CardContent>
            {summary.length === 0 ? (
              <p className="text-sm text-gray-400">No attendance data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Employee</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Hours</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Sessions</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Projects</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.userId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.userName} size="sm" />
                            <p className="font-medium text-gray-900">{s.userName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-semibold ${s.status === "OVERTIME" ? "text-orange-600" : s.status === "LOW" ? "text-yellow-600" : "text-gray-900"}`}>
                            {s.totalHours.toFixed(1)}h
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-gray-600">{s.sessions}</td>
                        <td className="py-3 px-3 text-right text-gray-600">{s.projectCount}</td>
                        <td className="py-3 px-3">
                          <Badge variant={statusBadge(s.status)}>{statusLabel(s.status)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Time Logs</CardTitle>
            <CardDescription>Raw EverSense TimeLog records</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400">No logs available.</p>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 15).map((log) => {
                  const hours = (log.duration / 3600).toFixed(1);
                  const date = new Date(log.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <Avatar name={log.userId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-900 truncate">{log.userId}</p>
                          <span className="text-xs font-semibold text-blue-600">{hours}h</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{log.projectName ?? "General"}</p>
                        <p className="text-xs text-gray-400">{date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {overtimeCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Overtime Alert</p>
                <p className="text-xs text-orange-700 mt-0.5">
                  {summary.filter((s) => s.status === "OVERTIME").map((s) => `${s.userName} (${s.totalHours.toFixed(0)}h)`).join(", ")} — consider redistributing workload.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <TrendingUp className="w-3 h-3" />
        <span>Sourced from EverSense TimeLog model · {logs.length} entries</span>
      </div>
    </div>
  );
}
