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

## Running it locally

```bash
docker compose up
```

Then open http://localhost:3000 and log in with the seeded credentials
(`dev@prep.test` / `dev`, overridable in `.env`).

Nothing else to install. Postgres, the migrations and the seed user are all
handled inside the stack, and that stack is two containers: the app and the
database.

The speech engine is kept behind a compose profile (`speech`), so the neural
voice model does not consume memory while doing other work. The commands that
need it start it themselves, or you can start it explicitly with:
`docker compose up -d tts` (or `docker compose --profile speech up`). Its first
start builds the image, downloads the voice model, and takes a few minutes.

Without it running, a topic plays whatever is already in `.speech-cache` and
reports the voice as unavailable for un-synthesized lines.

Commands that manage narration:

```bash
npm run narration:build -- javascript            # record a whole track ahead of time
npm run narration:build -- javascript/closures   # or one topic of it
npm run speech:prune                             # delete orphaned recordings
```

### Packaging content for mobile

One command builds what the phone reads, needing neither the app nor the database:

```bash
npm run content:archive                          # every topic, plus pre-rendered lesson pages
```

It writes `.content-archive/`: the entire curriculum as JSON, pre-rendered lesson
pages, shared scripts/styles, and `archive.zip` which the mobile device downloads.
The version is a content hash of the files it was built from. Run this command
whenever you edit or add lesson content so the mobile app can download the updates.

Audio is served separately via `/api/device/audio/<key>`, downloading on demand
track-by-track rather than inside the archive zip.

## Writing content or changing the app

```bash
npm run dev:docker
```

Short for `docker compose -f compose.yaml -f compose.dev.yaml up`. Runs the stack
with the app sources, shared packages, and curriculum bind-mounted with hot
reloading enabled. Edits to lessons, questions, or web components reflect immediately.

## The mobile app (Offline-First)

The mobile app (`apps/mobile`) exists so you **do not need an always-on server or
always-on Docker container**. The desktop workstation acts as the single source
of truth on demand, and the mobile app is completely offline-first:

1. **Start Docker on your PC**: Run `docker compose up` on your workstation.
2. **Connect over Local Wi-Fi**: Open the mobile app (or `npm run mobile` for Expo Go)
   on your phone connected to the same Wi-Fi network as your PC.
3. **Log in**: Enter your PC's local network IP and port (e.g., `http://192.168.1.50:3000`)
   along with your login credentials.
4. **Download curriculum & audio**: The mobile app fetches `archive.zip` and caches
   audio locally.
5. **Use offline anywhere**: Shut down Docker on your PC. The phone holds the entire
   curriculum, pre-rendered lesson WebViews, and spaced-repetition schedules in
   local SQLite. You can study, read, and answer recall questions on the go with zero
   network connection.
6. **Sync progress**: Whenever you want to sync your answered questions and progress
   back to your PC (or fetch newly added lessons), simply start Docker on your PC,
   open the mobile app on your local Wi-Fi, and it syncs bidirectionally.

There are no remote servers, no cloud VMs, and no VPN/Tailscale networks required.

### Building the APK

```bash
cd apps/mobile
eas build --platform android --profile production
```

Builds an installable APK for Android using EAS Build. Once completed, download
the generated `.apk` and sideload it directly onto your Android device.

## How it fits together

The repository is an npm workspace with four members, sharing logic without duplication:

- `packages/core/`: The platform core: interval ladder, tiers, readiness, daily
  queue calculations, grading, and content schemas. Pure functions over data rows
  with zero DB or DOM dependencies, shared identically by web and mobile.
- `packages/content/`: Curriculum definitions, loader, and validator.
  `content/<technology>/<topic>/` holds MDX lessons, questions, and coding exercises.
- `apps/web/`: Next.js 15 application handling Postgres, authentication, the
  desktop browser interface, and device API endpoints (`/api/device/*`).
- `apps/mobile/`: Expo / React Native Android app. Completely offline-first with
  local SQLite storage mirroring progress tables, pre-rendered lesson WebView bridge,
  and local spaced-repetition loop.
- `packages/content/src/archive/`: Compiles and bundles curriculum content and
  pre-rendered lesson pages into `.content-archive/archive.zip`.
- `apps/web/src/components/visuals/`: Interactive animation library imported by
  lessons and bundled into the mobile archive pages.
- `services/tts/`: Piper neural TTS service running locally in Docker to
  synthesize audio narration into `.speech-cache/`.

See `docs/architecture.md` for architecture details and `docs/decisions/` for ADRs.
