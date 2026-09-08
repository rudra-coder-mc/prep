# 0049. Local workstation server and offline-first mobile sync over local Wi-Fi

Status: accepted
Date: 2026-09-08

## Context

`0026` introduced a remote Ubuntu machine (`work`), publishing the web stack over Tailscale Funnel and deploying via `scripts/deploy.sh` over Tailscale.

In practice, the platform does not use any remote live server, cloud deployment, or Tailscale network. Atul works entirely on a personal local workstation and does not want an always-on server or always-on Docker containers running in the background.

The mobile application (`apps/mobile`) was created specifically so that the full curriculum, lesson pages, and spaced-repetition questions can be used anywhere offline without keeping the desktop server running.

## Decision

1. **Remove Tailscale, Remote Deployments, and Deployment Scripts**:
   - Supersede `0026`. There is no remote Ubuntu machine, no Tailscale network, and no Tailscale Funnel.
   - Delete `scripts/deploy.sh` and remove the `deploy` npm script from `package.json`.
   - Remove remote deployment references across documentation, `compose.yaml`, and the codebase.

2. **On-Demand Local Docker Stack**:
   - The platform runs strictly on Atul's local workstation via Docker (`docker compose up`) when needed.
   - Speech synthesis (TTS) remains an on-demand service behind a compose profile (`speech`).

3. **Offline-First Mobile Loop via Local Wi-Fi**:
   - When new content is available or the user wants to sync progress:
     1. Start the Docker container on the local workstation.
     2. Connect the mobile device to the workstation over local Wi-Fi by entering the local IP (e.g. `http://192.168.1.50:3000`).
     3. Download the content archive (`archive.zip`) and audio recordings.
     4. Shut down Docker.
   - The user studies lessons, listens to audio, and completes active recall reviews 100% offline on mobile.
   - When the user wants a new session or to persist progress back to the database, they turn on Docker locally, connect over Wi-Fi, and the mobile app syncs bidirectionally.

## Consequences

- No external or always-on infrastructure overhead.
- No risk of unauthenticated exposure on the public internet via Tailscale Funnel.
- Clean separation between on-demand local host operations and offline mobile learning.
