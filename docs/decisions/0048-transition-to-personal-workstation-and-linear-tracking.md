# 0048. Transition to personal machine, public GitHub hosting, and Linear ticket tracking

Status: accepted
Date: 2026-09-08

## Context

`0038` and earlier repository policies in `CLAUDE.md` enforced a strict local-only air-gap rule: no git remote, no external services (except personal Expo for APK builds), and no external issue trackers. This was necessitated because development originally took place on a company-owned machine, preventing personal project code from interacting with corporate infrastructure or unvetted external services.

The project has now migrated entirely to Atul's personal workstation. Development is conducted under personal accounts and personal infrastructure.

## Decision

1. **Policy Migration from CLAUDE.md to agent.md**:
   - Repository rules and agent instructions are moved to `agent.md` (and symlinked `AGENTS.md`).
   - The corporate air-gap restrictions (no git remotes, no external services) are lifted.

2. **Public GitHub Hosting**:
   - The repository is hosted on GitHub (`rudra-coder-mc/prep`) as a public project.
   - Remote git workflows (remotes, pushes, branches) are enabled.
   - Sensitive and generated files (`.env`, local secrets, `.speech-cache`, `.content-archive`) remain strictly ignored via `.gitignore` and `.easignore`.

3. **Linear for Task & Ticket Tracking**:
   - Task management transitions from `TASKS.md` to Linear.
   - Work proceeds step-by-step with ticket IDs referenced in branches and commits (e.g. `feat/PREP-35-...`).

4. **Quality Gates Maintained**:
   - High-standard quality gates (`npm run verify`: lint, format, typecheck, unit, integration, and e2e tests) remain mandatory prior to merging into `main`.

## Consequences

- Direct remote synchronization and external tooling are enabled.
- Tasks are tracked in Linear with step-by-step visibility rather than static file tracking in `TASKS.md`.
