import type { Project } from "../backend";

export type TimelineStatus = "green" | "yellow" | "red" | "none";

export interface TimelineInfo {
  status: TimelineStatus;
  timePassed: number;
  timeRemaining: number;
  expectedProgress: number;
  delayPct: number;
}

export function getTimelineStatus(project: Project): TimelineStatus {
  const {
    estimatedDurationDays,
    currentProgressPercentage,
    startDate,
    status,
  } = project;

  if (estimatedDurationDays === 0) return "none";

  const startMs = Number(startDate) / 1_000_000;
  const timePassed = (Date.now() - startMs) / (1000 * 60 * 60 * 24);

  // Completed within timeline
  if (
    (status === "completed" || currentProgressPercentage >= 100) &&
    timePassed <= estimatedDurationDays
  ) {
    return "green";
  }

  // RED: time exceeded and not completed
  if (timePassed > estimatedDurationDays && currentProgressPercentage < 100) {
    return "red";
  }

  const expectedProgress = Math.min(
    100,
    (timePassed / estimatedDurationDays) * 100,
  );
  const diff = expectedProgress - currentProgressPercentage;

  // GREEN: actual >= expected
  if (currentProgressPercentage >= expectedProgress) return "green";

  // YELLOW: slightly behind (difference <= 20%)
  if (diff <= 20) return "yellow";

  // RED: far behind (difference > 20%)
  return "red";
}

export function getTimelineInfo(project: Project): TimelineInfo {
  const { estimatedDurationDays, currentProgressPercentage, startDate } =
    project;
  const startMs = Number(startDate) / 1_000_000;
  const timePassed = Math.max(
    0,
    Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24)),
  );
  const timeRemaining = estimatedDurationDays - timePassed;
  const expectedProgress =
    estimatedDurationDays > 0
      ? Math.min(100, (timePassed / estimatedDurationDays) * 100)
      : 0;
  const delayPct = Math.max(0, expectedProgress - currentProgressPercentage);

  return {
    status: getTimelineStatus(project),
    timePassed,
    timeRemaining,
    expectedProgress,
    delayPct,
  };
}

/** Human-readable timeline status labels */
export const TIMELINE_STATUS_LABELS: Record<TimelineStatus, string> = {
  green: "Safe",
  yellow: "At Risk",
  red: "Critical",
  none: "No Timeline",
};

/** Priority labels with emoji */
export const PRIORITY_LABELS: Record<TimelineStatus, string> = {
  red: "Critical \uD83D\uDD34",
  yellow: "At Risk \uD83D\uDFE1",
  green: "Safe \uD83D\uDFE2",
  none: "",
};

export const TIMELINE_STATUS_CLASSES: Record<TimelineStatus, string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  red: "bg-red-100 text-red-700 border-red-200",
  none: "bg-muted text-muted-foreground border-border",
};

export const TIMELINE_PRIORITY: Record<TimelineStatus, number> = {
  red: 0,
  yellow: 1,
  green: 2,
  none: 3,
};
