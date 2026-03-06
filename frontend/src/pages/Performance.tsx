import { TrendingUp, TrendingDown, Minus, AlertTriangle, Star, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MOCK_PERFORMANCE, USER_TITLES } from "@/lib/mock-data";

const TIER_CONFIG: Record<string, { label: string; color: "default" | "success" | "destructive" | "warning" | "secondary"; bg: string; text: string }> = {
  STAR: { label: "Star Performer", color: "success", bg: "bg-green-50", text: "text-green-700" },
  GOOD: { label: "Good", color: "default", bg: "bg-blue-50", text: "text-blue-700" },
  AVERAGE: { label: "Average", color: "secondary", bg: "bg-gray-50", text: "text-gray-700" },
  BURNOUT_RISK: { label: "Burnout Risk", color: "warning", bg: "bg-yellow-50", text: "text-yellow-700" },
  UNDERPERFORMING: { label: "Needs Review", color: "destructive", bg: "bg-red-50", text: "text-red-700" },
};

const avgHours = MOCK_PERFORMANCE.reduce((a, p) => a + p.hoursLogged, 0) / MOCK_PERFORMANCE.length;
const avgTasks = MOCK_PERFORMANCE.reduce((a, p) => a + p.tasksCompleted, 0) / MOCK_PERFORMANCE.length;
const avgScore = MOCK_PERFORMANCE.reduce((a, p) => a + p.performanceScore, 0) / MOCK_PERFORMANCE.length;
const stars = MOCK_PERFORMANCE.filter((p) => p.tier === "STAR").length;

export default function PerformancePage() {
  const sorted = [...MOCK_PERFORMANCE].sort((a, b) => b.performanceScore - a.performanceScore);

  return (
    <div className="p-6 space-y-6">
      {/* Source banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 border border-purple-200">
        <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <p className="text-sm text-purple-700">
          <span className="font-semibold">Synced from EverSense KPIs</span> — Performance scores are derived from EverSense{" "}
          <code className="bg-purple-100 px-1 rounded text-xs">TimeLog</code>,{" "}
          <code className="bg-purple-100 px-1 rounded text-xs">Task</code>, and report data. Period: February 2026.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Star Performers", value: stars, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Avg Hours/Month", value: `${avgHours.toFixed(1)}h`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Avg Tasks Done", value: avgTasks.toFixed(1), icon: Award, color: "text-green-500", bg: "bg-green-50" },
          { label: "Avg Score", value: avgScore.toFixed(2), icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Leaderboard</CardTitle>
            <CardDescription>Ranked by composite score — tasks, hours, reports · Feb 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sorted.map((p, i) => {
                const config = TIER_CONFIG[p.tier];
                return (
                  <div key={p.userId} className={`flex items-center gap-3 p-3 rounded-lg border ${config.bg} border-opacity-50`} style={{ borderColor: "transparent" }}>
                    {/* Rank */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white border border-gray-200 flex-shrink-0">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </div>

                    <Avatar name={p.userName} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{p.userName}</p>
                        <Badge variant={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{USER_TITLES[p.userId]} · {p.department}</p>
                    </div>

                    {/* Metrics */}
                    <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{p.hoursLogged}h</p>
                        <p className="text-xs text-gray-400">Hours</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{p.tasksCompleted}</p>
                        <p className="text-xs text-gray-400">Tasks</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{p.reportsSubmitted}</p>
                        <p className="text-xs text-gray-400">Reports</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0 w-16">
                      <p className="text-base font-bold text-gray-900">{p.performanceScore.toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-0.5">
                        {p.trend === "UP" && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {p.trend === "DOWN" && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {p.trend === "STABLE" && <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={`text-xs ${p.trend === "UP" ? "text-green-500" : p.trend === "DOWN" ? "text-red-500" : "text-gray-400"}`}>
                          {p.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action items panel */}
        <div className="space-y-4">
          <Card className="border-yellow-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <CardTitle className="text-yellow-800">Burnout Risk</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {MOCK_PERFORMANCE.filter((p) => p.tier === "BURNOUT_RISK").map((p) => (
                <div key={p.userId}>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={p.userName} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{p.userName}</p>
                      <p className="text-xs text-gray-500">{p.hoursLogged}h — 162% of avg</p>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded p-2 border border-yellow-100">
                    Logged {p.hoursLogged}h over {p.activeDays} active days. Recommend workload redistribution and 1-on-1 check-in.
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <CardTitle className="text-red-800">Needs Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_PERFORMANCE.filter((p) => p.tier === "UNDERPERFORMING").map((p) => (
                  <div key={p.userId}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar name={p.userName} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{p.userName}</p>
                        <p className="text-xs text-gray-500">{p.hoursLogged}h · {p.tasksCompleted} tasks · {p.activeDays} days</p>
                      </div>
                    </div>
                    <p className="text-xs text-red-700 bg-red-50 rounded p-2 border border-red-100">
                      Significantly below team averages. Performance review recommended. Discuss resource needs or leave status.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <CardTitle>Top Performers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_PERFORMANCE.filter((p) => p.tier === "STAR").map((p) => (
                  <div key={p.userId} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                    <Avatar name={p.userName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{p.userName}</p>
                      <p className="text-xs text-gray-500">{p.hoursLogged}h · {p.tasksCompleted} tasks</p>
                    </div>
                    <span className="text-sm font-bold text-green-700">{p.performanceScore.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Score methodology */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Score Methodology (from EverSense KPI Report)</p>
          <p className="text-xs text-gray-600">
            Performance score = weighted composite of: <strong>hours logged</strong> (vs. team avg of 48.19h),{" "}
            <strong>tasks completed</strong> (vs. avg of 3.5), and <strong>reports submitted</strong>.
            Thresholds: Star ≥ 1.5 · Good ≥ 1.0 · Average ≥ 0.7 · Burnout Risk = hours &gt; 160% of avg · Underperforming &lt; 0.5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
