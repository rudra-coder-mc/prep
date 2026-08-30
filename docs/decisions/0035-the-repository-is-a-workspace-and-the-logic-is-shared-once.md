# 0035. The repository is a workspace and the logic is shared once

Status: accepted
Date: 2026-08-30

## Context

The interval ladder, what a tier covers, how readiness is counted and how an
answer is graded are the definition of this platform. If the phone and the
laptop ever disagree about when a question is due, the product is broken in a
way that is hard to see and impossible to trust.

`src/lib` already separates pure functions over rows from the code that talks to
Postgres. That separation is what makes sharing possible at all, and it existed
before there was a second client to share with.

## Decision

One repository, npm workspaces, four members.

`packages/core` holds the pure logic and the content types: the interval ladder,
tiers, readiness, topic status, the daily queue, the day, choice and ordering
grading, the content schema, heading slugs and technology names, with the tests
they already have. `packages/content` holds `content/` itself, the loader, the
validator and the archive build. `apps/web` keeps everything that touches
Postgres, better-auth or the DOM. `apps/mobile` is the Expo app.

Database access is written twice, once against Postgres and once against SQLite
on the device. Only the logic is shared. The phone mirrors the server's tables
rather than deriving state when it reads, so both sides run the same functions
over the same shapes.

## Alternatives considered

**A second repository, with content copied or pulled in as a submodule.** The
two copies drift, and the day they drift is the day the schedule quietly
disagrees with itself. A submodule moves the drift rather than removing it.

**One query layer serving both dialects.** The table definitions have to be
written twice regardless, and the phone's query surface is about fifteen simple
statements. The ceremony costs more than the duplication it removes.

**Deriving schedule state on the phone from its attempts.** It is a second
implementation of replaying a question's history into a rung, which is exactly
the drift the shared package exists to prevent.

## Consequences

A change to the ladder is one change, and both clients get it.

The web app moves to `apps/web`. That is a mechanical diff, but a wide one, and
it has to land before any mobile work starts, because the web app is in daily
use throughout.

The pre-commit hooks and `npm run verify` become workspace aware. Adding a third
surface later costs a package rather than a rewrite.

Every path written down before this decision is one level out. A doc or an
earlier ADR naming `src/lib/x.ts` means `apps/web/src/lib/x.ts` unless the file
is one this moved, and `content/` means `packages/content/content/`. Those
records were left as they were written rather than edited to match, since they
describe what was decided at the time. `README.md` and `docs/architecture.md`
are kept current and are the place to look for where something lives now.
