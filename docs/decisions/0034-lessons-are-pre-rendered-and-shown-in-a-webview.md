# 0034. Lessons are pre-rendered and shown in a WebView

Status: accepted
Date: 2026-08-30

## Context

The lesson is the most expensive thing in this project. Each one is MDX that
imports a library of animated components: `CodeWalkthrough`, `ScopeChain`,
`EventLoop`, `CallStack`, `MemoryModel`, `PrototypeChain`, `PromiseTimeline` and
the `ConceptMap` every lesson closes with. All of them are built on the DOM and
on `motion`, and none of them runs in React Native.

The mobile client has to show the same lessons, because the same content in a
different interface is the whole point of it. Nothing else in the app has this
problem. Questions, exercises, narration scripts and meta are plain data and
port to a native screen unchanged.

## Decision

Each lesson is compiled ahead of time into one self-contained HTML file and
shown in a WebView. A build step in `packages/content` compiles `lesson.mdx`
with `@mdx-js/mdx`, bundles it with the visual components through esbuild, and
writes one page per topic plus one shared runtime chunk into the content
archive. Everything else in the mobile app is native React Native.

The bridge across the WebView is deliberately small. React Native sends in the
heading slug the narration is currently on, and the colour theme. The page sends
back taps on internal links, so navigation stays native. State, audio and the
player itself all stay outside the WebView.

## Alternatives considered

**Port the visual library to Reanimated and `react-native-svg`.** It creates a
second animation library to maintain forever, and every new lesson would then
have to be authored twice. The visuals are the most expensive part of this
project, and duplicating them was never affordable.

**Snapshot the web app's own lesson route.** A rendered Next page references the
build's JavaScript chunks by URL, and the visuals need that JavaScript to run,
so the snapshot has to carry the chunk graph with it. It reuses more of what
exists and is harder to keep working.

**Show lessons as plain text on the phone.** The animation is the explanation. A
lesson without its visuals is a worse lesson than the one on the laptop, which
defeats the reason for building the app.

## Consequences

One implementation of the visuals, authored once as MDX, rendered the same on
both surfaces. Adding a topic stays what it is today: adding a directory.

The archive build needs neither the web app nor a database running, so building
what the phone reads is a content operation rather than a deployment.

The phone cannot restyle a lesson natively, so anything that has to look native
belongs outside the WebView. Two rendering models meet on one screen, and the
seam between them is the bridge. That is why the bridge carries four messages
and no state.
