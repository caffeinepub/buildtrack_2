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
  ArrowLeft,
  Calendar,
  Clock,
  Cloud,
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type CostEntry,
  type DailySiteReport,
  type Material,
  type Project,
  ProjectStatus,
} from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  dateToNs,
  formatCurrency,
  formatDate,
  nowNs,
  nsToDateInput,
} from "../lib/appUtils";

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
  const { identity } = useInternetIdentity();
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => actor!.getProject(projectId),
    enabled: !!actor,
  });

  const { data: summary } = useQuery({
    queryKey: ["project-summary", id],
    queryFn: () => actor!.getProjectSummary(projectId),
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
    queryFn: () => actor!.getCostsByProject(projectId),
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
      <div className="p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!project) {
    return <div className="p-8 text-muted-foreground">Project not found.</div>;
  }

  const spentPct =
    summary && project.budget > 0
      ? Math.min((summary.totalSpent / project.budget) * 100, 100)
      : 0;

  return (
    <div data-ocid="project.detail.page" className="p-8">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-700">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
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
          </div>
        </div>
        {identity && (
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Budget
            </p>
            <p className="font-display font-700 text-xl mt-1">
              {formatCurrency(project.budget)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="font-display font-700 text-xl mt-1">
              {formatCurrency(summary?.totalSpent ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className={`font-display font-700 text-xl mt-1 ${(summary?.variance ?? 0) < 0 ? "text-destructive" : ""}`}
            >
              {formatCurrency(summary ? summary.variance : project.budget)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Budget Used</p>
            <p className="font-display font-700 text-xl mt-1">
              {spentPct.toFixed(1)}%
            </p>
            <Progress value={spentPct} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" data-ocid="project.overview.tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" data-ocid="project.reports.tab">
            Daily Reports
          </TabsTrigger>
          <TabsTrigger value="materials" data-ocid="project.materials.tab">
            Materials
          </TabsTrigger>
          <TabsTrigger value="budget" data-ocid="project.budget.tab">
            Budget
          </TabsTrigger>
        </TabsList>

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
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab projectId={projectId} reports={reports ?? []} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsTab projectId={projectId} materials={materials ?? []} />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTab
            projectId={projectId}
            costs={costs ?? []}
            project={project}
            summary={summary}
          />
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
    budget: project.budget.toString(),
    startDate: nsToDateInput(project.startDate),
    endDate: nsToDateInput(project.endDate),
  });

  const mutation = useMutation({
    mutationFn: () =>
      actor!.updateProject({
        ...project,
        name: form.name,
        description: form.description,
        location: form.location,
        status: form.status,
        budget: Number.parseFloat(form.budget),
        startDate: dateToNs(form.startDate),
        endDate: dateToNs(form.endDate),
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
  const STATUS_LABELS: Record<ProjectStatus, string> = {
    [ProjectStatus.active]: "Active",
    [ProjectStatus.planning]: "Planning",
    [ProjectStatus.completed]: "Completed",
    [ProjectStatus.onHold]: "On Hold",
  };

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
                      {STATUS_LABELS[s]}
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
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────

function ReportsTab({
  projectId,
  reports,
}: { projectId: bigint; reports: DailySiteReport[] }) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
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
        {identity && (
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
                  {identity && (
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
  const { identity } = useInternetIdentity();
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
    mutationFn: (m: Material) => actor!.createMaterial(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
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
      setEditMaterial(null);
      toast.success("Material updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials", projectId.toString()] });
      qc.invalidateQueries({ queryKey: ["project-summary"] });
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
        {identity && (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Supplier</TableHead>
                {identity && <TableHead />}
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
                  {identity && (
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
                            if (confirm("Delete?")) deleteMutation.mutate(m.id);
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
  const { identity } = useInternetIdentity();
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
    mutationFn: (c: CostEntry) => actor!.createCostEntry(c),
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
  const spentPct =
    summary && project.budget > 0
      ? Math.min((summary.totalSpent / project.budget) * 100, 100)
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
                {formatCurrency(summary?.totalSpent ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Variance</p>
              <p
                className={`font-display font-700 text-lg ${(summary?.variance ?? 0) < 0 ? "text-destructive" : "text-chart-2"}`}
              >
                {(summary?.variance ?? 0) >= 0 ? "+" : ""}
                {formatCurrency(summary?.variance ?? project.budget)}
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
          {identity && (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {identity && <TableHead />}
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
                    {identity && (
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
