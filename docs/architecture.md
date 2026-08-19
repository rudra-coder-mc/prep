# Architecture

## What this system is

A single-user, self-hosted learning platform built around one loop:

```
Read topic  ->  Mark learned  ->  Recall questions on a schedule
     ^                                        |
     |                                        v
  Review  <-  Weak topics surface  <-  Self-evaluate + confidence
```

The topic page is the centrepiece, not the question bank. Marking a topic as
learned is the act that enrols its questions into the recall schedule. Everything
else — the daily queue, the streak, the weak-topic list, the dashboard — is
derived from attempts against those questions.

## Shape

One Next.js application (App Router) talking to one Postgres database. No
separate API service. Server Components read data directly, Server Actions write
it. For a single-user tool, a network hop between a frontend and a backend we
also own buys nothing and costs two deployments.

```
                docker compose up
                        |
        +---------------+---------------+
        |                               |
   app container                  postgres container
   Next.js (standalone)           named volume: pgdata
   better-auth                    healthcheck gates app start
   drizzle-orm
        |
   content/ baked into the image at build time
```

## The two halves: content and progress

This is the most important boundary in the system.

**Content lives in git.** Topics, lessons, questions and exercises are files
under `content/`. They are authored in an editor, reviewed in diffs, and compiled
into the application at build time. They are never rows in a table.

**Progress lives in Postgres.** Who you are, what you answered, how confident you
felt, when a question is next due, what you did each day.

The two are joined by string slugs, not foreign keys. `topic_progress.topicSlug`
holds `"javascript/closures"`; nothing in the database enforces that this topic
exists. That is deliberate — it means adding, renaming or reorganising the
curriculum is a content change, never a migration. The cost is that deleting
content orphans rows; a maintenance task reconciles them, and orphaned rows are
harmless in the meantime.

### Content layout

```
content/javascript/closures/
  lesson.mdx        the explanation, importing visual components inline
  questions.ts      typed question objects for this topic
  exercises.ts      practical exercises, solved locally in VS Code
  meta.ts           slug, title, order, difficulty, tags, prerequisites
```

A topic is a directory. Adding one means adding a directory — no registry to
update by hand, no seed script to rerun. The loader walks `content/` at build
time and validates every file against a Zod schema, so a malformed question
fails the build rather than the session.

## The interface

Everything behind auth lives in the `(app)` route group, whose layout renders
the top bar. The bar is the only navigation: brand, Dashboard, Topics, Review
with a due-count badge, the streak, and sign out. It never unmounts, so moving
around replaces content and nothing else.

```
src/app/
  (app)/                  the signed-in shell: top bar, progress bar
    page.tsx              dashboard
    topics/               list, then [technology]/[topic]/ with its own layout
    review/               the daily queue
  login/                  outside the shell, no chrome
  not-found.tsx

src/components/
  chrome/                 top bar, links, breadcrumb and tabs, route progress
  ui/                     Button, Card, ProgressBar, StatusBadge, Skeleton, PageShell
  motion/                 the Rise entrance and the reduced-motion hook
  visuals/                the lesson animation library

src/actions/              server actions, outside the routing tree
```

A topic's lesson, questions and exercises share a layout, so the breadcrumb and
the tabs stay fixed while the view under them changes. Internal links route
through `AppLink`, which feeds Next's per-link pending state into the global
progress bar, and every route has a `loading.tsx` skeleton, so a slow page shows
its frame rather than nothing.

Motion is one primitive (`<Rise>`) with shared easing, and every animated
component checks `prefers-reduced-motion` before it moves. See
`docs/decisions/0009-app-shell-and-motion.md`.

## The visual layer

Animation is the expensive part of this project, so it is built as a finite,
reusable library rather than per-topic one-offs:

| Component           | Shows                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `<CodeWalkthrough>` | Generic line-by-line player with variable state. Carries most topics. |
| `<CallStack>`       | Frames pushing and popping.                                           |
| `<EventLoop>`       | Call stack, microtask queue, macrotask queue, render step.            |
| `<MemoryModel>`     | Stack vs heap, references, mutation and copying.                      |
| `<ScopeChain>`      | Nested environments and identifier resolution.                        |
| `<PrototypeChain>`  | `__proto__` links and property lookup.                                |
| `<PromiseTimeline>` | Pending, settlement, and resolution order over time.                  |

All are data-driven: a lesson passes a description of the steps, not imperative
animation code. Building these against the five hardest topics first is
intentional — if the primitives survive closures, the event loop, `this`,
prototypes and promises, the remaining topics are authoring work rather than
engineering work.

## Data model

Six tables. Deliberately small.

| Table               | Holds                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| `users`             | Identity. Managed by better-auth, which also owns its session tables.                 |
| `topic_progress`    | Per user per topic: status, when learned, when last reviewed.                         |
| `attempts`          | Full history. Never overwritten — every attempt is a new row.                         |
| `review_schedule`   | Per user per question: when it is next due, and where it sits on the interval ladder. |
| `exercise_progress` | Practical exercises: status, notes, completion.                                       |
| `daily_activity`    | One row per user per day: how much was reviewed, whether the queue was cleared.       |

Two things are computed rather than stored:

- **Topic status** (`not_started` / `learning` / `weak` / `understood` /
  `mastered`) is derived from recent attempts, not written to a column. A
  scoring change is then a code change, not a backfill.
- **The streak** is derived from `daily_activity`. A stored counter can drift
  out of sync with what actually happened; a derived one cannot.

A "day" is a calendar day in one configured timezone, `APP_TIMEZONE`, rather than
the device's. Travelling must not shift when a streak rolls over, and two devices
must agree on what today is.

## Recall scheduling

Confidence drives the next interval:

| Confidence                   | Next due    |
| ---------------------------- | ----------- |
| 1 — don't understand it      | later today |
| 2 — partly understand it     | 1 day       |
| 3 — can explain with help    | 3 days      |
| 4 — understand it            | 7 days      |
| 5 — can explain and apply it | 14 days     |

A `failed` result resets to the bottom of the ladder regardless of confidence.
The daily queue is capped so it is never a wall, and fills in priority order:
overdue, then due today, then weakest topics.

This is intentionally not SM-2. It is predictable, explainable when it
misbehaves, and stores an interval _step_ rather than a computed date delta —
so replacing it with real spaced repetition later needs no schema change.

## Evaluation

Self-evaluation only. You type an answer, reveal the expected one, then mark
Pass / Weak / Failed and rate confidence 1-5. Free-text answers are stored so
you can see how your own explanations changed over time.

No auto-grading and no AI tutor. Grading free-text technical answers reliably is
harder than everything else here combined, and the honest self-assessment that
active recall depends on does not need a machine.

## Not in V1

AI tutoring, multi-user support, social login, mobile, gamification beyond the
streak, SM-2, and any service beyond the two containers. The schema is
multi-user-shaped (`userId` on every progress row) so that adding users later is
an auth change, not a data migration — but nothing else anticipates features that
do not exist yet.

Code execution is also out of V1, but unlike the above it is planned, and the
shape of the plan constrains V1. Runnable tasks arrive later as browser-side WASM
runners — PGlite for Postgres, QuickJS for JavaScript, `mingo` for Mongo — and,
for tracks needing a real process, a local CLI that runs the exercise's test suite
on the user's own machine and posts a structured verdict back. Both write the same
`attempts` row the web interface writes, so neither needs a new progress model.
That is only true because content is files and attempts are generic, which is the
main thing V1 has to get right. See `docs/decisions/0007-execution-runners.md` and
`docs/decisions/0008-local-cli-verification.md`.
