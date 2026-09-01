# 0045. The lesson bridge is built into the page

Status: accepted
Date: 2026-08-31

## Context

A lesson on the phone is a pre-rendered page in a WebView with the player and
the navigation native around it, and the two halves talk over a bridge of four
messages and no state (`0034`). This is about where the page's half of that
bridge lives, which `0034` left open.

Two of the four messages are more than plumbing. The app says which heading the
narration is on, and the page has to light up that section of the lesson and
scroll to it. That marking is a DOM walk from one heading to the next, because
MDX renders a lesson as a flat run of elements with nothing wrapping a section
(`0018`). The web app already has that walk, in
`apps/web/src/components/speech/narrated-section.ts`, and the whole point of
pre-rendering the lesson rather than porting the visuals is that the two surfaces
read the same because they run the same code.

The app could inject the bridge instead: `injectJavaScript` takes a string, so
the phone could carry its own copy of the walk and hand it to any page it opens.

## Decision

**The bridge is compiled into the page.** `lesson-bridge.ts` is bundled into the
shared chunk every lesson page loads, and it imports the web app's own
`markNarratedSection` the same way the page imports the web app's own component
map (`0039`). A page opened outside the app finds no `ReactNativeWebView`, opens
no bridge and behaves exactly as it did before.

**The protocol is a leaf both ends import.** `bridge.ts` holds the message
shapes, the name the page hangs its controls on, and the scripts the app injects.
It imports nothing, so the phone can take it without taking a filesystem with it,
and neither end can rename a message without the other following.

**The page's own sources count in the archive version.** `LESSON_SOURCES` in
`web-sources.ts` now names the runtime, the bridge and the protocol beside the
component map and the visuals, so a change to any of them is a new version and a
device refreshes.

## Alternatives considered

**Inject the bridge from the app as a string.** It would leave the archive
untouched and let a bridge be fixed by shipping an app rather than rebuilding
content. It also means a second copy of the section walk, written as an
unchecked, untested string, drifting from the one the web renders with. The one
thing this bridge exists to do is make the phone follow the voice the way the
laptop does, so a second copy of that walk defeats it.

**Keep the runtime out of the version hash.** It was already out, and that was a
latent bug rather than a decision: editing the file that mounts every lesson
changed every page and no device would have refreshed.

## Consequences

A change to the bridge is a content rebuild and a refresh on every device, not
an app update. That is the right cost for something that changes what a page
does, and it is the same cost a change to a visual component already carries.

The page's script is a module, and a WebView opening it from a `file://` address
refuses to fetch a module unless it is told a file may read one. The lesson
screen therefore sets `allowFileAccess`, `allowFileAccessFromFileURLs` and
`allowUniversalAccessFromFileURLs`. The failure this guards against is silent:
the page loads, the module does not, and the lesson is blank.

The archive can be opened in a browser as well as on a phone, which is how the
bridge was verified: a page served over HTTP with a stub `ReactNativeWebView` on
it runs the same code the WebView runs.
