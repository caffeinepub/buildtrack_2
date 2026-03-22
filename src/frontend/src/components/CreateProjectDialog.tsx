import { Button } from "@/components/ui/button";
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
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProjectStage, ProjectStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { dateToNs, nowNs } from "../lib/appUtils";

const LS_KEY = "mbcl_create_project_draft";

type ProjectForm = {
  project_name: string;
  client_name: string;
  description: string;
  location: string;
  status: ProjectStatus;
  stage: ProjectStage;
  contract_value: string;
  start_date: string;
  end_date: string;
  estimated_duration_days: string;
  current_progress: string;
};

const emptyForm = (): ProjectForm => ({
  project_name: "",
  client_name: "",
  description: "",
  location: "",
  status: ProjectStatus.planning,
  stage: ProjectStage.planning,
  contract_value: "",
  start_date: "",
  end_date: "",
  estimated_duration_days: "",
  current_progress: "0",
});

const ALL_STATUSES = [
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

const ALL_STAGES = [
  ProjectStage.planning,
  ProjectStage.foundation,
  ProjectStage.structure,
  ProjectStage.finishing,
  ProjectStage.completed,
];

const STAGE_LABELS: Record<ProjectStage, string> = {
  [ProjectStage.planning]: "Planning",
  [ProjectStage.foundation]: "Foundation",
  [ProjectStage.structure]: "Structure",
  [ProjectStage.finishing]: "Finishing",
  [ProjectStage.completed]: "Completed",
};

type FormErrors = Record<string, string>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.toString === "function") {
      const str = e.toString();
      if (str !== "[object Object]") return str;
    }
    return JSON.stringify(err);
  }
  return String(err);
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const { actor } = useActor();
  const qc = useQueryClient();

  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) setForm({ ...emptyForm(), ...JSON.parse(saved) });
      } catch {
        // ignore parse errors
      }
    }
  }, [open]);

  // Auto-save form to localStorage (debounced 500ms)
  useEffect(() => {
    if (!open) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(form));
    }, 500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, open]);

  // Only allow opening via this handler.
  // Closing is EXCLUSIVELY handled by handleCancel() and successful submit.
  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (val) onOpenChange(val);
      // Ignore val=false entirely — prevents ALL auto-close triggers from Dialog
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(async () => {
    const newErrors: FormErrors = {};
    if (!form.project_name.trim())
      newErrors.project_name = "Project name is required";
    if (!form.client_name.trim())
      newErrors.client_name = "Client name is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    const contractValueNum = Number.parseFloat(form.contract_value);
    if (
      !form.contract_value ||
      Number.isNaN(contractValueNum) ||
      contractValueNum <= 0
    )
      newErrors.contract_value = "Contract value must be a positive number";
    if (!form.start_date) newErrors.start_date = "Start date is required";
    const durationNum = Number.parseFloat(form.estimated_duration_days);
    if (
      !form.estimated_duration_days ||
      Number.isNaN(durationNum) ||
      durationNum <= 0
    )
      newErrors.estimated_duration_days = "Duration must be a positive number";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (!actor) {
      toast.error("Not connected to backend. Please refresh and try again.");
      return;
    }

    const projectData = {
      id: 0n,
      name: form.project_name.trim(),
      clientName: form.client_name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      status: form.status,
      stage: form.stage,
      budget: contractValueNum,
      startDate: form.start_date ? dateToNs(form.start_date) : nowNs(),
      endDate: form.end_date ? dateToNs(form.end_date) : nowNs(),
      estimatedDurationDays: durationNum,
      currentProgressPercentage: form.current_progress
        ? Number.parseFloat(form.current_progress)
        : 0,
      createdAt: nowNs(),
      updatedAt: nowNs(),
    };

    console.log("[CreateProject] Submitting project data:", {
      project_name: projectData.name,
      client_name: projectData.clientName,
      location: projectData.location,
      contract_value: projectData.budget,
      start_date: form.start_date,
      end_date: form.end_date,
    });

    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newId = await actor.createProject(projectData as any);
      console.log(
        "[CreateProject] Data inserted successfully, project id:",
        newId,
      );

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["projects"] }),
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
      toast.success("Project created successfully");
      localStorage.removeItem(LS_KEY);
      setForm(emptyForm());
      setErrors({});
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      const errMsg = extractErrorMessage(err);
      console.error("[CreateProject] Error:", errMsg, err);
      toast.error(`Failed to save project: ${errMsg}`);
      // Keep dialog open, preserve form data
    } finally {
      setIsSubmitting(false);
    }
  }, [actor, form, onOpenChange, onCreated, qc]);

  function handleCancel() {
    if (isSubmitting) return;
    onOpenChange(false);
    setForm(emptyForm());
    setErrors({});
    localStorage.removeItem(LS_KEY);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="project.dialog"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault(); // Always block Escape key — user must use Cancel button
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display">New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* project_name */}
          <div>
            <Label htmlFor="cpd-name">Project Name *</Label>
            <Input
              id="cpd-name"
              data-ocid="project.name.input"
              value={form.project_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, project_name: e.target.value }))
              }
              placeholder="e.g. Downtown Office Tower"
              disabled={isSubmitting}
            />
            {errors.project_name && (
              <p className="text-xs text-red-500 mt-1">{errors.project_name}</p>
            )}
          </div>
          {/* client_name */}
          <div>
            <Label htmlFor="cpd-client">Client Name *</Label>
            <Input
              id="cpd-client"
              data-ocid="project.client.input"
              value={form.client_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, client_name: e.target.value }))
              }
              placeholder="e.g. MBCL Ltd"
              disabled={isSubmitting}
            />
            {errors.client_name && (
              <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>
            )}
          </div>
          {/* description */}
          <div>
            <Label htmlFor="cpd-desc">Description</Label>
            <Textarea
              id="cpd-desc"
              data-ocid="project.description.textarea"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Brief project description..."
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* location */}
            <div>
              <Label htmlFor="cpd-loc">Location *</Label>
              <Input
                id="cpd-loc"
                data-ocid="project.location.input"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="City, Site"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location}</p>
              )}
            </div>
            {/* contract_value */}
            <div>
              <Label htmlFor="cpd-budget">Contract Value (Tsh) *</Label>
              <Input
                id="cpd-budget"
                data-ocid="project.budget.input"
                type="number"
                value={form.contract_value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contract_value: e.target.value }))
                }
                placeholder="500000"
                disabled={isSubmitting}
              />
              {errors.contract_value && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.contract_value}
                </p>
              )}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
            {/* start_date */}
            <div>
              <Label htmlFor="cpd-start">Start Date *</Label>
              <Input
                id="cpd-start"
                data-ocid="project.startdate.input"
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_date: e.target.value }))
                }
                disabled={isSubmitting}
              />
              {errors.start_date && (
                <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
              )}
            </div>
            {/* end_date */}
            <div>
              <Label htmlFor="cpd-end">End Date</Label>
              <Input
                id="cpd-end"
                data-ocid="project.enddate.input"
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, end_date: e.target.value }))
                }
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cpd-duration">Estimated Duration (days) *</Label>
              <Input
                id="cpd-duration"
                data-ocid="project.duration.input"
                type="number"
                min="1"
                value={form.estimated_duration_days}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    estimated_duration_days: e.target.value,
                  }))
                }
                placeholder="e.g. 180"
                disabled={isSubmitting}
              />
              {errors.estimated_duration_days && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.estimated_duration_days}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="cpd-progress">Progress (%)</Label>
              <Input
                id="cpd-progress"
                data-ocid="project.progress.input"
                type="number"
                min="0"
                max="100"
                value={form.current_progress}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    current_progress: e.target.value,
                  }))
                }
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            data-ocid="project.cancel_button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            data-ocid="project.submit_button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
