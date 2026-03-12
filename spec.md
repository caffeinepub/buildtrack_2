# BuildTrack

## Current State
Dashboard shows stat cards (active/planning/completed/on-hold counts), a budget summary with progress bars, and a grid of project cards. No charts exist yet.

## Requested Changes (Diff)

### Add
- A "Project Progress" charts section on the dashboard with:
  - A bar chart showing budget vs. actual spent per project
  - A donut/pie chart showing project status distribution (active, planning, completed, on hold)

### Modify
- Dashboard.tsx: add a charts section below the budget summary cards, using data already fetched (stats + allProjects + their summaries)

### Remove
- Nothing removed

## Implementation Plan
1. Install/use recharts via the existing `ChartContainer` from `@/components/ui/chart` (already available)
2. In Dashboard.tsx, build two chart cards:
   - `BudgetBarChart`: fetches all projects (all statuses) and their summaries to render a grouped bar chart (Budget vs Spent per project name)
   - `StatusDonutChart`: uses stats counts to render a pie/donut chart of project status distribution
3. Place charts section between budget summary and project cards grid
4. Apply deterministic `data-ocid` markers to chart containers
