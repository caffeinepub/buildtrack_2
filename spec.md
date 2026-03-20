# BuildTrack — Version 18: Timeline Criticality & Priority

## Current State
Version 17 has fully automatic timeline status (Green/Yellow/Red) computed from expected vs actual progress. Dashboard groups projects as Critical/Warning/On Track. Project detail page shows alert banners with messages "Project is delayed" and "Project is at risk". No dedicated "Critical Projects" section. No Schedule/Gantt tab.

## Requested Changes (Diff)

### Add
- `project_priority` computed field helper in timelineUtils: RED→Critical, YELLOW→At Risk, GREEN→Safe
- Priority label badges on project cards: "Critical 🔴", "At Risk 🟡", "Safe 🟢"
- Prominent "⚠️ Critical Projects" section at very top of dashboard project list (RED only)
- Updated Timeline Summary Panel labels: "Total Critical Projects", "Total At Risk Projects", "Total Safe Projects"
- Schedule tab in ProjectDetail with Gantt-style task timeline chart, coloring delayed tasks RED and near-deadline tasks YELLOW
- Alerts updated to: "Project is critically delayed" (RED) and "Project is at risk of delay" (YELLOW)

### Modify
- Dashboard Timeline Status Summary: rename On Track→Safe, Warning→At Risk, keep Critical
- Dashboard project groups: label RED group as "⚠️ Critical Projects" (more prominent), keep Yellow as "At Risk", Green as "Safe"
- ProjectCard: add priority label next to timeline status badge
- ProjectDetail alert messages: update wording to match spec exactly
- ProjectDetail Tabs: add "Schedule" tab between Budget and Photos

### Remove
- Nothing removed

## Implementation Plan
1. Update `timelineUtils.ts`: add `getPriorityLabel()` helper and `PRIORITY_LABELS` map
2. Update `Dashboard.tsx`: rename timeline summary labels, update group headers to show ⚠️ Critical Projects section prominently, add priority labels to ProjectCard
3. Update `ProjectDetail.tsx`: update alert banner messages, add Schedule tab with Gantt chart showing tasks from daily reports/BOQ items colored by delay status
