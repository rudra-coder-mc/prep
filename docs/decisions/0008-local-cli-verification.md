# 8. Hard exercises execute on the laptop; scoring stays in the platform

**Status:** accepted — 2026-08-19

## Context

The Node, Express, Fastify and NestJS tracks cannot be exercised meaningfully
without a real process: real ports, real packages, real HTTP. Running that
server-side means ephemeral containers per attempt with resource limits,
timeouts, network isolation and cleanup. That is the single most expensive and
most dangerous thing this project could build, and it is infrastructure work, not
learning work.

Those exercises are already going to be solved locally in an editor. The gap is
only that finishing one currently means ticking a box by hand, with no real
feedback.

## Decision

A small `prep` CLI runs the exercise's test suite on the user's own machine and
reports a structured verdict back to the platform.

- The test suite ships **with the exercise**, under `content/`, version-controlled
  next to the lesson it belongs to. It is authored content, not something written
  ad hoc per attempt.
- `prep start <slug>` scaffolds a working directory with the starter files and
  the test suite. `prep test` runs it locally.
- The CLI posts a structured result to the platform: which named assertions
  passed, which failed, and how long it took.
- The platform writes the same `attempts` and `exercise_progress` rows the web
  interface writes. Scoring, topic status, weak-topic ranking and the streak are
  unchanged.

Execution moves to the laptop. Nothing else does.

## Alternatives

**Server-side containers per attempt.** Rejected. It is the expensive, dangerous
option this decision exists to avoid, and it buys a worse environment than the
user's own machine.

**Ship raw output to the platform and compare it there.** Rejected. It only works
for stdout, and almost nothing these tracks teach is stdout. Status codes,
middleware ordering, and error shapes cannot be asserted from a text blob. The
assertions have to live in a test suite, which means they have to run where the
code runs.

**Keep manual mark-complete only.** Rejected as the sole option, but retained as
a fallback for exercises with no meaningful automated assertion.

## Consequences

The verdict is self-reported: the test file is on the user's disk and could be
edited. This is a single-user personal tool, so the only person who could be
misled is its author. No integrity mechanism is worth building.

The CLI is a separate deliverable with its own tests and its own release path. It
must stay narrow: fetch, run, report. It is not a place for a TUI or a scaffolding
framework.

The platform is local-only (see `CLAUDE.md`), so the CLI talks to
`http://localhost:3000` with a token from the web interface stored in
`~/.prep/config.json`. No public API surface is created.

This pattern generalises. Any future track too heavy to run in the browser gets a
local test suite and the same verdict endpoint, rather than a new execution
service.
