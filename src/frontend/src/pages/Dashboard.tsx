import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  PauseCircle,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { ApprovalStatus, ProjectStage, ProjectStatus } from "../backend";
import { useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import { formatCurrency, formatDate } from "../lib/appUtils";
import {
  PRIORITY_LABELS,
  TIMELINE_PRIORITY,
  TIMELINE_STATUS_CLASSES,
  TIMELINE_STATUS_LABELS,
  getTimelineStatus,
} from "../lib/timelineUtils";

const _STATUS_COLORS = {
  Active: "var(--color-active)",
  Planning: "var(--color-planning)",
  Completed: "var(--color-completed)",
  "On Hold": "var(--color-onhold)",
};

const budgetChartConfig = {
  budget: { label: "Budget", color: "oklch(var(--chart-1))" },
  spent: { label: "Spent", color: "oklch(var(--chart-2))" },
};

const statusChartConfig = {
  active: { label: "Active", color: "oklch(var(--chart-1))" },
  planning: { label: "Planning", color: "oklch(var(--chart-4))" },
  completed: { label: "Completed", color: "oklch(var(--chart-2))" },
  onhold: { label: "On Hold", color: "oklch(var(--chart-5))" },
};

const STAGE_LABELS: Record<ProjectStage, string> = {
  [ProjectStage.planning]: "Planning",
  [ProjectStage.foundation]: "Foundation",
  [ProjectStage.structure]: "Structure",
  [ProjectStage.finishing]: "Finishing",
  [ProjectStage.completed]: "Completed",
};

const STAGE_COLORS: Record<ProjectStage, string> = {
  [ProjectStage.planning]: "bg-gray-100 text-gray-600 border-gray-200",
  [ProjectStage.foundation]: "bg-orange-100 text-orange-700 border-orange-200",
  [ProjectStage.structure]: "bg-blue-100 text-blue-700 border-blue-200",
  [ProjectStage.finishing]: "bg-purple-100 text-purple-700 border-purple-200",
  [ProjectStage.completed]: "bg-green-100 text-green-700 border-green-200",
};

const STAGE_ACCENT_COLORS: Record<ProjectStage, string> = {
  [ProjectStage.planning]: "border-l-gray-400",
  [ProjectStage.foundation]: "border-l-orange-500",
  [ProjectStage.structure]: "border-l-blue-500",
  [ProjectStage.finishing]: "border-l-purple-500",
  [ProjectStage.completed]: "border-l-green-500",
};

export default function Dashboard() {
  const { actor } = useActor();
  const { isAdmin } = useAuth();

  const { data: approvals } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && isAdmin,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: activeUsers } = useQuery({
    queryKey: ["active-users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveUsers();
    },
    enabled: !!actor && isAdmin,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const pendingCount = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.pending,
  ).length;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => actor!.getDashboardStats(),
    enabled: !!actor,
  });

  const { data: allProjectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => actor!.getProjects(),
    enabled: !!actor,
  });

  const { data: costSummaries } = useQuery({
    queryKey: ["all-cost-summaries"],
    queryFn: () => actor!.getAllProjectCostSummaries(),
    enabled: !!actor,
  });

  const allProjects = allProjectsData ?? [];
  const activeProjects = allProjects.filter(
    (p) => p.status === ProjectStatus.active,
  );
  const planningProjects = allProjects.filter(
    (p) => p.status === ProjectStatus.planning,
  );

  const stageCounts: Record<ProjectStage, number> = {
    [ProjectStage.planning]: allProjects.filter(
      (p) => p.stage === ProjectStage.planning,
    ).length,
    [ProjectStage.foundation]: allProjects.filter(
      (p) => p.stage === ProjectStage.foundation,
    ).length,
    [ProjectStage.structure]: allProjects.filter(
      (p) => p.stage === ProjectStage.structure,
    ).length,
    [ProjectStage.finishing]: allProjects.filter(
      (p) => p.stage === ProjectStage.finishing,
    ).length,
    [ProjectStage.completed]: allProjects.filter(
      (p) => p.stage === ProjectStage.completed,
    ).length,
  };

  // Timeline status counts across ALL projects
  const timelineCounts = allProjects.reduce(
    (acc, p) => {
      const s = getTimelineStatus(p);
      if (s !== "none") acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 } as Record<
      "green" | "yellow" | "red",
      number
    >,
  );

  // Sort dashboard projects: Red → Yellow → Green → none
  const unsortedDashboardProjects = [...activeProjects, ...planningProjects];
  const dashboardProjects = unsortedDashboardProjects.sort((a, b) => {
    return (
      TIMELINE_PRIORITY[getTimelineStatus(a)] -
      TIMELINE_PRIORITY[getTimelineStatus(b)]
    );
  });

  const budgetChartData = allProjects
    .map((p) => {
      const summary = costSummaries?.find((s) => s.projectId === p.id);
      return {
        name: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
        budget: p.budget,
        spent: summary?.totalSpent ?? 0,
      };
    })
    .filter((d) => d.budget > 0);

  const statusChartData = stats
    ? [
        {
          name: "Active",
          value: Number(stats.activeCount),
          fill: "oklch(var(--chart-1))",
        },
        {
          name: "Planning",
          value: Number(stats.planningCount),
          fill: "oklch(var(--chart-4))",
        },
        {
          name: "Completed",
          value: Number(stats.completedCount),
          fill: "oklch(var(--chart-2))",
        },
        {
          name: "On Hold",
          value: Number(stats.onHoldCount),
          fill: "oklch(var(--chart-5))",
        },
      ].filter((d) => d.value > 0)
    : [];

  const chartsLoading = statsLoading;

  return (
    <div data-ocid="dashboard.page" className="p-4 md:p-8">
      {/* Admin: Pending approval banner */}
      {isAdmin && pendingCount > 0 && (
        <div
          data-ocid="dashboard.approval.error_state"
          className="mb-6 flex items-center gap-3 p-4 rounded-lg border"
          style={{
            background: "oklch(0.85 0.15 85 / 0.12)",
            borderColor: "oklch(0.75 0.18 85 / 0.4)",
          }}
        >
          <span className="text-xl">⚠</span>
          <div className="flex-1">
            <p
              className="text-sm font-semibold"
              style={{ color: "oklch(0.75 0.18 85)" }}
            >
              {pendingCount} user{pendingCount !== 1 ? "s" : ""} awaiting
              approval
            </p>
          </div>
          <Link
            to="/users"
            className="text-xs font-medium underline shrink-0"
            style={{ color: "oklch(0.75 0.18 85)" }}
          >
            Review →
          </Link>
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-display text-3xl font-700 text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of all your construction projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          ["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <Card data-ocid="dashboard.stats.card" className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-700">
                  {stats ? Number(stats.activeCount) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  projects in progress
                </p>
              </CardContent>
            </Card>
            <Card data-ocid="dashboard.stats.card" className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-chart-4" /> Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-700">
                  {stats ? Number(stats.planningCount) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  projects planned
                </p>
              </CardContent>
            </Card>
            <Card data-ocid="dashboard.stats.card" className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2" /> Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-700">
                  {stats ? Number(stats.completedCount) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  projects done
                </p>
              </CardContent>
            </Card>
            <Card data-ocid="dashboard.stats.card" className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-muted-foreground" /> On
                  Hold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-700">
                  {stats ? Number(stats.onHoldCount) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  projects paused
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Budget summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-700">
                {formatCurrency(stats.totalBudget)}
              </div>
              <Progress
                value={
                  stats.totalBudget > 0
                    ? (stats.totalSpent / stats.totalBudget) * 100
                    : 0
                }
                className="mt-3 h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(stats.totalSpent)} spent &bull;{" "}
                {formatCurrency(stats.totalBudget - stats.totalSpent)} remaining
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-2" /> Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-700">
                {formatCurrency(stats.totalSpent)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalBudget > 0
                  ? ((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)
                  : "0"}
                % of total budget utilized
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Budget vs Spent Bar Chart */}
        <Card data-ocid="dashboard.budget_chart.card" className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Budget vs Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton
                data-ocid="dashboard.budget_chart.loading_state"
                className="h-48 w-full rounded"
              />
            ) : budgetChartData.length === 0 ? (
              <div
                data-ocid="dashboard.budget_chart.empty_state"
                className="h-48 flex items-center justify-center text-muted-foreground text-sm"
              >
                No project data available
              </div>
            ) : (
              <ChartContainer
                config={budgetChartConfig}
                className="h-48 w-full"
              >
                <BarChart
                  data-ocid="dashboard.budget_chart.chart_point"
                  data={budgetChartData}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `Tsh ${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                          ? `Tsh ${(v / 1000).toFixed(0)}K`
                          : `Tsh ${v}`
                    }
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          formatCurrency(Number(value)),
                          name,
                        ]}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="budget"
                    fill="var(--color-budget)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="spent"
                    fill="var(--color-spent)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Project Status Donut Chart */}
        <Card data-ocid="dashboard.status_chart.card" className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton
                data-ocid="dashboard.status_chart.loading_state"
                className="h-48 w-full rounded"
              />
            ) : statusChartData.length === 0 ? (
              <div
                data-ocid="dashboard.status_chart.empty_state"
                className="h-48 flex items-center justify-center text-muted-foreground text-sm"
              >
                No projects yet
              </div>
            ) : (
              <ChartContainer
                config={statusChartConfig}
                className="h-48 w-full"
              >
                <PieChart data-ocid="dashboard.status_chart.chart_point">
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="72%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          `${value} project${Number(value) !== 1 ? "s" : ""}`,
                          name,
                        ]}
                      />
                    }
                  />
                  <ChartLegend
                    content={<StatusLegend data={statusChartData} />}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline Status Summary */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-600 mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" /> Project Timeline Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card
            data-ocid="dashboard.timeline.green.card"
            className="shadow-card border-l-4 border-l-green-500"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-3xl font-display font-700 text-green-600">
                {timelineCounts.green}
              </div>
              <div>
                <p className="font-medium text-sm text-green-700">🟢 Safe</p>
                <p className="text-xs text-muted-foreground">
                  projects on schedule
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            data-ocid="dashboard.timeline.yellow.card"
            className="shadow-card border-l-4 border-l-yellow-500"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-3xl font-display font-700 text-yellow-600">
                {timelineCounts.yellow}
              </div>
              <div>
                <p className="font-medium text-sm text-yellow-700">
                  🟡 At Risk
                </p>
                <p className="text-xs text-muted-foreground">
                  projects at risk of delay
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            data-ocid="dashboard.timeline.red.card"
            className="shadow-card border-l-4 border-l-red-500"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="text-3xl font-display font-700 text-red-600">
                {timelineCounts.red}
              </div>
              <div>
                <p className="font-medium text-sm text-red-700">🔴 Critical</p>
                <p className="text-xs text-muted-foreground">
                  projects overdue
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin: Active Users Panel */}
      {isAdmin && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-600 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Active Users
            {(activeUsers ?? []).length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({(activeUsers ?? []).length} online)
              </span>
            )}
          </h2>
          <Card data-ocid="dashboard.active_users.card">
            <CardContent className="pt-4">
              {(activeUsers ?? []).length === 0 ? (
                <p
                  data-ocid="dashboard.active_users.empty_state"
                  className="text-sm text-muted-foreground py-4 text-center"
                >
                  No users currently active
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(activeUsers ?? []).map((principal, idx) => {
                    const pStr = principal.toString();
                    const truncated =
                      pStr.length > 14
                        ? `${pStr.slice(0, 8)}...${pStr.slice(-4)}`
                        : pStr;
                    return (
                      <div
                        key={pStr}
                        data-ocid={`dashboard.active_users.item.${idx + 1}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
                        style={{ borderColor: "oklch(var(--border))" }}
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <span className="font-mono">{truncated}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects by Stage Summary */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-600 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Projects by Stage
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(
            [
              ProjectStage.planning,
              ProjectStage.foundation,
              ProjectStage.structure,
              ProjectStage.finishing,
              ProjectStage.completed,
            ] as ProjectStage[]
          ).map((stage) => (
            <Card
              key={stage}
              data-ocid={`dashboard.stage.${stage}.card`}
              className={`shadow-card border-l-4 ${STAGE_ACCENT_COLORS[stage]}`}
            >
              <CardContent className="p-4">
                <div className="text-2xl font-display font-700 mb-1">
                  {stageCounts[stage]}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STAGE_COLORS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Project Cards — sorted by timeline priority (Red → Yellow → Green → none) */}
      <div>
        <h2 className="font-display text-lg font-600 mb-4">
          Active &amp; Planning Projects
        </h2>
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {["p1", "p2", "p3"].map((k) => (
              <Skeleton key={k} className="h-44" />
            ))}
          </div>
        ) : dashboardProjects.length === 0 ? (
          <Card data-ocid="projects.empty_state" className="p-8 text-center">
            <p className="text-muted-foreground">
              No projects yet.{" "}
              <Link to="/projects" className="text-primary underline">
                Create your first project.
              </Link>
            </p>
          </Card>
        ) : (
          <>
            {(() => {
              type GroupDef = {
                label: string;
                color: string;
                wrapClass?: string;
                projects: typeof dashboardProjects;
              };
              const groups: GroupDef[] = [
                {
                  label: "⚠️ Critical Projects",
                  color: "text-red-600",
                  wrapClass:
                    "bg-red-50/50 rounded-xl p-4 border border-red-200",
                  projects: dashboardProjects.filter(
                    (p) =>
                      getTimelineStatus(
                        p as Parameters<typeof getTimelineStatus>[0],
                      ) === "red",
                  ),
                },
                {
                  label: "⚠ At Risk Projects",
                  color: "text-yellow-600",
                  wrapClass: "",
                  projects: dashboardProjects.filter(
                    (p) =>
                      getTimelineStatus(
                        p as Parameters<typeof getTimelineStatus>[0],
                      ) === "yellow",
                  ),
                },
                {
                  label: "✅ Safe Projects",
                  color: "text-green-600",
                  wrapClass: "",
                  projects: dashboardProjects.filter((p) => {
                    const s = getTimelineStatus(
                      p as Parameters<typeof getTimelineStatus>[0],
                    );
                    return s === "green" || s === "none";
                  }),
                },
              ];
              return groups
                .filter((g) => g.projects.length > 0)
                .map((group) => (
                  <div
                    key={group.label}
                    className={`mb-6 ${group.wrapClass ?? ""}`}
                  >
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wide mb-3 ${group.color} ${group.wrapClass ? "text-base" : ""}`}
                    >
                      {group.label} ({group.projects.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {group.projects.map((project, i) => {
                        const summary = costSummaries?.find(
                          (s) => s.projectId === project.id,
                        );
                        return (
                          <ProjectCard
                            key={project.id.toString()}
                            project={project}
                            index={i + 1}
                            spent={summary?.totalSpent ?? 0}
                            budgetPct={summary?.budgetPct ?? 0}
                          />
                        );
                      })}
                    </div>
                  </div>
                ));
            })()}
          </>
        )}
      </div>
    </div>
  );
}

function StatusLegend({
  data,
}: {
  data: Array<{ name: string; value: number; fill: string }>;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-3">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-xs">
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="text-muted-foreground">
            {entry.name} ({entry.value})
          </span>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  index,
  spent = 0,
  budgetPct = 0,
}: {
  project: {
    id: bigint;
    name: string;
    clientName?: string;
    location: string;
    status: ProjectStatus;
    stage: ProjectStage;
    budget: number;
    startDate: bigint;
    endDate: bigint;
    estimatedDurationDays: number;
    currentProgressPercentage: number;
  };
  index: number;
  spent?: number;
  budgetPct?: number;
}) {
  const statusColors: Record<string, string> = {
    active: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    planning: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    completed: "bg-muted text-muted-foreground",
    onHold: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const tlStatus = getTimelineStatus(
    project as Parameters<typeof getTimelineStatus>[0],
  );

  return (
    <Link to="/projects/$id" params={{ id: project.id.toString() }}>
      <Card
        data-ocid={`projects.item.${index}`}
        className="shadow-card hover:shadow-md transition-shadow cursor-pointer"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-display font-600 leading-tight">
              {project.name}
            </CardTitle>
            {project.clientName && (
              <p className="text-xs text-muted-foreground font-medium">
                {project.clientName}
              </p>
            )}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  statusColors[project.status] ??
                  "bg-muted text-muted-foreground"
                }`}
              >
                {project.status === "onHold"
                  ? "On Hold"
                  : project.status.charAt(0).toUpperCase() +
                    project.status.slice(1)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STAGE_COLORS[project.stage]}`}
              >
                {STAGE_LABELS[project.stage]}
              </span>
              {tlStatus !== "none" && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TIMELINE_STATUS_CLASSES[tlStatus]}`}
                >
                  {TIMELINE_STATUS_LABELS[tlStatus]}
                </span>
              )}
              {tlStatus !== "none" && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${TIMELINE_STATUS_CLASSES[tlStatus]}`}
                >
                  {PRIORITY_LABELS[tlStatus]}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{project.location}</p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{formatCurrency(spent)} spent</span>
            <span>{formatCurrency(project.budget)} budget</span>
          </div>
          <Progress
            value={Math.min(budgetPct, 100)}
            className={`h-1.5 ${budgetPct >= 100 ? "[&>div]:bg-destructive" : budgetPct >= 80 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-3">
            <span>{formatDate(project.startDate)}</span>
            <span>{formatDate(project.endDate)}</span>
          </div>
          {project.estimatedDurationDays > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {project.currentProgressPercentage}% progress •{" "}
              {project.estimatedDurationDays}d timeline
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
