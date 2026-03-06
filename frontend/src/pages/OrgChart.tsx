import { GitBranch, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MOCK_ORG_CHART, MOCK_DEPARTMENTS, USER_TITLES } from "@/lib/mock-data";

const ROLE_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  OWNER: "destructive",
  ADMIN: "warning",
  MANAGER: "default",
  DEVELOPER: "secondary",
  STAFF: "outline",
};

function OrgNode({ nodeId, depth = 0 }: { nodeId: string; depth?: number }) {
  const node = MOCK_ORG_CHART.find((n) => n.id === nodeId);
  if (!node) return null;

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}>
      <div className="relative mb-3">
        {depth > 0 && (
          <div className="absolute -left-4 top-5 w-4 h-px bg-gray-200" />
        )}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow w-fit max-w-xs">
          <Avatar name={node.name} size="md" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{node.name}</p>
              <Badge variant={ROLE_COLORS[node.role]}>{node.role}</Badge>
            </div>
            <p className="text-xs text-gray-500">{node.title}</p>
            <p className="text-xs text-gray-400">{node.department}</p>
          </div>
        </div>
      </div>

      {node.directReports.length > 0 && (
        <div className="space-y-0">
          {node.directReports.map((reportId) => (
            <OrgNode key={reportId} nodeId={reportId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const ceo = MOCK_ORG_CHART.find((n) => !n.reportsTo);

  return (
    <div className="p-6 space-y-6">
      {/* Source banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
        <GitBranch className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Org structure from EverSense</span> — Built from{" "}
          <code className="bg-gray-100 px-1 rounded text-xs">OrganizationMember</code> roles and project ownership hierarchy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Org tree */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organizational Chart</CardTitle>
            <CardDescription>Veblen Organization · {MOCK_ORG_CHART.length} members</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {ceo && <OrgNode nodeId={ceo.id} depth={0} />}
          </CardContent>
        </Card>

        {/* Departments panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <CardTitle>Departments</CardTitle>
              </div>
              <CardDescription>{MOCK_DEPARTMENTS.length} departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_DEPARTMENTS.map((dept) => (
                  <div key={dept.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {dept.memberCount}
                      </div>
                    </div>
                    {dept.headName && (
                      <p className="text-xs text-gray-500">Head: {dept.headName}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { role: "Owner", count: 1, color: "bg-red-500" },
                  { role: "Manager", count: 2, color: "bg-blue-500" },
                  { role: "Developer", count: 3, color: "bg-purple-500" },
                  { role: "Staff", count: 3, color: "bg-gray-400" },
                ].map((r) => {
                  const pct = Math.round((r.count / MOCK_ORG_CHART.length) * 100);
                  return (
                    <div key={r.role}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${r.color}`} />
                          <span className="text-xs text-gray-700">{r.role}</span>
                        </div>
                        <span className="text-xs text-gray-500">{r.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Members</CardTitle>
              <CardDescription>Full team directory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_ORG_CHART.map((node) => {
                  const manager = node.reportsTo ? MOCK_ORG_CHART.find((n) => n.id === node.reportsTo) : null;
                  return (
                    <div key={node.id} className="flex items-center gap-2">
                      <Avatar name={node.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{node.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {USER_TITLES[node.id]}
                          {manager ? ` → ${manager.name}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
