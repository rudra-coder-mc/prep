# 3. Drizzle rather than Prisma

**Status:** accepted — 2026-08-19

## Context

Postgres was settled. Prisma was the initial proposal; Drizzle was raised as the
alternative.

## Decision

Drizzle ORM with `drizzle-kit` for migrations.

## Rationale

The deciding argument is specific to this project rather than general. PostgreSQL
is on the learning track this platform exists to support, and Prisma's core value
proposition is abstracting SQL away. A tool built to help learn Postgres should
not insulate its author from Postgres. Drizzle queries read like SQL.

Secondary: no codegen step, so no `prisma generate` drift in CI and a simpler
Docker build. Smaller runtime. `drizzle-kit studio` covers the one thing Prisma
Studio would have been missed for — a GUI for inspecting one's own attempt data.

## Alternatives

**Prisma.** Rejected. Better relation ergonomics and more hand-holding around
migrations, but with six tables and simple queries that is insurance against
complexity this schema does not have.

**Raw SQL with a query builder only.** Rejected. Migrations and typed results are
worth an ORM's weight.

## Consequences

Relation queries are more verbose than Prisma's. Migrations are SQL files that
must actually be read before applying — which is the intended trade, not a cost.
