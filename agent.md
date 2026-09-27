# prep

Personal learning platform for technical interview preparation and active recall.

## Project Context

This is Atul's personal project, running on his personal workstation.
The repository is hosted on GitHub as a public repository (`rudra-coder-mc/prep`).
Online connectivity, remote git synchronization, external builds (such as EAS Build), and hosted integrations are fully supported.

### Infrastructure & Deployment Invariant

- **Local Workstation Only**: There is no live remote server, no cloud deployment, and no Tailscale network. The web app and backend run strictly on the local machine via Docker when needed (`docker compose up`).
- **Offline-First Mobile Loop**: The mobile app exists specifically to avoid running always-on servers or background Docker containers.
  1. Start Docker on the local workstation.
  2. Connect the mobile app to the workstation over local Wi-Fi (`http://<local-ip>:3000`).
  3. Download lessons, curriculum archive, and audio recordings.
  4. Shut down Docker. Use the mobile app completely offline for lessons, audio, and active recall.
  5. Reconnect to the local workstation over local Wi-Fi when on-demand progress synchronization or new content fetching is desired.

## Task & Ticket Tracking (Linear)

Task and ticket tracking is managed via **Linear**.
Work proceeds step-by-step with clear scope, incremental commits, and thorough verification.

### Step-by-Step Task Workflow

1. **Pick or Define Ticket**:
   - Reference the Linear ticket identifier (e.g. `PREP-123` or `<type>/<slug>`).
   - Confirm requirements, acceptance criteria, and architectural constraints.
2. **Branch per Task**:
   - Branch naming convention: `<type>/<linear-id>-<slug>` (e.g. `feat/PREP-35-installable-apk`, `fix/PREP-41-audio-cache`).
   - Work on one discrete task per branch.
3. **Incremental Implementation**:
   - Implement the minimal required changes following existing architecture.
   - Run tests and quality checks as changes are made.
4. **Quality & Verification Gates**:
   - Every change must pass quality checks before merging.
   - Pre-commit: lint, format, typecheck, unit tests.
   - Full verification: `npm run verify` (runs lint, format:check, typecheck, unit, integration, and e2e tests).
   - Never merge into `main` with failing verification.
5. **Commit & Merge / Pull Request**:
   - Use conventional commit messages referencing the ticket (e.g. `feat(mobile): configure installable APK build [PREP-35]`).
   - Merge discrete tasks cleanly into `main` (using `--no-ff` where discrete task history is desired).
   - Update the Linear ticket state to Completed / In Review once verified.

## Architecture & Codebase Guidelines

The codebase is an npm workspaces monorepo:

- `packages/core`: Pure shared business logic (`@prep/core`).
  - Scheduling algorithms (`replaySchedule`), daily review queues (`buildDailyQueue`), scoring, and shared schemas (`EXERCISE_STATUSES`).
  - Invariant: The web app and mobile app share the exact same core functions so state and progress calculations never diverge.
- `packages/content`: Curriculum content, lesson building, and archive packaging (`@prep/content`).
  - Contains Markdown/MDX lessons, quiz questions, and coding exercises across topics.
  - Builds `.content-archive/` and `archive.zip` used by the mobile client.
- `apps/web`: Next.js 15 application.
  - Interactive web dashboard, lessons, review sessions, and API endpoints.
  - Device API routes (`/api/device/session`, `/api/device/archive`, `/api/device/sync`, `/api/device/audio`).
- `apps/mobile`: Expo / React Native mobile application (`prep`).
  - Offline-first architecture: mirrors server progress tables in local SQLite.
  - Pre-rendered lesson WebView bridge, offline audio player, offline review sessions.
  - Bidirectional progress sync with the server via `/api/device/sync`.
- `services/tts`: Python Piper TTS microservice running in Docker to synthesize audio narration.

## Quality Gates

- `npm run lint` - ESLint across workspace
- `npm run format:check` - Prettier code formatting check
- `npm run typecheck` - TypeScript type checking across all packages and apps
- `npm run test` - Vitest unit test suite
- `npm run verify` - Comprehensive quality gate (lint + format + typecheck + unit + integration + e2e)

## Key References

- Stack and architecture: [README.md](file:///home/for-coding/Desktop/prep/README.md) and [docs/architecture.md](file:///home/for-coding/Desktop/prep/docs/architecture.md)
- Architectural Decision Records: `docs/decisions/`
- Recent handoff notes & architectural context: [HANDOFF.md](file:///home/for-coding/Desktop/prep/HANDOFF.md)
- Local environment defaults: `compose.yaml` and `.env.example`
