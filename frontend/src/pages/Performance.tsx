import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, Star, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { performanceApi, getOrgId, KpiMetric } from "@/lib/api";

const TIER_CONFIG: Record<string, { label: string; color: "default" | "success" | "destructive" | "warning" | "secondary"; rowBg: string; rowBorder: string }> = {
  STAR:          { label: "Star Performer", color: "success",     rowBg: 'rgba(76,175,80,0.08)',    rowBorder: 'rgba(76,175,80,0.2)'   },
  GOOD:          { label: "Good",           color: "default",     rowBg: 'rgba(0,122,204,0.08)',    rowBorder: 'rgba(0,122,204,0.2)'   },
  AVERAGE:       { label: "Average",        color: "secondary",   rowBg: 'rgba(255,255,255,0.03)',  rowBorder: '#3c3c3c'               },
  BURNOUT_RISK:  { label: "Burnout Risk",   color: "warning",     rowBg: 'rgba(255,152,0,0.08)',    rowBorder: 'rgba(255,152,0,0.2)'   },
  UNDERPERFORMING: { label: "Needs Review", color: "destructive", rowBg: 'rgba(244,71,71,0.08)',    rowBorder: 'rgba(244,71,71,0.2)'   },
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
      .then((res) => { setMetrics(res.metrics); setAvgHours(res.summary.avgHours); setAvgScore(res.summary.avgScore); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm" style={{ color: '#858585' }}>Loading performance data...</div>;
  if (error) return <div className="p-6 text-sm text-red-400">Error: {error}</div>;

  const stars = metrics.filter((m) => m.tier === "STAR").length;
  const avgTasks = metrics.length > 0 ? metrics.reduce((a, m) => a + m.tasksCompleted, 0) / metrics.length : 0;
  const period = currentPeriod();
  const periodLabel = new Date(period + "-01").toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'rgba(156,39,176,0.1)', border: '1px solid rgba(156,39,176,0.25)' }}>
        <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: '#ce93d8' }} />
        <p className="text-sm" style={{ color: '#ce93d8' }}>
          <span className="font-semibold">Synced from EverSense KPIs</span> — Performance scores from TimeLog, Task, and report data. Period: {periodLabel}.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Star Performers", value: stars, icon: Star, color: '#ffd54f' },
          { label: "Avg Hours/Month", value: `${avgHours.toFixed(1)}h`, icon: TrendingUp, color: '#7dbfff' },
          { label: "Avg Tasks Done", value: avgTasks.toFixed(1), icon: Award, color: '#81c784' },
          { label: "Avg Score", value: avgScore.toFixed(2), icon: TrendingUp, color: '#ce93d8' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#2d2d2d', border: '1px solid #3c3c3c' }}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <p className="text-xs font-medium" style={{ color: '#858585' }}>{s.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {metrics.length === 0 ? (
        <div className="p-8 text-center text-sm" style={{ color: '#6e6e6e' }}>No performance data for this period.</div>
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
                    <div key={m.userId} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: config.rowBg, border: `1px solid ${config.rowBorder}` }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#333333', border: '1px solid #4c4c4c', color: '#cccccc' }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </div>
                      <Avatar name={m.userName ?? m.userId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{m.userName ?? m.userId}</p>
                          <Badge variant={config.color}>{config.label}</Badge>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{m.hoursLogged}h</p>
                          <p className="text-xs" style={{ color: '#858585' }}>Hours</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{m.tasksCompleted}</p>
                          <p className="text-xs" style={{ color: '#858585' }}>Tasks</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{m.reportsSubmitted}</p>
                          <p className="text-xs" style={{ color: '#858585' }}>Reports</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 w-16">
                        <p className="text-base font-bold" style={{ color: '#e0e0e0' }}>{m.performanceScore.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {metrics.some((m) => m.tier === "BURNOUT_RISK") && (
              <Card style={{ borderColor: 'rgba(255,152,0,0.3)' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: '#ffb74d' }} />
                    <CardTitle style={{ color: '#ffb74d' }}>Burnout Risk</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.filter((m) => m.tier === "BURNOUT_RISK").map((m) => (
                      <div key={m.userId}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={m.userName ?? m.userId} size="sm" />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>{m.userName ?? m.userId}</p>
                            <p className="text-xs" style={{ color: '#858585' }}>{m.hoursLogged}h logged</p>
                          </div>
                        </div>
                        <p className="text-xs rounded p-2" style={{ color: '#cc8800', backgroundColor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.2)' }}>
                          Workload redistribution and 1-on-1 check-in recommended.
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {metrics.some((m) => m.tier === "UNDERPERFORMING") && (
              <Card style={{ borderColor: 'rgba(244,71,71,0.3)' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: '#f44747' }} />
                    <CardTitle style={{ color: '#f44747' }}>Needs Attention</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.filter((m) => m.tier === "UNDERPERFORMING").map((m) => (
                      <div key={m.userId}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar name={m.userName ?? m.userId} size="sm" />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>{m.userName ?? m.userId}</p>
                            <p className="text-xs" style={{ color: '#858585' }}>{m.hoursLogged}h · {m.tasksCompleted} tasks</p>
                          </div>
                        </div>
                        <p className="text-xs rounded p-2" style={{ color: '#f44747', backgroundColor: 'rgba(244,71,71,0.1)', border: '1px solid rgba(244,71,71,0.2)' }}>
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
                    <Star className="w-4 h-4 text-yellow-400" />
                    <CardTitle>Top Performers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.filter((m) => m.tier === "STAR").map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)' }}>
                        <Avatar name={m.userName ?? m.userId} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>{m.userName ?? m.userId}</p>
                          <p className="text-xs" style={{ color: '#858585' }}>{m.hoursLogged}h · {m.tasksCompleted} tasks</p>
                        </div>
                        <span className="text-sm font-bold text-green-400">{m.performanceScore.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl" style={{ backgroundColor: '#252526', border: '1px solid #3c3c3c' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#cccccc' }}>Score Methodology</p>
        <p className="text-xs" style={{ color: '#858585' }}>
          Performance score = weighted composite of: <strong style={{ color: '#cccccc' }}>hours logged</strong> vs. team avg ({avgHours.toFixed(1)}h),{" "}
          <strong style={{ color: '#cccccc' }}>tasks completed</strong>, and <strong style={{ color: '#cccccc' }}>reports submitted</strong>.
          Thresholds: Star ≥ 1.5 · Good ≥ 1.0 · Average ≥ 0.7 · Burnout Risk = hours &gt; 160% avg · Underperforming &lt; 0.5.
        </p>
      </div>
    </div>
  );
}
