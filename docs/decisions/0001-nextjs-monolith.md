# 0001. One Next.js application, not a split frontend and backend

**Status:** accepted, 2026-08-19

## Context

The platform needs a web interface, persistence, and authentication. The
long-term learning tracks include NestJS, so there was an argument for building
a separate NestJS API to get practice with it.

## Decision

A single Next.js application using the App Router. Server Components read data
directly; Server Actions write it. No separate API service.

## Alternatives

**Next.js frontend + NestJS API.** Rejected. It is a more "production" shape and
would double as NestJS practice, but it means two services, two deployments, two
sets of CI, and a network boundary with serialisation on both sides, all for an
application with one user. The NestJS practice is better served by a project
where a separate API is actually warranted.

**Server-rendered app without Next.js.** Rejected. The animated visual layer is
central to this product and is React work regardless, so a React framework is the
baseline.

## Consequences

One repository, one image, one deploy. Data access is not reusable by a future
mobile client without extracting it, which is fine, since mobile is explicitly
out of scope. Building on Next.js and Postgres also means the tool exercises two of the
technologies it exists to teach.
