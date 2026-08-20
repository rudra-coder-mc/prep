# Prep

A personal learning platform for technical interview preparation and skill refresh.

It is not a course. It is a loop: read a short animated explanation of one topic,
mark it learned, and from then on answer active-recall questions about it on a
schedule until you can explain and apply it without help. Every topic can also be
listened to, in a voice synthesised on the machine it runs on.

The JavaScript track covers twelve topics, in teaching order: types and
coercion, scope and hoisting, values and references, parameters and arguments,
closures, higher order functions, currying and partial application, `this` and
binding, prototypes, recursion and the call stack, the event loop and
microtasks, and promises with async/await. Each has an animated lesson, ten or
eleven questions in the forms interviews actually use, and two practical
exercises. The remaining groups needed for full interview coverage are listed
in `TASKS.md`.

The architecture supports adding TypeScript, React, Next.js, Node, Express,
NestJS, MongoDB and PostgreSQL later without schema changes. Adding a topic is
adding a directory under `content/`.

## Running it

```bash
docker compose up
```

Then open http://localhost:3000 and log in with the seeded credentials
(`dev@prep.test` / `dev`, overridable in `.env`).

Nothing else to install. Postgres, the migrations and the seed user are all
handled inside the stack, and that stack is two containers: the app and the
database.

The speech engine is not one of them. Every narration script already has a
recording, so nothing has to be synthesised while you listen, and a voice model
sitting in memory to serve nothing is load for no reason. It starts only when
`npm run narration:build` needs it and stops again afterwards. That first run
builds its image, which downloads the voice model and takes a few minutes.

## Writing content or changing the app

```bash
npm run dev:docker
```

Short for `docker compose -f compose.yaml -f compose.dev.yaml up`. Same stack
with `content/`, `src/` and `public/` bind-mounted and hot reload on, so editing
a lesson or a component shows up immediately.

Plain `docker compose up` runs the built image and does not pick up edits. Use
this profile while working, that one to just use the platform.

Anything outside those three directories is baked into the image, so changing
`package.json`, `next.config.ts` or the Dockerfile needs `--build`:

```bash
npm run dev:docker -- --build
```

## How it fits together

- `content/<technology>/<topic>/` is the curriculum. An MDX lesson with its
  questions and exercises beside it, version-controlled rather than stored in
  the database.
- `src/components/visuals/` is the reusable animation library the lessons import.
- `src/app/(app)/` is everything behind the login, under one persistent top bar.
- `src/components/{chrome,ui,motion}/` are the shell, the UI primitives, and the
  single entrance animation the whole app uses.
- `src/db/` holds the Drizzle schema and migrations. It stores users and their
  progress, nothing else.
- `src/lib/speech/` turns a narration script into audio and caches it by content.
  `services/tts/` is the Piper container it talks to, and no text leaves the
  machine. `npm run narration:build` makes every recording ahead of time, so no
  lesson is ever synthesised while somebody is waiting for it. That command is
  also the only thing that runs the container: it is behind a compose profile
  and is off the rest of the time.
- `src/components/speech/` is the player on a topic page. It reads that topic's
  `narration.ts` aloud a section at a time.

See `docs/architecture.md` for the full picture and `docs/decisions/` for why
it is shaped this way.
