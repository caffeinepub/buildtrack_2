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
import { type Project, ProjectStage, ProjectStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { dateToNs, nowNs } from "../lib/appUtils";

const LS_KEY = "mbcl_create_project_draft";

type ProjectForm = {
  name: string;
  clientName: string;
  description: string;
  location: string;
  status: ProjectStatus;
  stage: ProjectStage;
  budget: string;
  startDate: string;
  endDate: string;
  estimatedDurationDays: string;
  currentProgressPercentage: string;
};

const emptyForm = (): ProjectForm => ({
  name: "",
  clientName: "",
  description: "",
  location: "",
  status: ProjectStatus.planning,
  stage: ProjectStage.planning,
  budget: "",
  startDate: "",
  endDate: "",
  estimatedDurationDays: "",
  currentProgressPercentage: "0",
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

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const { actor } = useActor();
  const qc = useQueryClient();

  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  // Track submission separately to block dialog close during async operation
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

  // Safe dialog close handler — never closes while submitting
  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (isSubmitting) return; // block close during async submit
      onOpenChange(val);
    },
    [isSubmitting, onOpenChange],
  );

  const handleSubmit = useCallback(async () => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "Project name is required";
    if (!form.clientName.trim())
      newErrors.clientName = "Client name is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    const budgetNum = Number.parseFloat(form.budget);
    if (!form.budget || Number.isNaN(budgetNum) || budgetNum <= 0)
      newErrors.budget = "Contract value must be a positive number";
    if (!form.startDate) newErrors.startDate = "Start date is required";
    const durationNum = Number.parseFloat(form.estimatedDurationDays);
    if (
      !form.estimatedDurationDays ||
      Number.isNaN(durationNum) ||
      durationNum <= 0
    )
      newErrors.estimatedDurationDays = "Duration must be a positive number";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (!actor) {
      toast.error("Not connected. Please wait and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await actor.createProject({
        id: 0n,
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        description: form.description,
        location: form.location.trim(),
        status: form.status,
        stage: form.stage,
        budget: budgetNum,
        startDate: form.startDate ? dateToNs(form.startDate) : nowNs(),
        endDate: form.endDate ? dateToNs(form.endDate) : nowNs(),
        estimatedDurationDays: durationNum,
        currentProgressPercentage: form.currentProgressPercentage
          ? Number.parseFloat(form.currentProgressPercentage)
          : 0,
        createdAt: nowNs(),
        updatedAt: nowNs(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // SUCCESS: invalidate queries, close dialog, reset form
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
      console.error("Failed to create project:", err);
      // ERROR: show message, keep dialog open, preserve form data
      toast.error("Failed to create project. Your data has been preserved.");
      // Do NOT close dialog or reset form
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
          if (isSubmitting) e.preventDefault();
          else handleCancel();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display">New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="cpd-name">Project Name *</Label>
            <Input
              id="cpd-name"
              data-ocid="project.name.input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Downtown Office Tower"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cpd-client">Client Name *</Label>
            <Input
              id="cpd-client"
              data-ocid="project.client.input"
              value={form.clientName}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientName: e.target.value }))
              }
              placeholder="e.g. MBCL Ltd"
              disabled={isSubmitting}
            />
            {errors.clientName && (
              <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>
            )}
          </div>
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
            <div>
              <Label htmlFor="cpd-loc">Location *</Label>
              <Input
                id="cpd-loc"
                data-ocid="project.location.input"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="City, State"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cpd-budget">Contract Value (Tsh) *</Label>
              <Input
                id="cpd-budget"
                data-ocid="project.budget.input"
                type="number"
                value={form.budget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, budget: e.target.value }))
                }
                placeholder="500000"
                disabled={isSubmitting}
              />
              {errors.budget && (
                <p className="text-xs text-red-500 mt-1">{errors.budget}</p>
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
            <div>
              <Label htmlFor="cpd-start">Start Date *</Label>
              <Input
                id="cpd-start"
                data-ocid="project.startdate.input"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cpd-end">End Date</Label>
              <Input
                id="cpd-end"
                data-ocid="project.enddate.input"
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
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
                min="0"
                value={form.estimatedDurationDays}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    estimatedDurationDays: e.target.value,
                  }))
                }
                placeholder="e.g. 180"
                disabled={isSubmitting}
              />
              {errors.estimatedDurationDays && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.estimatedDurationDays}
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
                value={form.currentProgressPercentage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    currentProgressPercentage: e.target.value,
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
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
