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
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  PauseCircle,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { ProjectStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { formatCurrency, formatDate } from "../lib/utils";

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

export default function Dashboard() {
  const { actor } = useActor();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => actor!.getDashboardStats(),
    enabled: !!actor,
  });

  const { data: activeProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects-active"],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.active),
    enabled: !!actor,
  });

  const { data: planningProjects } = useQuery({
    queryKey: ["projects-planning"],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.planning),
    enabled: !!actor,
  });

  const { data: completedProjects } = useQuery({
    queryKey: ["projects-completed"],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.completed),
    enabled: !!actor,
  });

  const { data: onHoldProjects } = useQuery({
    queryKey: ["projects-onHold"],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.onHold),
    enabled: !!actor,
  });

  const allProjects = [
    ...(activeProjects ?? []),
    ...(planningProjects ?? []),
    ...(completedProjects ?? []),
    ...(onHoldProjects ?? []),
  ];

  const dashboardProjects = [
    ...(activeProjects ?? []),
    ...(planningProjects ?? []),
  ];

  // Fetch summaries for all projects for the budget chart
  const summaryResults = useQueries({
    queries: allProjects.map((p) => ({
      queryKey: ["project-summary", p.id.toString()],
      queryFn: () => actor!.getProjectSummary(p.id),
      enabled: !!actor,
    })),
  });

  const summariesLoading = summaryResults.some((r) => r.isLoading);

  const budgetChartData = allProjects
    .map((p, i) => ({
      name: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
      budget: p.budget,
      spent: summaryResults[i]?.data?.totalSpent ?? 0,
    }))
    .filter((d) => d.budget > 0 || d.spent > 0);

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

  const chartsLoading = statsLoading || summariesLoading;

  return (
    <div data-ocid="dashboard.page" className="p-8">
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
                        ? `$${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                          ? `$${(v / 1000).toFixed(0)}K`
                          : `$${v}`
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

      {/* Project Cards */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardProjects.map((project, i) => (
              <ProjectCard
                key={project.id.toString()}
                project={project}
                index={i + 1}
              />
            ))}
          </div>
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
}: {
  project: {
    id: bigint;
    name: string;
    location: string;
    status: ProjectStatus;
    budget: number;
    startDate: bigint;
    endDate: bigint;
  };
  index: number;
}) {
  const { actor } = useActor();
  const { data: summary } = useQuery({
    queryKey: ["project-summary", project.id.toString()],
    queryFn: () => actor!.getProjectSummary(project.id),
    enabled: !!actor,
  });

  const spentPct =
    summary && project.budget > 0
      ? Math.min((summary.totalSpent / project.budget) * 100, 100)
      : 0;

  const statusColors: Record<string, string> = {
    active: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    planning: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    completed: "bg-muted text-muted-foreground",
    onHold: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Link to={`/projects/${project.id}`}>
      <Card
        data-ocid={`projects.item.${index}`}
        className="shadow-card hover:shadow-md transition-shadow cursor-pointer"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-display font-600 leading-tight">
              {project.name}
            </CardTitle>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[project.status] ?? "bg-muted text-muted-foreground"}`}
            >
              {project.status === "onHold"
                ? "On Hold"
                : project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{project.location}</p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{formatCurrency(summary?.totalSpent ?? 0)} spent</span>
            <span>{formatCurrency(project.budget)} budget</span>
          </div>
          <Progress value={spentPct} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground mt-3">
            <span>{formatDate(project.startDate)}</span>
            <span>{formatDate(project.endDate)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
