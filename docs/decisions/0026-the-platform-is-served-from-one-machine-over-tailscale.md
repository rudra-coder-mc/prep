# 0026. The platform is served from one machine, published over Tailscale

## Status

Accepted.

## Context

The stack ran on the laptop it was written on, reachable at `localhost:3000` and
nowhere else. Two things needed more than that: using the platform without the
laptop being the machine in front of you, and showing it to somebody.

The constraint in `CLAUDE.md` still holds. This project does not go on company
infrastructure, and it does not go on a hosted service nobody named. That rules
out a deploy target and a CI pipeline, but not a second machine on the desk.

## Decision

**A spare Ubuntu machine on the LAN runs the stack, and Tailscale carries
everything to and from it.**

Three roles, one connection:

- **Tailscale SSH** is the shell into the machine. No keys to distribute, no
  port 22 open to the LAN, and the tailnet decides who gets in.
- **`npm run deploy`** rsyncs the working tree over and rebuilds the stack.
- **Tailscale Funnel** publishes port 3000 at `https://work.tailba5bc0.ts.net`,
  with a certificate Tailscale obtains and renews.

The address is derived from the machine name and the tailnet name, so it is
stable across reboots and deploys. The serve configuration lives in
`tailscaled`'s state, not in this repo.

## Alternatives considered

**A git remote on the serving machine, deployed by push.** The obvious shape,
and it moves the source but not `.speech-cache`, which is gitignored, 400 MB,
and the difference between lessons that can be listened to and lessons that
cannot. It would need rsync beside it anyway, so rsync alone is one mechanism
instead of two.

**Port forwarding on the router with a dynamic DNS name.** Opens the home
network to the internet, needs certificates obtained and renewed by hand, and
the address moves when the ISP says so.

**A cheap VPS.** A hosted service, which the project rules exclude, and it puts
the database somewhere other than the machine in the room.

## Consequences

The published URL is public. Anyone holding it reaches the login page, and the
seeded password is the only thing in front of the data. `sudo tailscale funnel
--https=443 off` takes it down, and `tailscale serve` is the same thing limited
to the tailnet.

Signup is disabled and there is one seeded account, so everybody who opens the
link is the same user and shares one progress record. That is acceptable for
showing the platform to somebody and is not acceptable for a second person
learning on it. Multiple accounts is a change to make before the link is shared
with anyone who intends to use it.

The serving machine holds the only copy of that database. It is a container
volume on one desktop with no backup, so progress recorded there is lost with
the disk.

There is no pipeline between the working tree and the machine. `npm run deploy`
copies whatever is in the tree, committed or not, which is the tradeoff a
one-person project makes for one command that always works. `npm run verify`
before deploying is what stands in for CI.
