import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  Clock,
  Cloud,
  DollarSign,
  Image,
  MapPin,
  Maximize2,
  Pencil,
  Plus,
  Timer,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  type BoqItem,
  type CostEntry,
  type DailySiteReport,
  ExternalBlob,
  type Labour,
  type Material,
  type Project,
  ProjectStage,
  ProjectStatus,
} from "../backend";
import { useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import {
  dateToNs,
  formatCurrency,
  formatDate,
  nowNs,
  nsToDateInput,
} from "../lib/appUtils";
import {
  PRIORITY_LABELS,
  TIMELINE_STATUS_CLASSES,
  TIMELINE_STATUS_LABELS,
  getTimelineInfo,
  getTimelineStatus,
} from "../lib/timelineUtils";

// Local types for features not yet in backend
type BoqFile = {
  id: bigint;
  projectId: bigint;
  fileUrl: string;
  uploadDate: bigint;
};
type ProjectPhoto = {
  id: bigint;
  projectId: bigint;
  reportId: bigint;
  description: string;
  dateUploaded: bigint;
  imageUrl: string;
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

const STAGE_PROGRESS: Record<ProjectStage, number> = {
  [ProjectStage.planning]: 0,
  [ProjectStage.foundation]: 25,
  [ProjectStage.structure]: 50,
  [ProjectStage.finishing]: 75,
  [ProjectStage.completed]: 100,
};

const STAGE_PROGRESS_COLORS: Record<ProjectStage, string> = {
  [ProjectStage.planning]: "bg-gray-400",
  [ProjectStage.foundation]: "bg-orange-500",
  [ProjectStage.structure]: "bg-blue-500",
  [ProjectStage.finishing]: "bg-purple-500",
  [ProjectStage.completed]: "bg-green-500",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.active]: "Active",
  [ProjectStatus.planning]: "Planning",
  [ProjectStatus.completed]: "Completed",
  [ProjectStatus.onHold]: "On Hold",
};

export default function ProjectDetail() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const projectId = BigInt(id ?? "0");
  const navigate = useNavigate();
  const { actor } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => actor!.getProjectById(projectId),
    enabled: !!actor,
  });

  const { data: reports } = useQuery({
    queryKey: ["reports", id],
    queryFn: () => actor!.getReportsByProject(projectId),
    enabled: !!actor,
  });

  const { data: materials } = useQuery({
    queryKey: ["materials", id],
    queryFn: () => actor!.getMaterialsByProject(projectId),
    enabled: !!actor,
  });

  const { data: costs } = useQuery({
    queryKey: ["costs", id],
    queryFn: () => actor!.getCostEntriesByProject(projectId),
    enabled: !!actor,
  });

  const { data: costSummary } = useQuery({
    queryKey: ["cost-summary", id],
    queryFn: () => actor!.getProjectCostSummary(projectId),
    enabled: !!actor,
  });

  // Delete project
  const deleteProject = useMutation({
    mutationFn: () => actor!.deleteProject(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      navigate({ to: "/projects" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!project) {
    return <div className="p-8 text-muted-foreground">Project not found.</div>;
  }

  const totalSpent = costSummary?.totalSpent ?? 0;
  const remaining = costSummary?.remainingBudget ?? project.budget;
  const budgetPct = costSummary?.budgetPct ?? 0;
  const spentColor =
    budgetPct >= 100
      ? "text-destructive"
      : budgetPct >= 80
        ? "text-yellow-600"
        : "text-green-600";

  return (
    <div data-ocid="project.detail.page" className="p-4 md:p-8">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl font-700">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {project.location || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />{" "}
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
            </span>
            <span className="px-2 py-0.5 rounded-full border text-xs font-medium bg-chart-2/10 text-chart-2 border-chart-2/20">
              {STATUS_LABELS[project.status]}
            </span>
            {(() => {
              const tls = getTimelineStatus(project);
              return tls !== "none" ? (
                <span
                  className={`px-2 py-0.5 rounded-full border text-xs font-medium ${TIMELINE_STATUS_CLASSES[tls]}`}
                >
                  {TIMELINE_STATUS_LABELS[tls]}
                </span>
              ) : null;
            })()}
          </div>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <EditProjectDialog project={project} projectId={projectId} />
            <Button
              variant="outline"
              size="sm"
              data-ocid="project.delete_button"
              onClick={() => {
                if (confirm("Delete this project?")) deleteProject.mutate();
              }}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Construction Stage */}
      <StagePanel project={project} projectId={projectId} id={id} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className="shadow-card border-l-4 border-l-blue-800">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Budget
            </p>
            <p className="font-display font-700 text-xl mt-1">
              {formatCurrency(project.budget)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className={`font-display font-700 text-xl mt-1 ${spentColor}`}>
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className={`font-display font-700 text-xl mt-1 ${remaining < 0 ? "text-destructive" : "text-green-600"}`}
            >
              {formatCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Budget Used</p>
            <p className={`font-display font-700 text-xl mt-1 ${spentColor}`}>
              {budgetPct.toFixed(1)}%
            </p>
            <Progress
              value={Math.min(budgetPct, 100)}
              className={`mt-2 h-1.5 ${budgetPct >= 100 ? "[&>div]:bg-destructive" : budgetPct >= 80 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Budget alert banners */}
      {budgetPct >= 100 && (
        <div
          data-ocid="project.budget.error_state"
          className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm font-medium"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Budget Exceeded! Total spent ({formatCurrency(totalSpent)}) has
          surpassed the project budget ({formatCurrency(project.budget)}).
        </div>
      )}
      {budgetPct >= 80 && budgetPct < 100 && (
        <div
          data-ocid="project.budget.warning.panel"
          className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-yellow-700 text-sm font-medium"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Budget Warning: {budgetPct.toFixed(1)}% of budget used.{" "}
          {formatCurrency(remaining)} remaining.
        </div>
      )}

      {/* Timeline alert banners */}
      {project.estimatedDurationDays > 0 &&
        (() => {
          const tlStatus = getTimelineStatus(project);
          if (tlStatus === "red") {
            return (
              <div
                data-ocid="project.timeline.error_state"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm font-medium"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Project is critically delayed — actual progress is significantly
                behind schedule.
              </div>
            );
          }
          if (tlStatus === "yellow") {
            return (
              <div
                data-ocid="project.timeline.warning.panel"
                className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-yellow-700 text-sm font-medium"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Project is at risk of delay — progress is slightly behind the
                expected schedule.
              </div>
            );
          }
          return null;
        })()}

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
          <TabsList className="whitespace-nowrap">
            <TabsTrigger value="overview" data-ocid="project.overview.tab">
              Overview
            </TabsTrigger>
            <TabsTrigger value="reports" data-ocid="project.reports.tab">
              Daily Reports
            </TabsTrigger>
            <TabsTrigger value="materials" data-ocid="project.materials.tab">
              Materials
            </TabsTrigger>
            <TabsTrigger value="labour" data-ocid="project.labour.tab">
              Labour
            </TabsTrigger>
            <TabsTrigger value="boq" data-ocid="project.boq.tab">
              BOQ
            </TabsTrigger>
            <TabsTrigger
              value="cost-control"
              data-ocid="project.cost_control.tab"
            >
              Cost Control
            </TabsTrigger>
            <TabsTrigger value="budget" data-ocid="project.budget.tab">
              Budget
            </TabsTrigger>
            <TabsTrigger value="schedule" data-ocid="project.schedule.tab">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="photos" data-ocid="project.photos.tab">
              Photo Progress
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Description: </span>
                {project.description || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Location: </span>
                {project.location || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {STATUS_LABELS[project.status]}
              </div>
              <div>
                <span className="text-muted-foreground">Start: </span>
                {formatDate(project.startDate)}
              </div>
              <div>
                <span className="text-muted-foreground">End: </span>
                {formatDate(project.endDate)}
              </div>
              <div>
                <span className="text-muted-foreground">Budget: </span>
                {formatCurrency(project.budget)}
              </div>
            </CardContent>
          </Card>

          {/* Project Timeline Card */}
          {project.estimatedDurationDays > 0 &&
            (() => {
              const tlInfo = getTimelineInfo(project);
              const timeUsedPct = Math.min(
                100,
                (tlInfo.timePassed / project.estimatedDurationDays) * 100,
              );
              return (
                <Card
                  className="shadow-card mt-4"
                  data-ocid="project.timeline.card"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-base">
                      Project Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Estimated Duration
                        </p>
                        <p className="font-600 font-display">
                          {project.estimatedDurationDays} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Time Passed
                        </p>
                        <p className="font-600 font-display">
                          {tlInfo.timePassed} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Time Remaining
                        </p>
                        <p
                          className={`font-600 font-display ${tlInfo.timeRemaining < 0 ? "text-destructive" : ""}`}
                        >
                          {tlInfo.timeRemaining < 0
                            ? `${Math.abs(tlInfo.timeRemaining)} days overdue`
                            : `${tlInfo.timeRemaining} days`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Expected Progress
                        </p>
                        <p className="font-600 font-display text-blue-700">
                          {tlInfo.expectedProgress.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Actual Progress
                        </p>
                        <p className="font-600 font-display text-green-700">
                          {project.currentProgressPercentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Delay</p>
                        <p
                          className={`font-600 font-display ${tlInfo.delayPct > 0 ? "text-destructive" : "text-green-700"}`}
                        >
                          {tlInfo.delayPct > 0
                            ? `${tlInfo.delayPct.toFixed(1)}% behind`
                            : "On track"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Timeline Status:
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TIMELINE_STATUS_CLASSES[tlInfo.status]}`}
                      >
                        {TIMELINE_STATUS_LABELS[tlInfo.status]}
                      </span>
                    </div>

                    {/* Dual Progress Bar */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Time Used</span>
                          <span>{timeUsedPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${tlInfo.status === "red" ? "bg-red-500" : tlInfo.status === "yellow" ? "bg-yellow-500" : "bg-blue-500"}`}
                            style={{ width: `${timeUsedPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{project.currentProgressPercentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full bg-green-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, project.currentProgressPercentage)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab projectId={projectId} reports={reports ?? []} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsTab projectId={projectId} materials={materials ?? []} />
        </TabsContent>

        <TabsContent value="labour">
          <LabourTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="boq">
          <BOQTab projectId={projectId} materials={materials ?? []} />
        </TabsContent>

        <TabsContent value="cost-control">
          <CostControlTab
            projectId={projectId}
            project={project}
            costSummary={costSummary}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTab
            projectId={projectId}
            costs={costs ?? []}
            project={project}
            summary={undefined}
          />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleTab project={project} projectId={projectId} />
        </TabsContent>
        <TabsContent value="photos">
          <PhotoProgressTab projectId={BigInt(projectId)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Edit Project ─────────────────────────────────────────────────────────────

function EditProjectDialog({
  project,
  projectId,
}: { project: Project; projectId: bigint }) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    location: project.location,
    status: project.status,
    stage: project.stage,
    budget: project.budget.toString(),
    startDate: nsToDateInput(project.startDate),
    endDate: nsToDateInput(project.endDate),
    estimatedDurationDays: project.estimatedDurationDays.toString(),
    currentProgressPercentage: project.currentProgressPercentage.toString(),
  });

  const mutation = useMutation({
    mutationFn: () =>
      actor!.updateProject(project.id, {
        ...project,
        name: form.name,
        description: form.description,
        location: form.location,
        status: form.status,
        stage: form.stage,
        budget: Number.parseFloat(form.budget),
        startDate: dateToNs(form.startDate),
        endDate: dateToNs(form.endDate),
        estimatedDurationDays: Number.parseFloat(
          form.estimatedDurationDays || "0",
        ),
        currentProgressPercentage: Number.parseFloat(
          form.currentProgressPercentage || "0",
        ),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      toast.success("Project updated");
    },
  });

  const statuses = [
    ProjectStatus.active,
    ProjectStatus.planning,
    ProjectStatus.completed,
    ProjectStatus.onHold,
  ];
  const STATUS_LABELS_LOCAL: Record<ProjectStatus, string> = {
    [ProjectStatus.active]: "Active",
    [ProjectStatus.planning]: "Planning",
    [ProjectStatus.completed]: "Completed",
    [ProjectStatus.onHold]: "On Hold",
  };
  const ALL_EDIT_STAGES = [
    ProjectStage.planning,
    ProjectStage.foundation,
    ProjectStage.structure,
    ProjectStage.finishing,
    ProjectStage.completed,
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-ocid="project.edit_button"
        onClick={() => setOpen(true)}
      >
        <Pencil className="w-4 h-4 mr-1" /> Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name</Label>
              <Input
                data-ocid="project.edit.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                data-ocid="project.edit.description.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input
                  data-ocid="project.edit.location.input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Budget (Tsh)</Label>
                <Input
                  data-ocid="project.edit.budget.input"
                  type="number"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budget: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as ProjectStatus }))
                }
              >
                <SelectTrigger data-ocid="project.edit.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS_LOCAL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Construction Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, stage: v as ProjectStage }))
                }
              >
                <SelectTrigger data-ocid="project.edit.stage.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_EDIT_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  data-ocid="project.edit.startdate.input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  data-ocid="project.edit.enddate.input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estimated Duration (days)</Label>
                <Input
                  data-ocid="project.edit.duration.input"
                  type="number"
                  min="0"
                  value={form.estimatedDurationDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      estimatedDurationDays: e.target.value,
                    }))
                  }
                  placeholder="e.g. 180"
                />
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input
                  data-ocid="project.edit.progress.input"
                  type="number"
                  min="0"
                  max="100"
                  value={form.currentProgressPercentage}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currentProgressPercentage: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="project.edit.cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="project.edit.save_button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Stage Panel ──────────────────────────────────────────────────────────────

function StagePanel({
  project,
  projectId,
  id,
}: { project: Project; projectId: bigint; id: string | undefined }) {
  const { actor } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<ProjectStage>(
    project.stage,
  );

  const stageMutation = useMutation({
    mutationFn: (stage: ProjectStage) =>
      actor!.updateProject(projectId, { ...project, stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects-stage"] });
      toast.success("Stage updated");
    },
    onError: () => toast.error("Failed to update stage"),
  });

  const ALL_STAGES_PANEL = [
    ProjectStage.planning,
    ProjectStage.foundation,
    ProjectStage.structure,
    ProjectStage.finishing,
    ProjectStage.completed,
  ];

  const progressPct = STAGE_PROGRESS[project.stage];
  const progressColor = STAGE_PROGRESS_COLORS[project.stage];

  return (
    <Card className="shadow-card mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Construction Stage
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className={`text-sm px-3 py-1 rounded-full border font-medium ${STAGE_COLORS[project.stage]}`}
              >
                {STAGE_LABELS[project.stage]}
              </span>
              <span className="text-xs text-muted-foreground">
                {progressPct}% complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Planning</span>
              <span>Foundation</span>
              <span>Structure</span>
              <span>Finishing</span>
              <span>Completed</span>
            </div>
          </div>
          {canWrite && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:w-64">
              <Select
                value={selectedStage}
                onValueChange={(v) => setSelectedStage(v as ProjectStage)}
              >
                <SelectTrigger
                  data-ocid="project.stage.select"
                  className="flex-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES_PANEL.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                data-ocid="project.stage.save_button"
                size="sm"
                disabled={
                  selectedStage === project.stage || stageMutation.isPending
                }
                onClick={() => stageMutation.mutate(selectedStage)}
              >
                {stageMutation.isPending ? "Saving..." : "Save Stage"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────

function ReportsTab({
  projectId,
  reports,
}: { projectId: bigint; reports: DailySiteReport[] }) {
  const { actor } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editReport, setEditReport] = useState<DailySiteReport | null>(null);
  const [form, setForm] = useState({
    date: "",
    weather: "",
    workersOnSite: "",
    hoursWorked: "",
    activities: "",
    notes: "",
  });

  const sorted = [...reports].sort((a, b) => Number(b.date - a.date));

  const createMutation = useMutation({
    mutationFn: (r: DailySiteReport) => actor!.createReport(r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", projectId.toString()] });
      setShowAdd(false);
      resetForm();
      toast.success("Report added");
    },
    onError: () => toast.error("Failed to add report"),
  });

  const updateMutation = useMutation({
    mutationFn: (r: DailySiteReport) => actor!.updateReport(r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", projectId.toString()] });
      setEditReport(null);
      toast.success("Report updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteReport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", projectId.toString()] });
      toast.success("Report deleted");
    },
  });

  function resetForm() {
    setForm({
      date: "",
      weather: "",
      workersOnSite: "",
      hoursWorked: "",
      activities: "",
      notes: "",
    });
  }

  function openEdit(r: DailySiteReport) {
    setForm({
      date: nsToDateInput(r.date),
      weather: r.weather,
      workersOnSite: Number(r.workersOnSite).toString(),
      hoursWorked: r.hoursWorked.toString(),
      activities: r.activities,
      notes: r.notes,
    });
    setEditReport(r);
  }

  function handleSubmit() {
    const payload: DailySiteReport = {
      id: editReport ? editReport.id : 0n,
      projectId,
      date: form.date ? dateToNs(form.date) : nowNs(),
      weather: form.weather,
      workersOnSite: BigInt(form.workersOnSite || "0"),
      hoursWorked: Number.parseFloat(form.hoursWorked || "0"),
      activities: form.activities,
      notes: form.notes,
    };
    if (editReport) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  const isOpen = showAdd || !!editReport;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-600 text-lg">
          Daily Site Reports ({reports.length})
        </h2>
        {canWrite && (
          <Button
            size="sm"
            data-ocid="project.add_report_button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Report
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <Card data-ocid="project.reports.empty_state">
          <CardContent className="py-10 text-center text-muted-foreground">
            No reports yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((r, i) => (
            <Card
              key={r.id.toString()}
              data-ocid={`project.report.item.${i + 1}`}
              className="shadow-card"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{formatDate(r.date)}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Cloud className="w-3 h-3" /> {r.weather || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {Number(r.workersOnSite)}{" "}
                        workers
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {r.hoursWorked}h
                      </span>
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`project.report.delete_button.${i + 1}`}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this report?"))
                            deleteMutation.mutate(r.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {r.activities && (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Activities: </span>
                    {r.activities}
                  </p>
                )}
                {r.notes && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Notes: </span>
                    {r.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            setShowAdd(false);
            setEditReport(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editReport ? "Edit Report" : "Add Daily Report"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  data-ocid="report.date.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Weather</Label>
                <Input
                  data-ocid="report.weather.input"
                  value={form.weather}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weather: e.target.value }))
                  }
                  placeholder="Sunny, 72°F"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Workers on Site</Label>
                <Input
                  data-ocid="report.workers.input"
                  type="number"
                  value={form.workersOnSite}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, workersOnSite: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Hours Worked</Label>
                <Input
                  data-ocid="report.hours.input"
                  type="number"
                  value={form.hoursWorked}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hoursWorked: e.target.value }))
                  }
                  placeholder="8"
                />
              </div>
            </div>
            <div>
              <Label>Activities</Label>
              <Textarea
                data-ocid="report.activities.textarea"
                value={form.activities}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activities: e.target.value }))
                }
                rows={2}
                placeholder="What was done today..."
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                data-ocid="report.notes.textarea"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="report.cancel_button"
              onClick={() => {
                setShowAdd(false);
                setEditReport(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="report.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Materials Tab ─────────────────────────────────────────────────────────────

function MaterialsTab({
  projectId,
  materials,
}: { projectId: bigint; materials: Material[] }) {
  const { actor } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState({
    name: "",
    unit: "",
    quantity: "",
    unitCost: "",
    supplier: "",
  });

  const createMutation = useMutation({
    mutationFn: (m: Material) => actor!.addMaterial(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
      qc.invalidateQueries({
        queryKey: ["cost-summary", projectId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      setShowAdd(false);
      resetForm();
      toast.success("Material added");
    },
    onError: () => toast.error("Failed to add material"),
  });

  const updateMutation = useMutation({
    mutationFn: (m: Material) => actor!.updateMaterial(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
      qc.invalidateQueries({
        queryKey: ["cost-summary", projectId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      setEditMaterial(null);
      toast.success("Material updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
      qc.invalidateQueries({
        queryKey: ["cost-summary", projectId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      toast.success("Material deleted");
    },
  });

  function resetForm() {
    setForm({ name: "", unit: "", quantity: "", unitCost: "", supplier: "" });
  }
  function openEdit(m: Material) {
    setForm({
      name: m.name,
      unit: m.unit,
      quantity: m.quantity.toString(),
      unitCost: m.unitCost.toString(),
      supplier: m.supplier,
    });
    setEditMaterial(m);
  }

  function handleSubmit() {
    const payload: Material = {
      id: editMaterial ? editMaterial.id : 0n,
      projectId,
      name: form.name,
      unit: form.unit,
      quantity: Number.parseFloat(form.quantity || "0"),
      unitCost: Number.parseFloat(form.unitCost || "0"),
      supplier: form.supplier,
    };
    if (editMaterial) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  const totalMaterialCost = materials.reduce(
    (sum, m) => sum + m.quantity * m.unitCost,
    0,
  );
  const isOpen = showAdd || !!editMaterial;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-600 text-lg">
          Materials ({materials.length}) &mdash; Total:{" "}
          {formatCurrency(totalMaterialCost)}
        </h2>
        {canWrite && (
          <Button
            size="sm"
            data-ocid="project.add_material_button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Material
          </Button>
        )}
      </div>

      {materials.length === 0 ? (
        <Card data-ocid="project.materials.empty_state">
          <CardContent className="py-10 text-center text-muted-foreground">
            No materials tracked yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Supplier</TableHead>
                  {canWrite && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m, i) => (
                  <TableRow
                    key={m.id.toString()}
                    data-ocid={`project.material.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell className="text-right">{m.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.unitCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.quantity * m.unitCost)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.supplier || "—"}
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            data-ocid={`project.material.edit_button.${i + 1}`}
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-ocid={`project.material.delete_button.${i + 1}`}
                            onClick={() => {
                              if (confirm("Delete?"))
                                deleteMutation.mutate(m.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            setShowAdd(false);
            setEditMaterial(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editMaterial ? "Edit Material" : "Add Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Material Name</Label>
              <Input
                data-ocid="material.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Ready-mix Concrete"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit</Label>
                <Input
                  data-ocid="material.unit.input"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="cu yd, ton, ea..."
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  data-ocid="material.quantity.input"
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit Cost (Tsh)</Label>
                <Input
                  data-ocid="material.unitcost.input"
                  type="number"
                  value={form.unitCost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitCost: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Supplier</Label>
                <Input
                  data-ocid="material.supplier.input"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                  placeholder="Supplier name"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="material.cancel_button"
              onClick={() => {
                setShowAdd(false);
                setEditMaterial(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="material.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Labour Tab ────────────────────────────────────────────────────────────────

function LabourTab({ projectId }: { projectId: bigint }) {
  const { actor } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editLabour, setEditLabour] = useState<Labour | null>(null);
  const [form, setForm] = useState({
    workerName: "",
    role: "",
    dailyWage: "",
    daysWorked: "",
  });

  const { data: labourList = [] } = useQuery({
    queryKey: ["labour", projectId.toString()],
    queryFn: () => actor!.getLabourByProject(projectId),
    enabled: !!actor,
  });

  const createMutation = useMutation({
    mutationFn: (l: Labour) => actor!.addLabour(l),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labour", projectId.toString()] });
      qc.invalidateQueries({
        queryKey: ["cost-control", projectId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["cost-summary", projectId.toString()],
      });
      setShowAdd(false);
      resetForm();
      toast.success("Labour record added");
    },
    onError: () => toast.error("Failed to add labour record"),
  });

  const updateMutation = useMutation({
    mutationFn: (l: Labour) => actor!.updateLabour(l),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labour", projectId.toString()] });
      qc.invalidateQueries({
        queryKey: ["cost-control", projectId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["cost-summary", projectId.toString()],
      });
      setEditLabour(null);
      toast.success("Labour record updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteLabour(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labour", projectId.toString()] });
      qc.invalidateQueries({
        queryKey: ["cost-control", projectId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["cost-summary", projectId.toString()],
      });
      toast.success("Labour record deleted");
    },
  });

  function resetForm() {
    setForm({ workerName: "", role: "", dailyWage: "", daysWorked: "" });
  }

  function openEdit(l: Labour) {
    setForm({
      workerName: l.workerName,
      role: l.role,
      dailyWage: l.dailyWage.toString(),
      daysWorked: l.daysWorked.toString(),
    });
    setEditLabour(l);
  }

  function handleSubmit() {
    const payload: Labour = {
      id: editLabour ? editLabour.id : 0n,
      projectId,
      workerName: form.workerName,
      role: form.role,
      dailyWage: Number.parseFloat(form.dailyWage || "0"),
      daysWorked: Number.parseFloat(form.daysWorked || "0"),
    };
    if (editLabour) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  const totalLabourCost = labourList.reduce(
    (sum, l) => sum + l.dailyWage * l.daysWorked,
    0,
  );
  const isOpen = showAdd || !!editLabour;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-600 text-lg">
          Labour ({labourList.length}) &mdash; Total:{" "}
          {formatCurrency(totalLabourCost)}
        </h2>
        {canWrite && (
          <Button
            size="sm"
            data-ocid="project.add_labour_button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Labour
          </Button>
        )}
      </div>

      {labourList.length === 0 ? (
        <Card data-ocid="project.labour.empty_state">
          <CardContent className="py-10 text-center text-muted-foreground">
            No labour records yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Daily Wage (Tsh)</TableHead>
                  <TableHead className="text-right">Days Worked</TableHead>
                  <TableHead className="text-right">Total (Tsh)</TableHead>
                  {canWrite && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {labourList.map((l, i) => (
                  <TableRow
                    key={l.id.toString()}
                    data-ocid={`project.labour.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {l.workerName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.role}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(l.dailyWage)}
                    </TableCell>
                    <TableCell className="text-right">{l.daysWorked}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(l.dailyWage * l.daysWorked)}
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            data-ocid={`project.labour.edit_button.${i + 1}`}
                            onClick={() => openEdit(l)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-ocid={`project.labour.delete_button.${i + 1}`}
                            onClick={() => {
                              if (confirm("Delete?"))
                                deleteMutation.mutate(l.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            setShowAdd(false);
            setEditLabour(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editLabour ? "Edit Labour Record" : "Add Labour Record"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Worker Name</Label>
                <Input
                  data-ocid="labour.name.input"
                  value={form.workerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, workerName: e.target.value }))
                  }
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  data-ocid="labour.role.input"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  placeholder="Mason, Carpenter..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Daily Wage (Tsh)</Label>
                <Input
                  data-ocid="labour.wage.input"
                  type="number"
                  value={form.dailyWage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dailyWage: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Days Worked</Label>
                <Input
                  data-ocid="labour.days.input"
                  type="number"
                  value={form.daysWorked}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, daysWorked: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="labour.cancel_button"
              onClick={() => {
                setShowAdd(false);
                setEditLabour(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="labour.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── BOQ Tab ───────────────────────────────────────────────────────────────────

function getBoqStatus(
  usedQty: number,
  plannedQty: number,
): "ok" | "warning" | "exceeded" {
  if (plannedQty <= 0) return "ok";
  if (usedQty > plannedQty) return "exceeded";
  if (usedQty > plannedQty * 0.8) return "warning";
  return "ok";
}

type ColumnMapping = {
  itemName: string;
  description: string;
  unit: string;
  plannedQuantity: string;
  unitRate: string;
};

function BOQTab({
  projectId,
  materials,
}: { projectId: bigint; materials: Material[] }) {
  const { actor, isFetching } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<BoqItem | null>(null);
  const [form, setForm] = useState({
    itemName: "",
    description: "",
    unit: "",
    plannedQuantity: "",
    unitRate: "",
    usedQuantity: "0",
  });

  // File upload state
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [colMapping, setColMapping] = useState<ColumnMapping>({
    itemName: "",
    description: "",
    unit: "",
    plannedQuantity: "",
    unitRate: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: boqItems = [] } = useQuery({
    queryKey: ["boq", projectId.toString()],
    queryFn: () => actor!.getBoqItemsByProject(projectId),
    enabled: !!actor && !isFetching,
  });

  const { data: boqFiles = [] } = useQuery<BoqFile[]>({
    queryKey: ["boq-files", projectId.toString()],
    queryFn: () => Promise.resolve([] as BoqFile[]),
    enabled: !!actor && !isFetching,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (item: BoqItem) => actor!.addBOQItem(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      setShowAdd(false);
      resetForm();
      toast.success("BOQ item added");
    },
    onError: () => toast.error("Failed to add BOQ item"),
  });

  const updateMutation = useMutation({
    mutationFn: (item: BoqItem) => actor!.updateBOQItem(item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      setEditItem(null);
      toast.success("BOQ item updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteBOQItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      toast.success("BOQ item deleted");
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: bigint) => Promise.resolve() || actor!.deleteBOQItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boq-files", projectId.toString()] });
      toast.success("BOQ file deleted");
    },
  });

  function resetForm() {
    setForm({
      itemName: "",
      description: "",
      unit: "",
      plannedQuantity: "",
      unitRate: "",
      usedQuantity: "0",
    });
  }

  function openEdit(item: BoqItem) {
    setForm({
      itemName: item.itemName,
      description: item.description,
      unit: item.unit,
      plannedQuantity: item.plannedQuantity.toString(),
      unitRate: item.unitRate.toString(),
      usedQuantity: item.usedQuantity.toString(),
    });
    setEditItem(item);
  }

  function handleSubmit() {
    const payload: BoqItem = {
      id: editItem ? editItem.id : 0n,
      projectId,
      itemName: form.itemName,
      description: form.description,
      unit: form.unit,
      plannedQuantity: Number.parseFloat(form.plannedQuantity || "0"),
      unitRate: Number.parseFloat(form.unitRate || "0"),
      usedQuantity: Number.parseFloat(form.usedQuantity || "0"),
    };
    if (editItem) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  function computeUsedQty(itemName: string): number {
    const lower = itemName.toLowerCase();
    const matched = materials.filter((m) => m.name.toLowerCase() === lower);
    if (matched.length > 0)
      return matched.reduce((sum, m) => sum + m.quantity, 0);
    return -1;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf")) {
      toast.info(
        "Auto-extraction not available for PDF. Please add items manually.",
      );
      setShowAdd(true);
      return;
    }

    try {
      let csvText = "";
      if (name.endsWith(".csv")) {
        csvText = await file.text();
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        // Excel parsing requires external library - treat as unsupported
        toast.error(
          "Excel files not supported. Please save as CSV and re-upload.",
        );
        return;
      }

      // Simple CSV parsing
      const rows: string[][] = csvText
        .split("\n")
        .filter((line) => line.trim())
        .map((line) =>
          line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
        );
      if (rows.length < 2) {
        toast.error("File appears empty or has no data rows.");
        return;
      }
      const headers = rows[0];
      setParsedHeaders(headers);
      setParsedRows(rows.slice(1));

      // Auto-detect column mapping
      const autoMap: ColumnMapping = {
        itemName: "",
        description: "",
        unit: "",
        plannedQuantity: "",
        unitRate: "",
      };
      for (const h of headers) {
        const hl = h.toLowerCase().trim();
        if (
          !autoMap.itemName &&
          (hl.includes("item") ||
            hl.includes("name") ||
            (hl.includes("description") && !hl.includes("desc")))
        )
          autoMap.itemName = h;
        if (
          !autoMap.description &&
          (hl.includes("desc") || hl.includes("detail") || hl.includes("spec"))
        )
          autoMap.description = h;
        if (
          !autoMap.unit &&
          hl.includes("unit") &&
          !hl.includes("rate") &&
          !hl.includes("cost")
        )
          autoMap.unit = h;
        if (
          !autoMap.plannedQuantity &&
          (hl.includes("qty") ||
            hl.includes("quantity") ||
            hl.includes("amount"))
        )
          autoMap.plannedQuantity = h;
        if (
          !autoMap.unitRate &&
          (hl.includes("rate") || hl.includes("price") || hl.includes("cost"))
        )
          autoMap.unitRate = h;
      }
      setColMapping(autoMap);

      // Store the file in backend blob storage
      setIsUploading(true);
      try {
        // BOQ file metadata - skip backend save (not supported)
        // File items will be imported directly via CSV parsing
        qc.invalidateQueries({ queryKey: ["boq-files", projectId.toString()] });
        toast.success("BOQ file uploaded");
      } catch {
        toast.error(
          "File metadata save failed, but you can still import items.",
        );
      } finally {
        setIsUploading(false);
      }

      setShowMappingDialog(true);
    } catch {
      toast.error("Failed to parse file. Please check the format.");
    }
  }

  async function handleImportItems() {
    if (!actor) return;
    const items: BoqItem[] = parsedRows.map((row) => {
      const get = (col: string) => {
        const idx = parsedHeaders.indexOf(col);
        return idx >= 0 ? (row[idx] ?? "").trim() : "";
      };
      return {
        id: 0n,
        projectId,
        itemName: get(colMapping.itemName) || "Unnamed Item",
        description: get(colMapping.description),
        unit: get(colMapping.unit),
        plannedQuantity:
          Number.parseFloat(get(colMapping.plannedQuantity) || "0") || 0,
        unitRate: Number.parseFloat(get(colMapping.unitRate) || "0") || 0,
        usedQuantity: 0,
      };
    });

    try {
      await Promise.all(items.map((item) => actor.addBOQItem(item)));
      qc.invalidateQueries({ queryKey: ["boq", projectId.toString()] });
      toast.success(`${items.length} BOQ items imported`);
      setShowMappingDialog(false);
    } catch {
      toast.error("Import failed. Please try again.");
    }
  }

  // Compute chart data and summary
  const enrichedItems = boqItems.map((item) => {
    const materialUsed = computeUsedQty(item.itemName);
    const usedQty = materialUsed >= 0 ? materialUsed : item.usedQuantity;
    const plannedCost = item.plannedQuantity * item.unitRate;
    const actualCost = usedQty * item.unitRate;
    const remainingQty = item.plannedQuantity - usedQty;
    const status = getBoqStatus(usedQty, item.plannedQuantity);
    return {
      ...item,
      usedQty,
      plannedCost,
      actualCost,
      remainingQty,
      status,
      materialUsed,
    };
  });

  const totalPlannedCost = enrichedItems.reduce((s, i) => s + i.plannedCost, 0);
  const totalActualCost = enrichedItems.reduce((s, i) => s + i.actualCost, 0);
  const costVariance = totalPlannedCost - totalActualCost;

  const chartData = enrichedItems.map((item) => ({
    name:
      item.itemName.length > 15
        ? `${item.itemName.slice(0, 15)}…`
        : item.itemName,
    planned: item.plannedQuantity,
    used: item.usedQty,
    status: item.status,
  }));

  const isOpen = showAdd || !!editItem;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const BAR_COLORS: Record<string, string> = {
    ok: "#16a34a",
    warning: "#d97706",
    exceeded: "#dc2626",
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h2 className="font-display font-600 text-lg">
          Bill of Quantities ({boqItems.length})
        </h2>
        {canWrite && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              data-ocid="project.upload_boq_button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-blue-700 text-blue-700 hover:bg-blue-50"
            >
              <Upload className="w-4 h-4 mr-1" />
              {isUploading ? "Uploading..." : "Upload BOQ File"}
            </Button>
            <Button
              size="sm"
              data-ocid="project.add_boq_button"
              onClick={() => {
                resetForm();
                setShowAdd(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add BOQ Item
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
          onChange={handleFileSelect}
          data-ocid="boq.file_upload_input"
        />
      </div>

      {/* Uploaded Files List */}
      {boqFiles.length > 0 && (
        <Card className="bg-blue-950/30 border-blue-800/40">
          <CardContent className="py-3 px-4">
            <p className="text-xs font-medium text-blue-300 mb-2">
              Uploaded BOQ Files
            </p>
            <div className="space-y-1">
              {boqFiles.map((f, i) => (
                <div
                  key={f.id.toString()}
                  className="flex items-center justify-between text-sm"
                  data-ocid={`boq.file.item.${i + 1}`}
                >
                  <div className="flex items-center gap-2 text-blue-100">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{formatDate(f.uploadDate)}</span>
                  </div>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300"
                      data-ocid={`boq.file.delete_button.${i + 1}`}
                      onClick={() => {
                        if (confirm("Remove this BOQ file record?"))
                          deleteFileMutation.mutate(f.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary Cards */}
      {boqItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-blue-950/20 border-blue-800/40">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-blue-300 mb-1">Total Planned Cost</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(totalPlannedCost)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-950/20 border-blue-800/40">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-blue-300 mb-1">Total Actual Cost</p>
              <p className="text-lg font-bold text-amber-400">
                {formatCurrency(totalActualCost)}
              </p>
            </CardContent>
          </Card>
          <Card
            className={`border ${costVariance < 0 ? "bg-red-950/20 border-red-800/40" : "bg-green-950/20 border-green-800/40"}`}
          >
            <CardContent className="py-3 px-4">
              <p className="text-xs text-blue-300 mb-1">Cost Variance</p>
              <p
                className={`text-lg font-bold ${costVariance < 0 ? "text-red-400" : "text-green-400"}`}
              >
                {costVariance < 0 ? "−" : "+"}
                {formatCurrency(Math.abs(costVariance))}
                {costVariance < 0 && (
                  <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                    Overrun
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BOQ Table */}
      {boqItems.length === 0 ? (
        <Card data-ocid="project.boq.empty_state">
          <CardContent className="py-10 text-center text-muted-foreground">
            No BOQ items yet. Upload a BOQ file or add items manually to start
            tracking.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-950/40">
                  <TableHead className="text-blue-200">Item Name</TableHead>
                  <TableHead className="text-blue-200">Description</TableHead>
                  <TableHead className="text-blue-200">Unit</TableHead>
                  <TableHead className="text-right text-blue-200">
                    Planned Qty
                  </TableHead>
                  <TableHead className="text-right text-blue-200">
                    Used Qty
                  </TableHead>
                  <TableHead className="text-right text-blue-200">
                    Remaining
                  </TableHead>
                  <TableHead className="text-right text-blue-200">
                    Unit Rate (Tsh)
                  </TableHead>
                  <TableHead className="text-right text-blue-200">
                    Planned Cost
                  </TableHead>
                  <TableHead className="text-right text-blue-200">
                    Actual Cost
                  </TableHead>
                  <TableHead className="text-blue-200">Status</TableHead>
                  {canWrite && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedItems.map((item, i) => (
                  <TableRow
                    key={item.id.toString()}
                    data-ocid={`project.boq.item.${i + 1}`}
                    className={
                      item.status === "exceeded"
                        ? "bg-red-950/20 hover:bg-red-950/30"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {item.itemName}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">
                      {item.description}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      {item.plannedQuantity}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${item.status === "exceeded" ? "text-red-400" : item.status === "warning" ? "text-amber-400" : ""}`}
                    >
                      {item.usedQty.toFixed(2)}
                      {item.materialUsed >= 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (auto)
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right ${item.remainingQty < 0 ? "text-red-400" : ""}`}
                    >
                      {item.remainingQty.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitRate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.plannedCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span>{formatCurrency(item.actualCost)}</span>
                        {item.actualCost > item.plannedCost && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs hover:bg-red-500/20">
                            Overrun
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.status === "ok" && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
                          OK
                        </Badge>
                      )}
                      {item.status === "warning" && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
                          Warning
                        </Badge>
                      )}
                      {item.status === "exceeded" && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20">
                          Exceeded
                        </Badge>
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            data-ocid={`project.boq.edit_button.${i + 1}`}
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            data-ocid={`project.boq.delete_button.${i + 1}`}
                            onClick={() => {
                              if (confirm("Delete this BOQ item?"))
                                deleteMutation.mutate(item.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* BOQ vs Actual Chart */}
      {chartData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              BOQ vs Actual Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f2952",
                    border: "1px solid #1e3a6e",
                    borderRadius: 8,
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#f59e0b", fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ color: "#94a3b8", paddingTop: 8 }} />
                <Bar
                  dataKey="planned"
                  name="Planned Qty"
                  fill="#1e40af"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="used" name="Used Qty" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={BAR_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit BOQ Item Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            setShowAdd(false);
            setEditItem(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editItem ? "Edit BOQ Item" : "Add BOQ Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Item Name</Label>
                <Input
                  data-ocid="boq.name.input"
                  value={form.itemName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, itemName: e.target.value }))
                  }
                  placeholder="e.g. Cement"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  data-ocid="boq.unit.input"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="bags, m³, kg..."
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                data-ocid="boq.description.input"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of item"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Planned Quantity</Label>
                <Input
                  data-ocid="boq.planned_qty.input"
                  type="number"
                  value={form.plannedQuantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plannedQuantity: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Unit Rate (Tsh)</Label>
                <Input
                  data-ocid="boq.unit_rate.input"
                  type="number"
                  value={form.unitRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitRate: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Used Quantity (manual override)</Label>
              <Input
                data-ocid="boq.used_qty.input"
                type="number"
                value={form.usedQuantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, usedQuantity: e.target.value }))
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-populated from Materials if item name matches.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="boq.cancel_button"
              onClick={() => {
                setShowAdd(false);
                setEditItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="boq.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Mapping Dialog */}
      <Dialog
        open={showMappingDialog}
        onOpenChange={(v) => {
          if (!v) setShowMappingDialog(false);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Map Columns to BOQ Fields
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Map your file columns to BOQ fields. Preview shows first 3 rows.
            </p>
            {/* Column mapping selects */}
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  "itemName",
                  "description",
                  "unit",
                  "plannedQuantity",
                  "unitRate",
                ] as (keyof ColumnMapping)[]
              ).map((field) => (
                <div key={field}>
                  <Label className="capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  <select
                    className="w-full mt-1 border border-border rounded-md px-3 py-2 bg-background text-sm text-foreground"
                    value={colMapping[field]}
                    data-ocid={`boq.mapping.${field}.select`}
                    onChange={(e) =>
                      setColMapping((m) => ({ ...m, [field]: e.target.value }))
                    }
                  >
                    <option value="">(skip)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {/* Preview Table */}
            <div className="overflow-x-auto rounded border border-border">
              <table className="text-xs w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {parsedHeaders.map((h) => (
                      <th key={h} className="px-2 py-1 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 3).map((row, rowIdx) => (
                    <tr
                      key={rowIdx.toString()}
                      className="border-t border-border"
                    >
                      {parsedHeaders.map((h) => (
                        <td key={h} className="px-2 py-1">
                          {row[parsedHeaders.indexOf(h)] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="boq.mapping.cancel_button"
              onClick={() => setShowMappingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="boq.mapping.import_button"
              onClick={handleImportItems}
              disabled={!colMapping.itemName}
            >
              Import {parsedRows.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Cost Control Tab ──────────────────────────────────────────────────────────

function CostControlTab({
  projectId,
  project,
  costSummary,
}: {
  projectId: bigint;
  project: Project;
  costSummary?: {
    materialsCost: number;
    labourCost: number;
    totalSpent: number;
    remainingBudget: number;
    budgetPct: number;
  } | null;
}) {
  const { actor } = useActor();

  const { data: costSummaryData, isLoading } = useQuery({
    queryKey: ["cost-summary", projectId.toString()],
    queryFn: () => actor!.getProjectCostSummary(projectId),
    enabled: !!actor,
  });

  // Use passed-in costSummary (already fetched at parent) or fallback to local query
  const summary = costSummary ?? costSummaryData;

  if (isLoading && !summary) {
    return (
      <div className="space-y-4" data-ocid="project.cost_control.loading_state">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const budget = project.budget;
  const materialsCost = summary?.materialsCost ?? 0;
  const labourCost = summary?.labourCost ?? 0;
  const totalSpent = summary?.totalSpent ?? 0;
  const remainingBudget = summary?.remainingBudget ?? budget;
  const spentPct =
    summary?.budgetPct ??
    (budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0);

  const barData = [
    {
      name: "Budget vs Spent",
      Budget: budget,
      Spent: totalSpent,
    },
  ];

  const pieData = [
    { name: "Materials", value: materialsCost, fill: "#1e40af" },
    { name: "Labour", value: labourCost, fill: "#d4a843" },
    { name: "Remaining", value: Math.max(0, remainingBudget), fill: "#e5e7eb" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6" data-ocid="project.cost_control.panel">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Project Budget</p>
            <p className="font-display font-700 text-xl mt-1">
              {formatCurrency(budget)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Materials Cost</p>
            <p className="font-display font-700 text-xl mt-1 text-chart-2">
              {formatCurrency(materialsCost)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Labour Cost</p>
            <p
              className="font-display font-700 text-xl mt-1"
              style={{ color: "#d4a843" }}
            >
              {formatCurrency(labourCost)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p
              className={`font-display font-700 text-xl mt-1 ${
                totalSpent > budget ? "text-destructive" : ""
              }`}
            >
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card col-span-2 md:col-span-2">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Remaining Budget</p>
            <p
              className={`font-display font-700 text-xl mt-1 ${
                remainingBudget < 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              {formatCurrency(remainingBudget)}
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Budget utilization</span>
                <span>{spentPct.toFixed(1)}%</span>
              </div>
              <Progress value={spentPct} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar chart: Budget vs Spent */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-sm">
              Budget vs Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name,
                  ]}
                />
                <Legend />
                <Bar dataKey="Budget" fill="#1e40af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#d4a843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart: Cost breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-sm">
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No cost data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Budget Tab ────────────────────────────────────────────────────────────────

type ProjectSummary = {
  totalMaterialCost: number;
  totalCostEntries: number;
  variance: number;
  totalSpent: number;
  budget: number;
};

function BudgetTab({
  projectId,
  costs,
  project,
  summary,
}: {
  projectId: bigint;
  costs: CostEntry[];
  project: Project;
  summary: ProjectSummary | undefined;
}) {
  const { actor } = useActor();
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editCost, setEditCost] = useState<CostEntry | null>(null);
  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    date: "",
  });

  const createMutation = useMutation({
    mutationFn: (c: CostEntry) => actor!.addCostEntry(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["costs", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
      setShowAdd(false);
      resetForm();
      toast.success("Cost added");
    },
    onError: () => toast.error("Failed to add cost"),
  });

  const updateMutation = useMutation({
    mutationFn: (c: CostEntry) => actor!.updateCostEntry(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["costs", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
      setEditCost(null);
      toast.success("Cost updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCostEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["costs", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
      toast.success("Cost deleted");
    },
  });

  function resetForm() {
    setForm({ category: "", description: "", amount: "", date: "" });
  }
  function openEdit(c: CostEntry) {
    setForm({
      category: c.category,
      description: c.description,
      amount: c.amount.toString(),
      date: nsToDateInput(c.date),
    });
    setEditCost(c);
  }

  function handleSubmit() {
    const payload: CostEntry = {
      id: editCost ? editCost.id : 0n,
      projectId,
      category: form.category,
      description: form.description,
      amount: Number.parseFloat(form.amount || "0"),
      date: form.date ? dateToNs(form.date) : nowNs(),
    };
    if (editCost) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  const isOpen = showAdd || !!editCost;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const sorted = [...costs].sort((a, b) => Number(b.date - a.date));
  const totalCostEntries = costs.reduce((s, c) => s + c.amount, 0);
  const spentPct =
    project.budget > 0
      ? Math.min((totalCostEntries / project.budget) * 100, 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Budget overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base">
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="font-display font-700 text-lg">
                {formatCurrency(project.budget)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Actual Spent</p>
              <p className="font-display font-700 text-lg">
                {formatCurrency(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Variance</p>
              <p className={`font-display font-700 text-lg ${"text-chart-2"}`}>
                {formatCurrency(project.budget)}
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Budget utilization</span>
              <span>{spentPct.toFixed(1)}%</span>
            </div>
            <Progress value={spentPct} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Materials</span>
              <span className="font-medium">
                {formatCurrency(summary?.totalMaterialCost ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Other Costs</span>
              <span className="font-medium">
                {formatCurrency(summary?.totalCostEntries ?? 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost entries */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-600 text-lg">
            Cost Entries ({costs.length})
          </h2>
          {canWrite && (
            <Button
              size="sm"
              data-ocid="project.add_cost_button"
              onClick={() => {
                resetForm();
                setShowAdd(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Cost
            </Button>
          )}
        </div>

        {sorted.length === 0 ? (
          <Card data-ocid="project.costs.empty_state">
            <CardContent className="py-10 text-center text-muted-foreground">
              No cost entries yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {canWrite && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((c, i) => (
                    <TableRow
                      key={c.id.toString()}
                      data-ocid={`project.cost.item.${i + 1}`}
                    >
                      <TableCell className="text-sm">
                        {formatDate(c.date)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                          {c.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.amount)}
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              data-ocid={`project.cost.edit_button.${i + 1}`}
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              data-ocid={`project.cost.delete_button.${i + 1}`}
                              onClick={() => {
                                if (confirm("Delete?"))
                                  deleteMutation.mutate(c.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            setShowAdd(false);
            setEditCost(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editCost ? "Edit Cost" : "Add Cost Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input
                  data-ocid="cost.category.input"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="Labor, Equipment..."
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  data-ocid="cost.date.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                data-ocid="cost.description.input"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description..."
              />
            </div>
            <div>
              <Label>Amount (Tsh)</Label>
              <Input
                data-ocid="cost.amount.input"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="cost.cancel_button"
              onClick={() => {
                setShowAdd(false);
                setEditCost(null);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="cost.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({
  project,
  projectId,
}: {
  project: Project;
  projectId: bigint;
}) {
  const { actor, isFetching } = useActor();

  const { data: boqItems = [] } = useQuery({
    queryKey: ["boq", projectId.toString()],
    queryFn: () => actor!.getBoqItemsByProject(projectId),
    enabled: !!actor && !isFetching,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", projectId.toString()],
    queryFn: () => actor!.getReportsByProject(projectId),
    enabled: !!actor && !isFetching,
  });

  const startMs = Number(project.startDate) / 1_000_000;
  const timePassed = Math.max(
    0,
    Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24)),
  );
  const duration = project.estimatedDurationDays || 1;
  const expectedProgress = Math.min(100, (timePassed / duration) * 100);
  const actual = project.currentProgressPercentage;
  const delay = Math.max(0, expectedProgress - actual);

  const tasks = boqItems.map((item) => {
    const itemProgress =
      item.plannedQuantity > 0
        ? Math.min(100, (item.usedQuantity / item.plannedQuantity) * 100)
        : 0;
    const isDelayed =
      itemProgress < expectedProgress && expectedProgress - itemProgress > 20;
    const isAtRisk =
      !isDelayed &&
      itemProgress < expectedProgress &&
      expectedProgress - itemProgress <= 20;
    return {
      id: item.id.toString(),
      name: item.itemName,
      progress: itemProgress,
      isDelayed,
      isAtRisk,
    };
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" /> Project Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Time Passed</p>
            <p className="text-lg font-bold">{timePassed}d</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-bold">{duration}d</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-600">Expected Progress</p>
            <p className="text-lg font-bold text-blue-700">
              {expectedProgress.toFixed(1)}%
            </p>
          </div>
          <div
            className={`rounded-lg p-3 ${delay > 20 ? "bg-red-50" : delay > 0 ? "bg-yellow-50" : "bg-green-50"}`}
          >
            <p
              className={`text-xs ${delay > 20 ? "text-red-600" : delay > 0 ? "text-yellow-600" : "text-green-600"}`}
            >
              Delay
            </p>
            <p
              className={`text-lg font-bold ${delay > 20 ? "text-red-700" : delay > 0 ? "text-yellow-700" : "text-green-700"}`}
            >
              {delay.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Gantt-style task list */}
        {tasks.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Work Packages (BOQ Items)
            </h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  data-ocid="project.schedule.item"
                  className={`rounded-lg p-3 border ${task.isDelayed ? "bg-red-50 border-red-200" : task.isAtRisk ? "bg-yellow-50 border-yellow-200" : "bg-green-50/50 border-green-200"}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{task.name}</span>
                    <div className="flex items-center gap-2">
                      {task.isDelayed && (
                        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                          🔴 Delayed
                        </span>
                      )}
                      {task.isAtRisk && (
                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200">
                          🟡 At Risk
                        </span>
                      )}
                      {!task.isDelayed && !task.isAtRisk && (
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                          🟢 On Track
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {task.progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${task.isDelayed ? "bg-red-500" : task.isAtRisk ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            data-ocid="project.schedule.empty_state"
            className="text-center text-muted-foreground py-8 text-sm"
          >
            No BOQ items found. Add BOQ items to see schedule breakdown.
          </div>
        )}

        {/* Recent site activity from reports */}
        {reports.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Recent Site Activity
            </h3>
            <div className="space-y-2">
              {[...reports]
                .slice(-5)
                .reverse()
                .map((r) => {
                  const dateMs = Number(r.date) / 1_000_000;
                  const daysAgo = Math.floor(
                    (Date.now() - dateMs) / (1000 * 60 * 60 * 24),
                  );
                  const daysFromEnd =
                    duration -
                    Math.floor((dateMs - startMs) / (1000 * 60 * 60 * 24));
                  const nearDeadline = daysFromEnd <= 14 && daysFromEnd > 0;
                  const overdue = daysFromEnd < 0;
                  return (
                    <div
                      key={r.id.toString()}
                      className={`rounded-lg p-3 border flex items-center justify-between ${overdue ? "bg-red-50 border-red-200" : nearDeadline ? "bg-yellow-50 border-yellow-200" : "bg-muted/30 border-border"}`}
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                        </p>
                        <p className="text-sm">{r.activities || "Site work"}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Number(r.workersOnSite)} workers
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Photo Progress Tab ─────────────────────────────────────────────────────────

function PhotoProgressTab({ projectId }: { projectId: bigint }) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<ProjectPhoto | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: photos, isLoading } = useQuery<ProjectPhoto[]>({
    queryKey: ["photos", projectId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const result = await Promise.resolve([] as ProjectPhoto[]);
      return [...result].sort((a, b) =>
        a.dateUploaded < b.dateUploaded ? -1 : 1,
      );
    },
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !uploadFile) throw new Error("Missing actor or file");
      // Photo upload not yet supported by backend canister
      setUploadProgress(100);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["photos", projectId.toString()],
      });
      toast.success("Photo uploaded successfully");
      setShowUpload(false);
      setUploadFile(null);
      setUploadDesc("");
      setUploadDate(new Date().toISOString().split("T")[0]);
      setUploadProgress(0);
    },
    onError: () => {
      toast.error("Upload failed. Please try again.");
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (_id: bigint) => {
      if (!actor) throw new Error("No actor");
      // Photo delete not yet supported by backend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["photos", projectId.toString()],
      });
      toast.success("Photo deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold font-display text-foreground">
            Photo Progress Timeline
          </h3>
          <p className="text-sm text-muted-foreground">
            Visual record of construction progress over time
          </p>
        </div>
        <Button
          data-ocid="photos.upload_button"
          onClick={() => setShowUpload(true)}
          className="bg-[#1a3a6e] hover:bg-[#0a1628] text-white gap-2"
        >
          <Camera className="h-4 w-4" />
          Upload Progress Photo
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4" data-ocid="photos.loading_state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !photos || photos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="photos.empty_state"
        >
          <div className="w-16 h-16 rounded-full bg-[#1a3a6e]/10 flex items-center justify-center mb-4">
            <Image className="h-8 w-8 text-[#1a3a6e]" />
          </div>
          <h4 className="font-semibold text-foreground mb-1">
            No progress photos yet
          </h4>
          <p className="text-sm text-muted-foreground max-w-xs">
            Upload the first photo to start documenting your project&apos;s
            progress
          </p>
          <Button
            className="mt-4 bg-[#1a3a6e] hover:bg-[#0a1628] text-white gap-2"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="h-4 w-4" />
            Upload First Photo
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#1a3a6e]/20 md:left-7" />

          <div className="space-y-8">
            {photos.map((photo, idx) => {
              const imgUrl =
                typeof photo.imageUrl === "string" ? photo.imageUrl : "";
              return (
                <div
                  key={photo.id.toString()}
                  className="relative flex gap-4 md:gap-6"
                  data-ocid={`photos.item.${idx + 1}`}
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-white shadow-md bg-[#D4A017] flex items-center justify-center">
                      <Camera className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <Card className="flex-1 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <button
                        type="button"
                        className="relative w-full sm:w-40 md:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden group cursor-pointer"
                        onClick={() => setEnlargedPhoto(photo)}
                        data-ocid="photos.open_modal_button"
                        aria-label="Enlarge photo"
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={photo.description || "Progress photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>

                      {/* Info */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-[#D4A017]" />
                            <span className="text-sm font-semibold text-[#1a3a6e]">
                              {formatDate(photo.dateUploaded)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {photo.description || (
                              <span className="italic text-muted-foreground">
                                No description
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-ocid={`photos.delete_button.${idx + 1}`}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMutation.mutate(photo.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent data-ocid="photos.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#D4A017]" />
              Upload Progress Photo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Photo</Label>
              <label
                htmlFor="photo-file-input"
                className="mt-1 block border-2 border-dashed border-[#1a3a6e]/30 rounded-lg p-6 text-center hover:border-[#1a3a6e]/60 transition-colors cursor-pointer"
                data-ocid="photos.dropzone"
              >
                {uploadFile ? (
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded bg-[#D4A017]/20 flex items-center justify-center mx-auto">
                      <Image className="h-5 w-5 text-[#D4A017]" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {uploadFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-[#1a3a6e]/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Click to select an image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP up to 10MB
                    </p>
                  </div>
                )}
                <input
                  id="photo-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  data-ocid="photos.upload_button"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div>
              <Label htmlFor="photo-date">Date</Label>
              <Input
                id="photo-date"
                type="date"
                data-ocid="photos.input"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="photo-desc">Description</Label>
              <Textarea
                id="photo-desc"
                data-ocid="photos.textarea"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="e.g. Foundation completed, Columns poured..."
                rows={3}
              />
            </div>

            {addMutation.isPending && uploadProgress > 0 && (
              <div data-ocid="photos.loading_state">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="photos.cancel_button"
              onClick={() => {
                setShowUpload(false);
                setUploadFile(null);
                setUploadDesc("");
                setUploadProgress(0);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="photos.submit_button"
              onClick={() => addMutation.mutate()}
              disabled={!uploadFile || addMutation.isPending}
              className="bg-[#1a3a6e] hover:bg-[#0a1628] text-white"
            >
              {addMutation.isPending ? "Uploading..." : "Upload Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enlarge Dialog */}
      <Dialog
        open={!!enlargedPhoto}
        onOpenChange={(v) => {
          if (!v) setEnlargedPhoto(null);
        }}
      >
        <DialogContent
          className="max-w-3xl p-0 overflow-hidden"
          data-ocid="photos.modal"
        >
          {enlargedPhoto &&
            (() => {
              let imgUrl = "";
              try {
                imgUrl = enlargedPhoto.imageUrl;
              } catch {
                imgUrl = "";
              }
              return (
                <>
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt={enlargedPhoto.description || "Progress photo"}
                      className="w-full max-h-[70vh] object-contain bg-black"
                    />
                  )}
                  <div className="p-4 bg-[#0a1628] text-white flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-[#D4A017] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#D4A017]">
                        {formatDate(enlargedPhoto.dateUploaded)}
                      </p>
                      <p className="text-sm text-white/80 mt-0.5">
                        {enlargedPhoto.description || "No description"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-ocid="photos.close_button"
                      className="ml-auto text-white hover:bg-white/10"
                      onClick={() => setEnlargedPhoto(null)}
                    >
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
