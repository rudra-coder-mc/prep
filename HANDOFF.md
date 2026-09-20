# Bug Report & Next Session Handoff

## 1. Executive Summary & New Bug Report

Following the deployment of APK build `versionCode: 5` (Build ID: `6788a92f-2492-41aa-a0cc-de969cd496df`), testing on the live device identified three critical UX & business logic regressions that require immediate remediation:

---

### Bug 1: Review Queue Leaking SWE-2 Questions for SWE-1 Topics

- **Symptom**: In the "Start Review" session (and "due today" counter on the home dashboard), users who selected `SWE-1` are being asked `SWE-2` questions for topics where they only studied and completed `SWE-1`.
- **Root Cause**:
  - In `apps/mobile/src/review/queue.ts`, `buildReviewQueue(content, schedule, now)` takes the schedule directly from SQLite (`readSchedule(db)`) and checks only `index.has(row.questionId)`.
  - It does **not** check the user's selected tier for the track/topic (`app.tiers.get(topic.technology)`).
  - If SWE-2 questions were previously enrolled in SQLite (either before tier selection, via sync, or during topic enrollment), `buildReviewQueue` queues them indiscriminately without filtering by `questionsUpTo(trackTier)`.
- **Required Fix**:
  1. Update `buildReviewQueue` to accept `trackTiers: Map<string, Tier>` and `defaultTier: Tier`.
  2. For every scheduled question, lookup its topic technology, determine its active tier, and filter out any question where `!tiersUpTo(activeTier).includes(question.tier)`.
  3. Ensure `countDueToday` on the home dashboard (`apps/mobile/app/index.tsx`) uses the identical tier-filtered askable queue so the numbers align.
  4. Provide a database cleanup/reconciliation routine (`reconcileEnrolments`) to un-enroll or mark dormant any questions that exceed the active tier for a track.

---

### Bug 2: Missing Granular (Per-Track) Level Controls & Cluttered Track Header

- **Symptom**:
  - In `Settings & Sync`, the app only offers a single global level picker ("all-or-nothing"), with no way to configure JavaScript as `SWE-1`, Browser as `SWE-2`, etc.
  - In `TrackScreen` (`apps/mobile/app/track/[technology].tsx`), there is still an in-screen `TierPicker` in the header, which clutters the reading flow.
- **Requested Behavior**:
  1. **Remove TierPicker from Track Screen**: Clean up `TrackScreen` header completely; topics should display directly based on the configured tier.
  2. **Move Granular Tier Configuration to Settings**: In `Settings & Sync`, add a dedicated "Tracks & Interview Levels" section where each track (JavaScript, TypeScript, React, Next.js, etc.) has its own independent `TierPicker` (SWE-1, SWE-2, Senior, Staff) alongside the global default level.

---

### Bug 3: Screen Freeze / Lack of Skeleton or Loading Indicator on Navigation

- **Symptom**:
  - When tapping a track (e.g. Browser, JavaScript, React) or opening a topic lesson from the track list, the UI appears to hang/freeze for 300–800ms with zero loading indicator, skeleton, or visual feedback before suddenly rendering.
- **Root Cause**:
  - In `apps/mobile/app/track/[technology].tsx`: Initializing state synchronously with `topicSummaries` over 32+ topics blocks the JS thread during Android's native transition animation.
  - In `apps/mobile/app/topic/[technology]/[directory].tsx`: While reading SQLite (`lessonOnDevice`, `readLearnedTopics`) and determining audio recordings, rendering `<Waiting>` only appears after an asynchronous tick, or the native navigation transition freezes while waiting for heavy WebView mounting.
- **Required Fix**:
  1. Add a lightweight, instant `<TrackSkeleton />` component in `TrackScreen` that renders immediately on mount.
  2. Defer heavy topic computation and SQLite lookups using `InteractionManager.runAfterInteractions` or a fast first-frame render.
  3. In `TopicScreen`, render an instant `<TopicSkeleton />` while the file URI and WebView initialize.

---

## 2. Action Plan for Next Session

1. **Fix Review Queue Tier Scoping**:
   - Modify `apps/mobile/src/review/queue.ts` to filter by track tiers using `tiersUpTo(tier)`.
   - Update `apps/mobile/app/review.tsx` and `apps/mobile/app/index.tsx` to pass active tiers into `buildReviewQueue`.
   - Add unit tests verifying that SWE-2 questions are never included when a track is set to SWE-1.
2. **Move Track Tier Controls to Settings**:
   - Remove `<TierPicker>` from `apps/mobile/app/track/[technology].tsx`.
   - In `apps/mobile/app/index.tsx` (under Settings & Sync tab), list each track with an inline tier selector.
3. **Implement Navigation Skeletons & Eliminate Freezes**:
   - Build `apps/mobile/src/ui/skeletons.tsx` (pulsing card skeletons for track lists and lesson views).
   - Wrap initial data resolution in `InteractionManager.runAfterInteractions`.
4. **Trigger Updated EAS Build (`versionCode: 6`)**:
   - Re-test lint, typecheck, vitest.
   - Run `npx eas build --platform android --profile production --non-interactive` for the sideloadable APK.

---

## 3. Current Environment State

- **Branch**: `feature/35-installable-apk` (clean, pushed to origin at `7207f78`).
- **Latest Build**: EAS Build ID `6788a92f-2492-41aa-a0cc-de969cd496df` (`versionCode: 5`).
  - [APK Download (Expo CDN)](https://expo.dev/artifacts/eas/2h1v563PfvH7j796hCqB3y.apk)
- **User Credentials**: `atul@prep.in` / `atul`.

---

## 4. Release Status & Resolution Verification (Build 7)

All three reported regressions have been fully resolved, verified with unit tests and lint checks, and built into a new sideloadable APK:

- **EAS Build ID**: `75569b06-e531-4e37-95cc-6aec7e19ad01`
- **Version Code**: `7` (App version: `0.1.0`)
- **Direct APK Download**: [Download Updated APK (Expo CDN)](https://expo.dev/artifacts/eas/nFhUqQWqM4P4UeG1Z2JvVf.apk)
- **Git Commit**: `b639d80` (pushed to branch `feature/35-installable-apk`)

### Summary of Fixes:

1. **Review Queue Tier Scoping & Auto-Reconciliation**:
   - `buildReviewQueue` strictly filters scheduled questions with `tiersUpTo(activeTier)`. SWE-2 questions are never served for SWE-1 selections.
   - Auto-reconciliation (`reconcileEnrolments` / `reconcileTrackEnrolments`) prunes or cleans up any orphan higher-tier schedules on boot and tier change.
   - Home screen "Due Today" counter matches the exact active-tier queue filter.
2. **Granular Per-Track Levels in Settings**:
   - Removed the intrusive in-screen `TierPicker` from `TrackScreen`.
   - Added a dedicated "Track Target Levels" section in `Settings` where each track (JavaScript, TypeScript, React, Next.js, Browser, etc.) has its own independent tier selector.
3. **Smooth Screen Transitions & Pulsing Skeletons**:
   - Created `<TrackSkeleton />` and `<TopicSkeleton />` with smooth opacity pulsing.
   - Replaced frozen transition delays by running layout initialization and heavy computations behind `InteractionManager.runAfterInteractions`.
