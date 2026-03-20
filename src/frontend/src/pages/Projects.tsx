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
import { Calendar, MapPin, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Project, ProjectStage, ProjectStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { dateToNs, formatCurrency, formatDate, nowNs } from "../lib/appUtils";

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

type ProjectForm = {
  name: string;
  description: string;
  location: string;
  status: ProjectStatus;
  stage: ProjectStage;
  budget: string;
  startDate: string;
  endDate: string;
};

const emptyForm = (): ProjectForm => ({
  name: "",
  description: "",
  location: "",
  status: ProjectStatus.planning,
  stage: ProjectStage.planning,
  budget: "",
  startDate: "",
  endDate: "",
});

const ALL_STATUSES = [
  ProjectStatus.active,
  ProjectStatus.planning,
  ProjectStatus.completed,
  ProjectStatus.onHold,
];

const ALL_STAGES = [
  ProjectStage.planning,
  ProjectStage.foundation,
  ProjectStage.structure,
  ProjectStage.finishing,
  ProjectStage.completed,
];

export default function Projects() {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ProjectForm>(emptyForm());

  const activeQ = useQuery({
    queryKey: ["projects", ProjectStatus.active],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.active),
    enabled: !!actor,
  });
  const planningQ = useQuery({
    queryKey: ["projects", ProjectStatus.planning],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.planning),
    enabled: !!actor,
  });
  const completedQ = useQuery({
    queryKey: ["projects", ProjectStatus.completed],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.completed),
    enabled: !!actor,
  });
  const onHoldQ = useQuery({
    queryKey: ["projects", ProjectStatus.onHold],
    queryFn: () => actor!.getProjectsByStatus(ProjectStatus.onHold),
    enabled: !!actor,
  });

  const allProjects = [
    ...(activeQ.data ?? []),
    ...(planningQ.data ?? []),
    ...(completedQ.data ?? []),
    ...(onHoldQ.data ?? []),
  ];

  const filtered = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: (project: Project) => actor!.createProject(project),
    onSuccess: () => {
      for (const s of ALL_STATUSES) {
        qc.invalidateQueries({ queryKey: ["projects", s] });
      }
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowCreate(false);
      setForm(emptyForm());
      toast.success("Project created");
    },
    onError: () => toast.error("Failed to create project"),
  });

  function handleSubmit() {
    if (!form.name || !form.budget) return;
    createMutation.mutate({
      id: 0n,
      name: form.name,
      description: form.description,
      location: form.location,
      status: form.status,
      stage: form.stage,
      budget: Number.parseFloat(form.budget),
      startDate: form.startDate ? dateToNs(form.startDate) : nowNs(),
      endDate: form.endDate ? dateToNs(form.endDate) : nowNs(),
    });
  }

  return (
    <div data-ocid="projects.page" className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl font-700">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {allProjects.length} total projects
          </p>
        </div>
        {identity ? (
          <Button
            data-ocid="projects.new_button"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        ) : (
          <Button data-ocid="projects.new_button" onClick={login}>
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
          {filtered.map((project, i) => (
            <Link
              key={project.id.toString()}
              to="/projects/$id"
              params={{ id: project.id.toString() }}
            >
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent data-ocid="project.dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="proj-name">Project Name *</Label>
              <Input
                id="proj-name"
                data-ocid="project.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Downtown Office Tower"
              />
            </div>
            <div>
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                data-ocid="project.description.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Brief project description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="proj-loc">Location</Label>
                <Input
                  id="proj-loc"
                  data-ocid="project.location.input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label htmlFor="proj-budget">Budget (Tsh) *</Label>
                <Input
                  id="proj-budget"
                  data-ocid="project.budget.input"
                  type="number"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budget: e.target.value }))
                  }
                  placeholder="500000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as ProjectStatus }))
                  }
                >
                  <SelectTrigger data-ocid="project.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
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
                  <SelectTrigger data-ocid="project.stage.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="proj-start">Start Date</Label>
                <Input
                  id="proj-start"
                  data-ocid="project.startdate.input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="proj-end">End Date</Label>
                <Input
                  id="proj-end"
                  data-ocid="project.enddate.input"
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
              data-ocid="project.cancel_button"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="project.submit_button"
              onClick={handleSubmit}
              disabled={!form.name || !form.budget || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
