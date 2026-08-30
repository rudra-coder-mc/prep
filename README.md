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

Every topic in both has an animated lesson, eleven to fifteen questions in the
forms interviews actually use, and two practical exercises.

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

The speech engine is not one of them. On a laptop it stays behind a compose
profile, so a voice model does not sit in memory while you work on something
else, and the commands that need it start it themselves. On the machine that
serves the platform it runs with the app, because that is where recordings are
made. Its first start builds the image, which downloads the voice model and
takes a few minutes.

Without it, a topic plays whatever is already in `.speech-cache` and says the
voice is unavailable for the rest. To listen while you write, start it:
`docker compose up -d tts`.

Two commands act on that cache directly, and nothing depends on either:

```bash
npm run narration:build -- javascript            # record a whole track ahead of time
npm run narration:build -- javascript/closures   # or one topic of it
npm run speech:prune                             # delete what no script says any more
```

One more command builds what the phone reads, and it needs neither the stack nor
the database running:

```bash
npm run content:archive                          # every topic, plus a lesson page each
```

It writes `.content-archive/`: the whole curriculum as one JSON file, one
pre-rendered lesson page per topic, and the chunk and stylesheet those pages
share. The version it prints is a hash of the files it was built from, and that
is what a device compares to decide whether to refresh. Audio is not in it.

## Running it on the machine that serves it

The platform also runs on a spare Ubuntu machine, `work`, published at
<https://work.tailba5bc0.ts.net>. To send it what is in the working tree:

```bash
npm run deploy
```

That rsyncs the tree over Tailscale, rebuilds the image with the speech profile
on, and waits until both the app and the voice answer again. `.speech-cache` and
`.env` stay here. The server records what it is asked for, and keeps its own
`.env`, holding the public URL, its auth secret and the login password.

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
with the app's sources, the shared packages and the curriculum bind-mounted and
hot reload on, so editing a lesson or a component shows up immediately.

Plain `docker compose up` runs the built image and does not pick up edits at
all. Use this profile while working, that one to just use the platform, and
`docker compose up --build` after changing code you want the plain profile to
serve.

Plain `docker compose up` runs the image as it was last built, so anything
changed since then needs `--build`. Under this profile that is only the
manifests, `apps/web/next.config.ts` and the Dockerfile, since the source
directories are mounted:

```bash
npm run dev:docker -- --build
```

## How it fits together

The repository is an npm workspace with three members, so the phone can share
the logic that decides when a question is due rather than reimplementing it. See
`docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md`.

- `packages/core/` is the definition of the platform: the interval ladder, what
  a tier covers, readiness, the daily queue, grading, and the schema the content
  is written against. Pure functions over rows, with no database, DOM or
  filesystem anywhere in it.
- `packages/content/` is the curriculum and the code that reads it.
  `content/<technology>/<topic>/` holds an MDX lesson with its questions and
  exercises beside it, version-controlled rather than stored in the database.
- `apps/web/` is the Next application: everything that touches Postgres,
  better-auth or the DOM.
- `packages/content/src/archive/` builds the content archive: the curriculum as
  data, and every lesson compiled into a page that opens on its own. It bundles
  the web app's own lesson components rather than a copy of them, so a lesson
  reads the same on both surfaces. See
  `docs/decisions/0039-the-archive-bundles-the-web-apps-lesson-components.md`.
- `apps/web/src/components/visuals/` is the reusable animation library the
  lessons import, and the one the archive compiles into its pages.
- `apps/web/src/app/(app)/` is everything behind the login, under one persistent
  top bar.
- `apps/web/src/components/{chrome,ui,motion}/` are the shell, the UI
  primitives, and the single entrance animation the whole app uses.
- `apps/web/src/db/` holds the Drizzle schema and migrations. It stores users
  and their progress, nothing else.
- `apps/web/src/lib/speech/` turns a narration script into audio and caches it
  by content. `services/tts/` is the Piper container it talks to, and no text
  leaves the machine. A recording is made the first time it is asked for and
  kept for good, addressed by a hash of the words, so a page asks for audio with
  a key and the server turns that key back into the script.
- `apps/web/src/components/speech/` is the player on a topic page, which reads
  that topic's `narration.ts` aloud a section at a time, and the speaker button
  on a question, which reads the prompt and then the answer once it has been
  given.

See `docs/architecture.md` for the full picture and `docs/decisions/` for why
it is shaped this way.
