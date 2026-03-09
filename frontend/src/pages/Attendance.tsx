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
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setLoading(true);
    attendanceApi.get(orgId, startDate, endDate)
      .then((res) => { setSummary(res.summary); setLogs(res.logs); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm" style={{ color: '#858585' }}>Loading attendance...</div>;
  if (error) return <div className="p-6 text-sm text-red-400">Error: {error}</div>;

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
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)' }}>
        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#81c784' }} />
        <p className="text-sm" style={{ color: '#81c784' }}>
          <span className="font-semibold">Sourced from EverSense TimeLogs</span> — Last 30 days · {summary.length} active employees
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, sub: "Team total", color: '#7dbfff' },
          { label: "Avg / Employee", value: summary.length > 0 ? `${(totalHours / summary.length).toFixed(1)}h` : "—", sub: "Per person", color: '#81c784' },
          { label: "Overtime", value: overtimeCount, sub: "Above normal", color: '#ffb74d' },
          { label: "Low Hours", value: lowCount, sub: "Below average", color: '#f44747' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
            <p className="text-xs font-medium" style={{ color: '#858585' }}>{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6e6e6e' }}>{s.sub}</p>
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ border: '1px solid #3c3c3c', color: '#999999', backgroundColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <Download className="w-3 h-3" />
              Export
            </button>
          </CardHeader>
          <CardContent>
            {summary.length === 0 ? (
              <p className="text-sm" style={{ color: '#6e6e6e' }}>No attendance data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                      <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Employee</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Hours</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Sessions</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Projects</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: '#858585' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.userId} className="transition-colors" style={{ borderBottom: '1px solid #333333' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333333')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.userName} size="sm" />
                            <p className="font-medium" style={{ color: '#e0e0e0' }}>{s.userName}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-semibold" style={{ color: s.status === "OVERTIME" ? '#ffb74d' : s.status === "LOW" ? '#f44747' : '#e0e0e0' }}>
                            {s.totalHours.toFixed(1)}h
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right" style={{ color: '#cccccc' }}>{s.sessions}</td>
                        <td className="py-3 px-3 text-right" style={{ color: '#cccccc' }}>{s.projectCount}</td>
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
              <p className="text-sm" style={{ color: '#6e6e6e' }}>No logs available.</p>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 15).map((log) => {
                  const hours = (log.duration / 3600).toFixed(1);
                  const date = new Date(log.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c' }}>
                      <Avatar name={log.userId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium truncate" style={{ color: '#e0e0e0' }}>{log.userId}</p>
                          <span className="text-xs font-semibold text-blue-400">{hours}h</span>
                        </div>
                        <p className="text-xs truncate" style={{ color: '#858585' }}>{log.projectName ?? "General"}</p>
                        <p className="text-xs" style={{ color: '#6e6e6e' }}>{date}</p>
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
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ffb74d' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ffb74d' }}>Overtime Alert</p>
              <p className="text-xs mt-0.5" style={{ color: '#cc8800' }}>
                {summary.filter((s) => s.status === "OVERTIME").map((s) => `${s.userName} (${s.totalHours.toFixed(0)}h)`).join(", ")} — consider redistributing workload.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs" style={{ color: '#6e6e6e' }}>
        <TrendingUp className="w-3 h-3" />
        <span>Sourced from EverSense TimeLog model · {logs.length} entries</span>
      </div>
    </div>
  );
}
