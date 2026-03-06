import { Clock, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MOCK_TIMELOGS, MOCK_USERS, USER_TITLES, USER_DEPARTMENTS } from "@/lib/mock-data";

// Aggregate by user
function getUserAttendance() {
  return MOCK_USERS.filter((u) => u.isActive).map((user) => {
    const logs = MOCK_TIMELOGS.filter((t) => t.userId === user.id);
    const totalMinutes = logs.reduce((a, t) => a + t.duration, 0);
    const totalHours = totalMinutes / 60;
    const avgPerDay = logs.length > 0 ? totalHours / logs.length : 0;
    const isOvertime = totalHours > 50;
    const isUnder = totalHours < 20 && logs.length > 0;
    const status = isOvertime ? "overtime" : isUnder ? "under" : logs.length === 0 ? "absent" : "normal";
    return { user, logs, totalHours, avgPerDay, status };
  });
}

const attendance = getUserAttendance();
const totalWeekHours = attendance.reduce((a, e) => a + e.totalHours, 0);
const overtimeCount = attendance.filter((e) => e.status === "overtime").length;
const absentCount = attendance.filter((e) => e.status === "absent").length;

export default function AttendancePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Data source notice */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
        <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700">
          <span className="font-semibold">Sourced from EverSense TimeLogs</span> — Showing week of Feb 16–22, 2026. Each entry maps to an EverSense <code className="bg-green-100 px-1 rounded text-xs">TimeLog</code> record with userId, duration, project, and timestamps.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Hours", value: `${totalWeekHours.toFixed(1)}h`, sub: "Team this week", color: "blue" },
          { label: "Avg / Employee", value: `${(totalWeekHours / attendance.length).toFixed(1)}h`, sub: "Per person", color: "green" },
          { label: "Overtime", value: overtimeCount, sub: "Employees over 50h", color: "orange" },
          { label: "No Logs", value: absentCount, sub: "No time entries", color: "red" },
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
        {/* Attendance table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Weekly Time Logs</CardTitle>
              <CardDescription>Feb 16–22, 2026 · Synced from EverSense</CardDescription>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              <Download className="w-3 h-3" />
              Export
            </button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Employee</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Department</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Hours</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Sessions</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(({ user, logs, totalHours, status }) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={user.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{USER_TITLES[user.id]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{USER_DEPARTMENTS[user.id]}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-semibold ${status === "overtime" ? "text-orange-600" : status === "under" ? "text-yellow-600" : status === "absent" ? "text-red-500" : "text-gray-900"}`}>
                          {totalHours.toFixed(1)}h
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600">{logs.length}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            status === "overtime" ? "warning"
                            : status === "under" ? "secondary"
                            : status === "absent" ? "destructive"
                            : "success"
                          }
                        >
                          {status === "overtime" ? "Overtime" : status === "under" ? "Low Hours" : status === "absent" ? "No Logs" : "Normal"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Individual log details */}
        <Card>
          <CardHeader>
            <CardTitle>Time Log Entries</CardTitle>
            <CardDescription>Raw EverSense TimeLog records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_TIMELOGS.map((log) => {
                const user = MOCK_USERS.find((u) => u.id === log.userId);
                if (!user) return null;
                const hours = (log.duration / 60).toFixed(1);
                const date = new Date(log.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={log.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <Avatar name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-900">{user.name}</p>
                        <span className="text-xs font-semibold text-blue-600">{hours}h</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{log.projectName ?? "General"}</p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overtime alert */}
      {overtimeCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Overtime Alert</p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Bob Smith logged 78.25 hours this week — 162% above the team average of 48h. This exceeds healthy thresholds and is flagged as a burnout risk. Consider redistributing workload across the engineering team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Hours by Project</CardTitle>
          <CardDescription>Time allocation across EverSense projects this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { project: "Website Redesign v2.0", hours: 140.5, client: "InnovateTech Solutions", color: "bg-blue-500" },
              { project: "VebTask – Time Tracking Platform", hours: 98.0, client: "Internal", color: "bg-purple-500" },
              { project: "AI Scheduler Integration", hours: 52.0, client: "TechCorp", color: "bg-green-500" },
              { project: "Mobile App MVP", hours: 12.5, client: "StartupXYZ", color: "bg-orange-500" },
              { project: "General / Unassigned", hours: 82.5, client: "—", color: "bg-gray-400" },
            ].map((p) => {
              const pct = Math.round((p.hours / totalWeekHours) * 100);
              return (
                <div key={p.project}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.color}`} />
                      <span className="text-sm text-gray-700">{p.project}</span>
                      <span className="text-xs text-gray-400">· {p.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{p.hours}h</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <TrendingUp className="w-3 h-3" />
        <span>Hours up 12% week-over-week · sourced from EverSense TimeLog model</span>
      </div>
    </div>
  );
}
