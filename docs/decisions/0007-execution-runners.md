# 7. Execution runners: browser-first, and only where it is cheap

**Status:** accepted — 2026-08-19

## Context

Later tracks want runnable tasks, not just questions: SQL you actually execute,
JavaScript whose output is checked rather than self-reported, Mongo queries,
React components. Executing user-authored code is normally the most expensive and
most dangerous part of a learning platform, and it is the thing most likely to
turn this project into an infrastructure project instead of a learning tool.

## Decision

A runner is added only when it executes **in the browser**, with no server-side
execution infrastructure. Anything that needs a real process is handled by the
local CLI instead (see decision 0008).

| Track      | Runner                                              | Notes                                                                                                               |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL | PGlite (Postgres compiled to WASM)                  | Real Postgres planner, so `EXPLAIN`, CTEs and window functions behave correctly. Compare result sets for pass/fail. |
| SQLite     | `wa-sqlite` or `sql.js`                             | Trivial.                                                                                                            |
| JavaScript | QuickJS via WASM                                    | Real engine, sandboxed, captures `console.log`, no network, safe to kill on a hang.                                 |
| TypeScript | esbuild-wasm to compile, then the JavaScript runner | Reuses the JS path entirely.                                                                                        |
| MongoDB    | `mingo`                                             | Query and aggregation language evaluated in JS.                                                                     |
| React      | Sandpack                                            | Heavy but proven. Lowest priority of the browser runners.                                                           |

Editor input uses CodeMirror 6 with per-language syntax highlighting; Shiki
continues to handle read-only code in lessons.

## Explicitly not built

**MySQL.** No mature WASM build exists, so it would require a real server. The
MySQL track ships as questions only, with dialect differences taught against
Postgres.

**Node, Express, Fastify, NestJS.** These need a real process, real ports and real
packages. Handled by decision 0008.

**Mongo indexes, `explain()` and transactions.** `mingo` is a query engine, not a
server, so these are out of reach in the browser. They remain question-only
unless a local runner is added for them later.

## Consequences

Everything above runs client-side. There is no execution service, no container
orchestration, no resource limiting, and no untrusted-code security surface in
the platform itself.

Adding a runner is a content-plus-component change, not an architectural one,
because a topic is a directory of files joined by a slug rather than rows in a
table (decision 0002). An auto-graded result writes the same `attempts` row the
web UI writes, so no new progress model is needed.

No `Runner` abstraction is built until the second runner exists. There is nothing
to abstract over yet, and a `gradedBy` column can be added later with a one-line
migration that backfills correctly.
