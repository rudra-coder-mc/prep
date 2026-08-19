# 6. `docker compose up` is the only setup step

**Status:** accepted — 2026-08-19

## Context

The platform must not become a project that consumes the learning time it exists
to support. Anything that has to be set up before studying is friction at exactly
the wrong moment.

## Decision

`docker compose up` brings up Postgres and the application and serves a usable
web interface with no other action required.

- Postgres with a named volume and a healthcheck; the app waits for it, so there
  is no first-boot race.
- The app entrypoint applies migrations and seeds the user if absent. Both are
  idempotent and safe on every restart.
- Working defaults for the database password, auth secret and seed credentials
  ship in the compose file, so the stack runs with zero files created. `.env`
  overrides them for the server.
- Content is baked into the image at build time, so there is no content seeding
  step at runtime.

A second compose file, `compose.dev.yaml`, overlays the run profile with
`content/` and `src/` bind-mounted and hot reload enabled.

## Alternatives

**Single compose profile.** Rejected. Content authoring is the most frequent
activity in this project's life; rebuilding an image to preview a paragraph is
not viable.

**Migrations as a separate one-shot service.** Rejected. It makes the happy path
two commands instead of one, for a stack with a single application container.

## Consequences

Two commands total: one to use the platform, one to write content. Node and
Postgres never need to be installed on the host.

Default credentials in a committed file are safe on a private network and must be
overridden before the platform is exposed. The README says so, and the seed step
warns at startup when defaults are still in use.
