# BuildTrack - Photo Progress Timeline

## Current State
The app has: projects, daily reports, materials, labour, BOQ, cost control tabs per project. Backend has tables for projects (with stage), reports, materials, labour (via CostEntry), boq_items. Blob-storage component is NOT yet selected. No photo storage exists.

## Requested Changes (Diff)

### Add
- `ProjectPhoto` type in backend: id, projectId, reportId (optional/Nat), imageUrl, dateUploaded (Time), description
- Backend CRUD: `addProjectPhoto`, `getPhotosByProject(projectId)`, `deleteProjectPhoto(id)`
- Blob-storage component for image uploads (URL generation)
- New "Photo Progress" tab in ProjectDetail page
- Upload form: image file picker, date (default today), description field
- Timeline display: photos sorted by dateUploaded ascending, vertical timeline layout, image preview, date, description, click-to-enlarge modal
- Mobile-friendly timeline using MBCL blue/gold theme

### Modify
- `ProjectDetail.tsx`: add Photo Progress tab trigger and content, add `PhotoProgressTab` component
- Tab list in ProjectDetail: add new tab after Cost Control

### Remove
- Nothing removed

## Implementation Plan
1. Select `blob-storage` component
2. Generate backend with new `ProjectPhoto` type and CRUD functions alongside all existing types/functions
3. Add `PhotoProgressTab` component to `ProjectDetail.tsx` with upload form and vertical timeline
4. Wire blob-storage upload hook to get image URL, then call `addProjectPhoto`
5. Display photos in chronological order with click-to-enlarge dialog
