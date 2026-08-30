# 0040. A device carries its session in a header

Status: accepted
Date: 2026-08-30

## Context

The web signs in with better-auth in a browser, and better-auth keeps the
session in an httpOnly cookie (`0004`). A phone has no browser and no cookie
jar. It needs a credential it can store itself, send on every request, and keep
using for months without a second login, because the loop it serves runs mostly
with the server switched off (`0033`).

Two things about that credential were already settled. Sessions last thirty
days and move their expiry forward on use, so a device in daily use never signs
in twice. A device that goes thirty days without reaching the server costs one
login, which is acceptable because reading and answering never stop.

## Decision

A device holds a better-auth session token and sends it as
`Authorization: Bearer <token>`. better-auth's `bearer` plugin turns that header
into the session cookie the rest of better-auth already understands, so every
endpoint keeps the session check it has.

`/api/device/session` is where a device gets that token and where it asks
whether the token is still good.

- `POST` takes an email and a password and answers with the token, the expiry,
  and the account.
- `GET` takes the token and answers with the expiry and the account. Answering
  moves the expiry forward, which is the whole of what keeps a device signed in.
  A device that sees a 200 has nothing to store: the token never changes.
- Either verb answers 401 once the token is unknown or expired.

better-auth's own sign-in endpoint checks the password, reached from the server
rather than copied beside it. A device therefore gets the same treatment the
browser does, including the rate limit better-auth puts on sign-in in
production, and one place in the app is the only place a credential is ever
verified. What differs is the answer. The browser gets a cookie, and a device
gets the token to hold itself.

The `bearer` plugin also copies the token into a `set-auth-token` response
header on every response that issues a session. `/api/auth/[...all]` strips that
header, because the browser's session is httpOnly so that no script on the page
can read the token, and a copy in a readable header gives it back. The one
caller that wants the header is the device endpoint, which reads it server-side.

The middleware changed too. It refused any API request without a session cookie,
which is every request a device makes. It now lets an API request carrying an
`Authorization` header through to the endpoint, and the endpoint decides whether
the token is any good. The middleware stays what it was, a cheap gate that
guesses and never decides.

Nothing new is stored. A device session is a row in `session`, the same as a
browser's.

## Alternatives considered

**An API key per device, in a table of its own.** A second credential type to
issue, store, expire, and revoke, and a second path through every session check.
better-auth already has a session with the lifetime this needs.

**A short access token with a long refresh token.** The pair exists to keep a
stolen access token useful for minutes rather than months. It buys that by
adding a rotation step every client must implement and every server must handle
being interrupted halfway through. There is one user, one account, and a tailnet
between the phone and the server. The rolling thirty-day session gives the same
"stays signed in" behaviour with nothing to rotate.

**Sending the session cookie by hand from the app.** It works, and it makes
every request depend on the app spelling a cookie the way better-auth writes it.
The `bearer` plugin is the supported way to say the same thing.

**Leaving the middleware alone and putting device endpoints outside `/api/`.**
It avoids touching a file every request runs through, and it splits the app's
endpoints across two prefixes by an accident of authentication.

## Consequences

Every existing endpoint accepts a device with no change, because the plugin
resolves the header before the session check runs. Tasks 26 and 27 add endpoints
that authenticate the same way as the three speech endpoints already do.

The middleware no longer refuses an API request on the strength of a missing
cookie. Every API route verifies its own session, so nothing was relying on it
to do that, but a route added later must not rely on it either.

A stolen token is a stolen session for up to thirty days, and there is nothing
in the app to revoke one with. Deleting the row in `session` is the way, and
that is a database command rather than a screen. Worth building only when a
device is actually lost.

The rate limit on sign-in is better-auth's, and better-auth turns it on in
production only. The device endpoint inherits that exactly, including the part
where development has no limit at all. No test covers it, because there is no
way to switch it on for one test without changing what the app is configured to
do.
