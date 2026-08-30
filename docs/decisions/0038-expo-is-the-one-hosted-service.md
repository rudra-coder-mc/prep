# 0038. Expo is the one hosted service this project uses

Status: accepted
Date: 2026-08-30

## Context

`CLAUDE.md` states a hard rule: nothing about this project goes to an external
service. No git remote, no CI, no hosted tracker. The rule has one escape, which
is a personal account named explicitly rather than inferred.

Turning the Expo app into an installable APK has to happen somewhere. Doing it
on the laptop means installing the Android SDK, the build tools and a signing
setup that serves nothing else in this project.

## Decision

The mobile app is developed in Expo Go and built into an APK by EAS Build on
Atul's personal Expo account. The APK is downloaded and sideloaded onto the
phone. This names Expo, and Expo only.

What leaves the machine is application source. What does not leave it: the
curriculum, because `.easignore` excludes `content/` and the built archive; the
recordings, which are not in the repository; and all progress, which is in
Postgres.

Excluding the curriculum is only possible because the archive is not baked into
the APK. The phone logs in against the server and downloads the archive on first
run, which it has to reach the server for in any case.

## Alternatives considered

**Local Gradle builds.** An afternoon of Android SDK and signing setup, plus the
maintenance of it, for no capability this project can use. Every module the app
needs is already in the Expo SDK.

**A development build instead of Expo Go.** Expo Go already ships SQLite, the
WebView, the filesystem, secure storage and audio, which is this whole app. This
is worth revisiting only if a module outside the Expo SDK is ever needed.

**No mobile app.** That is the thing being built.

## Consequences

No Android toolchain on the laptop, and one hosted account in a project that had
none. The rule in `CLAUDE.md` is now "one named service" rather than "none",
which is a weaker rule and worth noticing rather than burying.

Local notifications are the one thing Expo Go is unreliable about on Android, so
the daily reminder is verified on a real build rather than in the development
loop.

Builds are occasional, so a queue on a free tier is not a constraint.

If Expo ever becomes unacceptable, local Gradle builds are the fallback. That
costs setup time, not a redesign.
