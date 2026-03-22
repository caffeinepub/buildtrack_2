# BuildTrack – Production Stability Upgrade

## Current State
BuildTrack is a full-stack construction management platform with Motoko backend and React/TypeScript frontend. Backend has all required API endpoints (createProject, updateProject, getProjects, addMaterial, addLabour, createReport, addBOQItem, addProjectPhoto, etc.). Frontend has pages for Dashboard, Projects, ProjectDetail, UserManagementPage, and supporting components.

Known issues:
- Create Project modal sometimes closes automatically on submit even if the project was not created
- No consistent global error handling
- Some forms may clear data on failed submission
- Missing upload progress indicators in some places
- Potential duplicate submission risk (buttons not always disabled during processing)
- Tabs in ProjectDetail may reset on data refresh
- Auto-save draft implemented for project forms but may have edge cases

## Requested Changes (Diff)

### Add
- Global error boundary component that catches React errors and shows a user-friendly message
- `useFormDraft` custom hook that auto-saves form state to localStorage and restores on mount
- Toast notification system for all success/error actions (already have sonner, ensure it's wired everywhere)
- Upload progress indicator component for file uploads
- `useSubmitGuard` pattern: a single boolean `isSubmitting` state that prevents duplicate submissions

### Modify
- **Create Project modal**: Fix the root cause of auto-close -- ensure `onOpenChange` only closes when `isSubmitting` is false; use `onInteractOutside` and `onEscapeKeyDown` preventDefault to block outside-close; only close dialog after confirmed successful backend response
- **All mutation handlers** (createProject, editProject, addMaterial, addLabour, createReport, addBOQItem, uploadPhoto): wrap in try/catch, show loading state on button, disable button during processing, show success toast, show error toast without clearing form data
- **ProjectDetail tabs**: Store active tab in component state (not URL), prevent tab reset when data refetches via `keepPreviousData`
- **Photo upload form**: Don't close until upload is fully complete; show progress indicator; keep form open on error
- **All dialogs/modals**: Set `modal={true}`, use `onInteractOutside={(e) => e.preventDefault()}` and `onEscapeKeyDown={(e) => e.preventDefault()}` to prevent accidental closure
- **Auth context**: Ensure session persistence across page navigation; keep user logged in unless they explicitly sign out
- **React Query config**: Add `staleTime`, `retry`, and `keepPreviousData` settings to prevent unnecessary loading states on navigation

### Remove
- Any remaining `window.location.reload()` calls
- Any form `reset()` calls that fire before confirmed success

## Implementation Plan
1. Audit all dialog/modal components in Projects.tsx and ProjectDetail.tsx — fix `onOpenChange` guard and prevent-close props
2. Ensure all mutation `onSuccess` closes the dialog, `onError` keeps it open with error message and preserved data
3. Add `isSubmitting` disable to all action buttons across all pages
4. Wire success/error toasts to all mutations using sonner's `toast.success()` and `toast.error()`
5. Add `keepPreviousData: true` to all useQuery calls in ProjectDetail to prevent tab content flash
6. Persist active tab selection with useState (not URL), ensure tab doesn't reset on data refresh
7. Add global error boundary in App.tsx
8. Ensure auto-save draft (localStorage) is wired to Create Project and Edit Project forms
9. Verify photo upload keeps form open during upload, shows progress, only closes on success
10. Run lint/typecheck/build and fix all errors
