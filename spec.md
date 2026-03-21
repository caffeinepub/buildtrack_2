# BuildTrack

## Current State
- App uses Internet Identity for auth with `authorization` component (admin/user/guest roles)
- UserManagementPage exists but only supports role assignment by Principal ID
- No user approval gate: any logged-in user with a role can access the dashboard immediately
- No active user tracking (last login, online status)
- Dashboard has no pending approvals banner or active users panel

## Requested Changes (Diff)

### Add
- User approval gate: new users who log in for the first time land on a "Pending Approval" screen instead of the dashboard
- Admin approval workflow in UserManagementPage: Approval Queue tab (approve/reject pending users), All Users tab with status badges and deactivate/re-approve actions
- Active Users tab in UserManagementPage: list of users currently logged in with last login time (auto-refreshes every 30s)
- Dashboard: amber alert banner when there are pending approvals (admin only), and Active Users panel card
- Sidebar: red badge next to Users nav link showing count of pending approvals (admin only)
- Backend: `approvalStatus` field on user profiles (pending/approved/rejected), `lastLogin` timestamp, `isActive` flag
- Backend: queries for getPendingUsers, getAllUsers, getActiveUsers, approveUser, rejectUser, deactivateUser
- Login tracking: on login record lastLogin and set isActive=true; on logout set isActive=false

### Modify
- UserManagementPage: replace single-panel layout with tabbed layout (Approval Queue, All Users, Active Users, Role Assignment)
- AuthContext: after login, check if user is approved; if not, redirect to pending screen
- Dashboard: add pending approvals alert and active users panel for admins
- Nav/Sidebar: add pending count badge to Users link

### Remove
- Nothing removed; existing role assignment preserved

## Implementation Plan
1. Add `user-approval` Caffeine component
2. Regenerate backend with approval fields (approvalStatus, lastLogin, isActive) on UserProfile, and approval management endpoints
3. Update AuthContext to check approval status and expose isPending state
4. Create PendingApprovalPage shown when user is authenticated but not yet approved
5. Update UserManagementPage with 4 tabs: Approval Queue, All Users, Active Users, Role Assignment
6. Update Dashboard with pending approvals banner and Active Users card (admin)
7. Update Nav sidebar with pending count badge on Users link
8. Wire login/logout to update lastLogin and isActive in backend
