# Prep

A personal learning platform for technical interview preparation and skill refresh.

It is not a course. It is a loop: read a short animated explanation of one topic,
mark it learned, and from then on answer active-recall questions about it on a
schedule until you can explain and apply it without help.

V1 covers JavaScript only. The architecture supports adding TypeScript, React,
Next.js, Node, Express, NestJS, MongoDB and PostgreSQL later without schema changes.

## Running it

```bash
docker compose up
```

Then open http://localhost:3000 and log in with the seeded credentials
(`dev@local` / `dev`, overridable in `.env`).

Nothing else to install. Postgres, migrations and the seed user are handled
inside the stack.

## Writing content

```bash
docker compose -f compose.yaml -f compose.dev.yaml up
```

Same stack with `content/` and `src/` bind-mounted and hot reload enabled, so
editing a topic shows up immediately without rebuilding the image.

## How it fits together

- `content/<technology>/<topic>/` — the curriculum. MDX lesson plus colocated
  questions and exercises. Version-controlled, not in the database.
- `src/components/visuals/` — the reusable animation library the lessons import.
- `src/db/` — Drizzle schema and migrations. Stores users and their progress only.

See `docs/architecture.md` for the full picture and `docs/decisions/` for why
it is shaped this way.
