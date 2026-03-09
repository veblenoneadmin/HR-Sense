import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, Star, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { performanceApi, getOrgId, KpiMetric } from "@/lib/api";

const TIER_CONFIG: Record<string, { label: string; color: "default" | "success" | "destructive" | "warning" | "secondary"; bg: string }> = {
  STAR: { label: "Star Performer", color: "success", bg: "bg-green-50" },
  GOOD: { label: "Good", color: "default", bg: "bg-blue-50" },
  AVERAGE: { label: "Average", color: "secondary", bg: "bg-gray-50" },
  BURNOUT_RISK: { label: "Burnout Risk", color: "warning", bg: "bg-yellow-50" },
  UNDERPERFORMING: { label: "Needs Review", color: "destructive", bg: "bg-red-50" },
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<KpiMetric[]>([]);
  const [avgHours, setAvgHours] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const orgId = getOrgId();
    const period = currentPeriod();
    setLoading(true);
    performanceApi.list(orgId, period)
      .then((res) => {
        setMetrics(res.metrics);
        setAvgHours(res.summary.avgHours);
        setAvgScore(res.summary.avgScore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading performance data...</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Error: {error}</div>;

  const stars = metrics.filter((m) => m.tier === "STAR").length;
  const avgTasks = metrics.length > 0 ? metrics.reduce((a, m) => a + m.tasksCompleted, 0) / metrics.length : 0;
  const period = currentPeriod();
  const periodLabel = new Date(period + "-01").toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 border border-purple-200">
        <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <p className="text-sm text-purple-700">
          <span className="font-semibold">Synced from EverSense KPIs</span> — Performance scores from TimeLog, Task, and report data. Period: {periodLabel}.
        </p>
      </div>

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

      {metrics.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">No performance data for this period.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Leaderboard</CardTitle>
              <CardDescription>Ranked by composite score — tasks, hours, reports · {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.map((m, i) => {
                  const config = TIER_CONFIG[m.tier] ?? TIER_CONFIG.AVERAGE;
                  return (
                    <div key={m.userId} className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white border border-gray-200 flex-shrink-0">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </div>
                      <Avatar name={m.userName ?? m.userId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{m.userName ?? m.userId}</p>
                          <Badge variant={config.color}>{config.label}</Badge>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.hoursLogged}h</p>
                          <p className="text-xs text-gray-400">Hours</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.tasksCompleted}</p>
                          <p className="text-xs text-gray-400">Tasks</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.reportsSubmitted}</p>
                          <p className="text-xs text-gray-400">Reports</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 w-16">
                        <p className="text-base font-bold text-gray-900">{m.performanceScore.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {metrics.some((m) => m.tier === "BURNOUT_RISK") && (
              <Card className="border-yellow-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <CardTitle className="text-yellow-800">Burnout Risk</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.filter((m) => m.tier === "BURNOUT_RISK").map((m) => (
                      <div key={m.userId}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={m.userName ?? m.userId} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{m.userName ?? m.userId}</p>
                            <p className="text-xs text-gray-500">{m.hoursLogged}h logged</p>
                          </div>
                        </div>
                        <p className="text-xs text-yellow-700 bg-yellow-50 rounded p-2 border border-yellow-100">
                          Workload redistribution and 1-on-1 check-in recommended.
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {metrics.some((m) => m.tier === "UNDERPERFORMING") && (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <CardTitle className="text-red-800">Needs Attention</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.filter((m) => m.tier === "UNDERPERFORMING").map((m) => (
                      <div key={m.userId}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar name={m.userName ?? m.userId} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{m.userName ?? m.userId}</p>
                            <p className="text-xs text-gray-500">{m.hoursLogged}h · {m.tasksCompleted} tasks</p>
                          </div>
                        </div>
                        <p className="text-xs text-red-700 bg-red-50 rounded p-2 border border-red-100">
                          Below team averages. Performance review recommended.
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {metrics.some((m) => m.tier === "STAR") && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <CardTitle>Top Performers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.filter((m) => m.tier === "STAR").map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                        <Avatar name={m.userName ?? m.userId} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{m.userName ?? m.userId}</p>
                          <p className="text-xs text-gray-500">{m.hoursLogged}h · {m.tasksCompleted} tasks</p>
                        </div>
                        <span className="text-sm font-bold text-green-700">{m.performanceScore.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Score Methodology</p>
          <p className="text-xs text-gray-600">
            Performance score = weighted composite of: <strong>hours logged</strong> vs. team avg ({avgHours.toFixed(1)}h),{" "}
            <strong>tasks completed</strong>, and <strong>reports submitted</strong>.
            Thresholds: Star ≥ 1.5 · Good ≥ 1.0 · Average ≥ 0.7 · Burnout Risk = hours &gt; 160% avg · Underperforming &lt; 0.5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
