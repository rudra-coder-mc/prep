# 9. One app shell, and motion that only ever helps

**Status:** accepted - 2026-08-19

## Context

V1 shipped every page as an island. Each one rendered its own back link, there
was no persistent chrome, and the only way to reach a topic's exercises was to
type the URL. Navigating meant a blank pause followed by a different screen
appearing all at once, which reads as a page load rather than as moving around
an application.

Animation already existed inside lessons. Outside them there was none, and the
gap made the surrounding product feel unfinished next to its own content.

## Decision

**A route group owns the signed-in shell.** Everything behind auth lives under
`src/app/(app)/`, whose layout renders the top bar once. URLs are unchanged.
Because the layout sits above every page, the bar, the streak and the due count
never unmount, so navigation replaces the content and nothing else.

**A topic is one place with three views.** `topics/[technology]/[topic]/layout.tsx`
renders the breadcrumb and the Lesson / Practice / Exercises tabs above all
three routes. This is also the fix for exercises having had no route into them.

**Navigation reports itself.** Internal links go through `AppLink`, which
carries a beacon reading Next's `useLinkStatus` and reporting into a small
module store. `RouteProgress` subscribes to that store and creeps a bar across
the top while any navigation is in flight. Every route also has a `loading.tsx`
skeleton, so a slow page shows its frame immediately instead of nothing.

**Motion is one primitive, used everywhere.** `<Rise>` fades and lifts content
into place; the shared easing and durations live beside it. There is no exit
animation, because exiting requires freezing the router against the page being
replaced, and the cost is not worth it for movement nobody waits to watch.

**Every animation asks about `prefers-reduced-motion` first.** Components read
it through `usePrefersReducedMotion`, and a global CSS rule collapses any
transition the components do not own.

## Alternatives

**`template.tsx` for page transitions.** Rejected. A template remounts on every
navigation, including switching between a topic's own tabs, so the tab bar that
is supposed to feel fixed would animate every time it was used. Per-page `Rise`
gives the same entrance where it is wanted and nowhere else.

**A CSS-only progress indicator.** Rejected. The pending window is between the
click and the server responding, which CSS cannot observe. `useLinkStatus` is
the only honest source for it.

**A component library.** Rejected. Six primitives cover the whole app
(`Button`, `Card`, `ProgressBar`, `StatusBadge`, `Skeleton`, `PageShell`) and
they are shorter than the configuration a library would need.

## Consequences

Server actions moved to `src/actions/`, since `src/app/(app)/topics/actions.ts`
is a worse import path than the colocation was worth.

Route-level `loading.tsx` means pages now stream in behind a skeleton. Two e2e
tests were reading a button with a non-retrying `isVisible()` immediately after
`goto`, and had to wait for the streamed card first. Anything else written the
same way will need the same treatment.

The shell queries the due count and streak on every page. It is deliberately a
cheaper query than the dashboard's, and `requireSession` is wrapped in React's
`cache` so the layout and the page it wraps share one session lookup.
