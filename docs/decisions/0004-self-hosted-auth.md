# 0004. better-auth, not Clerk or WorkOS

**Status:** accepted, 2026-08-19

## Context

Auth should not be built from scratch. Clerk and WorkOS were considered as the
"just use an existing solution" answer.

## Decision

better-auth, self-hosted, email and password. One user seeded from environment
variables at container start. No public signup.

## Rationale

A hosted provider makes a self-hosted personal tool depend on a third-party
service. It stops working during their outage or when offline, and login data
leaves the server the user administers. Neither provider solves a problem this
project has. Their real value is social login, organisations, SSO and user
management at scale, none of which are in scope.

better-auth is still an existing solution. Auth is configured, not written. It
owns its own tables, session handling and password hashing. Its Drizzle adapter
is first-class, which matters given decision 0003.

## Alternatives

**Clerk / WorkOS.** Rejected. An external dependency and off-server credentials
for no capability gain. Cost was not the deciding factor; both have adequate free
tiers.

**Auth.js (NextAuth v5).** Reasonable and more battle-tested, with a larger
ecosystem. Rejected on developer experience. Its credentials flow is more
awkward, and v5 has rougher edges than better-auth's Drizzle integration.

**Hand-rolled sessions.** Rejected. Session handling, CSRF and password storage
are exactly the things not worth getting subtly wrong.

## Consequences

Everything runs on the user's own server with no external calls in the auth path.
Every progress table carries `userId`, so the schema is already
multi-user-shaped. If social login or real multi-user is ever wanted, it is an
auth-layer swap rather than a data migration.
