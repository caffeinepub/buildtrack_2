# BuildTrack

## Current State
Project type lacks updatedAt. updateProject does not record save time.

## Requested Changes (Diff)

### Add
- updatedAt field to Project type
- Auto-stamp updatedAt on create and update
- Show Last Modified in project detail and project cards

### Modify
- createProject and updateProject stamp updatedAt = Time.now()
- postupgrade migration sets updatedAt = 0 for legacy records

### Remove
- Nothing

## Implementation Plan
1. Add updatedAt to Project type in main.mo
2. Stamp in createProject and updateProject
3. Update legacy migration
4. Regenerate backend
5. Update frontend to display last modified time
