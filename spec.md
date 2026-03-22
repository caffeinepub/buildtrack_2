# BuildTrack

## Current State
- Version 48 is deployed with all MBCL Construction Manager features.
- `bootstrapAdmin()` resets on every deployment so the first user to log in becomes Admin.
- However, `bootstrapAdmin()` only assigns `#admin` role, NOT `#user` role.
- All write operations (createProject, addMaterial, etc.) check for `#user` permission only — admins do not pass this check.
- Result: Admin users cannot create projects or use write operations after bootstrap.
- Users page is already visible to all users.

## Requested Changes (Diff)

### Add
- Nothing new to add.

### Modify
- `bootstrapAdmin()`: also assign `#user` role to the new admin, so they pass all permission checks.
- `setApproval` (already assigns `#user` when approving): no change needed.
- `createProject`, `updateProject`, `createReport`, `addMaterial`, `addLabour`, `addBOQItem`, `addCostEntry`, and all other write operations: accept `#admin` role in addition to `#user` (belt-and-suspenders fix).

### Remove
- Nothing to remove.

## Implementation Plan
1. In `bootstrapAdmin()`: add `accessControlState.userRoles.add(caller, #user)` after adding `#admin`.
2. Update all write-operation guards to check `hasPermission(#user) OR isAdmin()` so admin users are never blocked.
3. Rebuild and deploy new draft version 49.
