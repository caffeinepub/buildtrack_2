import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Calendar, Loader2, MapPin, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Project, ProjectStage, ProjectStatus } from "../backend";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { useAuth } from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import {
  dateToNs,
  formatCurrency,
  formatDate,
  nowNs,
  nsToDateInput,
} from "../lib/appUtils";
import type { TypedProject } from "../lib/projectTypes";
import {
  TIMELINE_STATUS_CLASSES,
  TIMELINE_STATUS_LABELS,
  getTimelineStatus,
} from "../lib/timelineUtils";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.active]: "Active",
  [ProjectStatus.planning]: "Planning",
  [ProjectStatus.completed]: "Completed",
  [ProjectStatus.onHold]: "On Hold",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.active]: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  [ProjectStatus.planning]: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  [ProjectStatus.completed]: "bg-muted text-muted-foreground border-border",
  [ProjectStatus.onHold]:
    "bg-destructive/10 text-destructive border-destructive/20",
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

// ── Edit Project Dialog ──────────────────────────────────────────────────────

function EditProjectDialog({ project }: { project: Project }) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    clientName: project.clientName ?? "",
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Project name is required";
    if (!form.clientName.trim()) errs.clientName = "Client name is required";
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.budget.trim()) {
      errs.budget = "Contract value is required";
    } else if (Number.isNaN(Number(form.budget)) || Number(form.budget) < 0) {
      errs.budget = "Contract value must be a valid positive number";
    }
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.estimatedDurationDays.trim()) {
      errs.estimatedDurationDays = "Estimated duration is required";
    } else if (
      Number(form.estimatedDurationDays) <= 0 ||
      !Number.isInteger(Number(form.estimatedDurationDays))
    ) {
      errs.estimatedDurationDays = "Duration must be a positive whole number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () =>
      actor!.updateProject(project.id, {
        ...project,
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        description: form.description,
        location: form.location.trim(),
        status: form.status,
        stage: form.stage,
        budget: Number.parseFloat(form.budget),
        startDate: dateToNs(form.startDate),
        endDate: form.endDate ? dateToNs(form.endDate) : project.endDate,
        estimatedDurationDays: Number.parseFloat(
          form.estimatedDurationDays || "0",
        ),
        currentProgressPercentage: Number.parseFloat(
          form.currentProgressPercentage || "0",
        ),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", project.id.toString()] });
      setOpen(false);
      toast.success("Project updated successfully");
    },
    onError: () => {
      toast.error("Failed to update project. Your data has been preserved.");
    },
  });

  function handleSave() {
    if (validate()) mutation.mutate();
  }

  function handleOpenChange(val: boolean) {
    // Block close while mutation is in progress
    if (mutation.isPending) return;
    setOpen(val);
    if (!val) setErrors({});
  }

  const editStatuses = [
    ProjectStatus.active,
    ProjectStatus.planning,
    ProjectStatus.completed,
    ProjectStatus.onHold,
  ];
  const STATUS_LABELS_EDIT: Record<ProjectStatus, string> = {
    [ProjectStatus.active]: "Active",
    [ProjectStatus.planning]: "Planning",
    [ProjectStatus.completed]: "Completed",
    [ProjectStatus.onHold]: "On Hold",
  };
  const EDIT_STAGES = [
    ProjectStage.planning,
    ProjectStage.foundation,
    ProjectStage.structure,
    ProjectStage.finishing,
    ProjectStage.completed,
  ];
  const EDIT_STAGE_LABELS: Record<ProjectStage, string> = {
    [ProjectStage.planning]: "Planning",
    [ProjectStage.foundation]: "Foundation",
    [ProjectStage.structure]: "Structure",
    [ProjectStage.finishing]: "Finishing",
    [ProjectStage.completed]: "Completed",
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs gap-1 bg-background/90 backdrop-blur-sm"
        data-ocid="projects.edit_button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setErrors({});
          setForm({
            name: project.name,
            clientName: project.clientName ?? "",
            description: project.description,
            location: project.location,
            status: project.status,
            stage: project.stage,
            budget: project.budget.toString(),
            startDate: nsToDateInput(project.startDate),
            endDate: nsToDateInput(project.endDate),
            estimatedDurationDays: project.estimatedDurationDays.toString(),
            currentProgressPercentage:
              project.currentProgressPercentage.toString(),
          });
          setOpen(true);
        }}
      >
        <Pencil className="w-3 h-3" /> Edit
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Project Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label>Client Name *</Label>
              <Input
                value={form.clientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientName: e.target.value }))
                }
                placeholder="e.g. MBCL Ltd"
                className={errors.clientName ? "border-destructive" : ""}
              />
              {errors.clientName && (
                <p className="text-xs text-destructive mt-1">
                  {errors.clientName}
                </p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location *</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className={errors.location ? "border-destructive" : ""}
                />
                {errors.location && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.location}
                  </p>
                )}
              </div>
              <div>
                <Label>Contract Value (Tsh) *</Label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budget: e.target.value }))
                  }
                  className={errors.budget ? "border-destructive" : ""}
                />
                {errors.budget && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.budget}
                  </p>
                )}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS_EDIT[s]}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {EDIT_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className={errors.startDate ? "border-destructive" : ""}
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <Label>End Date</Label>
                <Input
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
                <Label>Estimated Duration (days) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.estimatedDurationDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      estimatedDurationDays: e.target.value,
                    }))
                  }
                  placeholder="e.g. 180"
                  className={
                    errors.estimatedDurationDays ? "border-destructive" : ""
                  }
                />
                {errors.estimatedDurationDays && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.estimatedDurationDays}
                  </p>
                )}
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input
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
              data-ocid="projects.edit.cancel_button"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="projects.edit.save_button"
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Last Modified Helper ─────────────────────────────────────────────────────
function formatLastModified(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Projects() {
  const { actor } = useActor();
  const { canWrite, login } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: allProjectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => actor!.getProjects(),
    enabled: !!actor,
  });

  const allProjects = allProjectsData ?? [];

  const filtered = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div data-ocid="projects.page" className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl font-700">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {allProjects.length} total projects
          </p>
        </div>
        {canWrite ? (
          <Button
            data-ocid="projects.new_button"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        ) : (
          <Button
            data-ocid="projects.new_button"
            variant="outline"
            onClick={login}
          >
            <Plus className="w-4 h-4 mr-2" /> Sign In to Add
          </Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="projects.search_input"
          className="pl-9"
          placeholder="Search projects by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card data-ocid="projects.empty_state">
          <CardContent className="py-12 text-center text-muted-foreground">
            {allProjects.length === 0
              ? "No projects yet. Create your first project."
              : "No projects match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => {
            const tlStatus = getTimelineStatus(project);
            return (
              <div key={project.id.toString()} className="relative">
                <Link to="/projects/$id" params={{ id: project.id.toString() }}>
                  <Card
                    data-ocid={`projects.item.${i + 1}`}
                    className="shadow-card hover:shadow-md transition-shadow cursor-pointer h-full"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-display font-600 text-base leading-tight">
                          {project.name}
                        </h3>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_COLORS[project.status]}`}
                          >
                            {STATUS_LABELS[project.status]}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STAGE_COLORS[project.stage]}`}
                          >
                            {STAGE_LABELS[project.stage]}
                          </span>
                          {tlStatus !== "none" && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${TIMELINE_STATUS_CLASSES[tlStatus]}`}
                            >
                              {TIMELINE_STATUS_LABELS[tlStatus]}
                            </span>
                          )}
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3" /> {project.location || "—"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3 h-3" />{" "}
                        {formatDate(project.startDate)} –{" "}
                        {formatDate(project.endDate)}
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(project.budget)}{" "}
                        <span className="text-muted-foreground font-normal">
                          budget
                        </span>
                      </div>
                      {project.estimatedDurationDays > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.currentProgressPercentage}% progress •{" "}
                          {project.estimatedDurationDays}d timeline
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground/70 mt-2 border-t border-border/40 pt-2">
                        Modified:{" "}
                        {formatLastModified(
                          (project as TypedProject).updatedAt &&
                            (project as TypedProject).updatedAt > 0n
                            ? (project as TypedProject).updatedAt
                            : project.createdAt,
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <div className="absolute top-3 right-3 z-10">
                  <EditProjectDialog project={project} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
