# Prep

A personal learning platform for technical interview preparation and skill refresh.

It is not a course. It is a loop: read a short animated explanation of one topic,
mark it learned, and from then on answer active-recall questions about it on a
schedule until you can explain and apply it without help. Every topic can also be
listened to, in a voice synthesised on the machine it runs on.

The JavaScript track covers thirty-nine topics, in teaching order: types and
coercion, scope and hoisting, values and references, destructuring, optional
chaining and nullish handling, parameters and arguments, closures, higher order
functions, array methods, currying and partial application, `this` and binding,
strict mode and `globalThis`, prototypes, property descriptors and accessors,
class syntax, `extends` and `super`, static and private members, composition
against inheritance, iterables and the iteration protocol, generators, `Map` and
`Set`, what a collection operation costs, JSON serialisation, recursion and the
call stack, garbage collection and the shapes of a leak, weak references,
throwing and catching, error objects and the built-in types, custom error types,
the event loop and microtasks, debounce and throttle, promises with async/await,
promise combinators, async error handling, `AbortController`, async iteration,
ES modules against CommonJS, module resolution and side effects, and what a
bundler changes.

The browser track covers four more: the DOM, events and delegation, `fetch` and
the network, and storage. They are a separate track because none of them is the
language. `document`, `addEventListener`, `fetch` and `localStorage` come from
the browser rather than from any JavaScript engine, and they belong equally to a
future React track. Preparing for a front end interview means both tracks. See
`docs/decisions/0027-the-browser-is-its-own-track.md`.

Every topic in both has an animated lesson, ten or eleven questions in the forms
interviews actually use, and two practical exercises.

The architecture supports adding TypeScript, React, Next.js, Node, Express,
NestJS, MongoDB and PostgreSQL later without schema changes. Adding a topic is
adding a directory under `content/`, and adding a track is the same thing.

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

## Running it on the machine that serves it

The platform also runs on a spare Ubuntu machine, `work`, published at
<https://work.tailba5bc0.ts.net>. To send it what is in the working tree:

```bash
npm run deploy
```

That rsyncs the tree over Tailscale, rebuilds the image, and waits until the app
answers again. Narration ships with it, `.env` does not: the server keeps its
own, holding the public URL, its auth secret and the login password.

The URL is fixed. It comes from the machine name and the tailnet name, so it
survives reboots and deploys, and the certificate is Tailscale's to renew.

That address is on the public internet, and the single seeded account is the
only thing in front of the data. `sudo tailscale funnel --https=443 off` on the
machine unpublishes it. See
`docs/decisions/0026-the-platform-is-served-from-one-machine-over-tailscale.md`.

## Writing content or changing the app

```bash
npm run dev:docker
```

Short for `docker compose -f compose.yaml -f compose.dev.yaml up`. Same stack
with `content/`, `src/` and `public/` bind-mounted and hot reload on, so editing
a lesson or a component shows up immediately.

Plain `docker compose up` runs the built image and does not pick up edits at
all, including edits to `src/`. Use this profile while working, that one to just
use the platform, and `docker compose up --build` after changing code you want
the plain profile to serve.

Plain `docker compose up` runs the image as it was last built, so anything
changed since then needs `--build`. Under this profile that is only
`package.json`, `next.config.ts` and the Dockerfile, since the other three
directories are mounted:

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
- `src/components/speech/` is the player on a topic page, which reads that
  topic's `narration.ts` aloud a section at a time, and the speaker button on a
  question, which reads the prompt and then the answer once it has been given.

See `docs/architecture.md` for the full picture and `docs/decisions/` for why
it is shaped this way.
