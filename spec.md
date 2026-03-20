# BuildTrack

## Current State
Backend defines ProjectPhoto type and map but has NO API functions. Frontend upload is a stub that never touches blob storage or the backend.

## Requested Changes (Diff)

### Add
- Backend: addProjectPhoto, getProjectPhotosByProject, deleteProjectPhoto endpoints
- Frontend: real blob upload via ExternalBlob.fromFile + backend calls in PhotoProgressTab

### Modify
- Replace stub mutations and hardcoded empty array with real calls

### Remove
- Hardcoded Promise.resolve stub in query

## Implementation Plan
1. Add photo CRUD functions to main.mo
2. Regenerate backend
3. Update PhotoProgressTab to use ExternalBlob upload + real backend endpoints
4. Validate and deploy
