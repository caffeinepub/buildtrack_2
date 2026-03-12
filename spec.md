# BuildTrack

## Current State
The app has a sidebar navigation, authentication via Internet Identity, and pages for Dashboard, Projects, and ProjectDetail. The app renders immediately with no intro screen.

## Requested Changes (Diff)

### Add
- SplashScreen component that shows on app start for ~2.5 seconds before fading out
- Company logo image (/assets/generated/buildtrack-logo-transparent.dim_200x200.png)
- Company name "BuildTrack" in large bold text
- Short description: "Construction Project Management"

### Modify
- App.tsx to show SplashScreen first, then render the main app after the splash completes

### Remove
- Nothing

## Implementation Plan
1. Create `SplashScreen.tsx` component with logo, company name, and description. Animate in on mount, animate out after ~2s, calls onDone callback.
2. Add `showSplash` state to App. Render SplashScreen when true, main app when false.
