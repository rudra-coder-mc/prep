#!/bin/sh
# Sends the working tree to the machine that serves this app and restarts the
# stack there. `npm run deploy`.
#
# rsync rather than git, because this repo has no remote and is not getting one,
# so there is nothing on the other side to pull from. The transfer goes over
# Tailscale, so the two machines need no open ports and no key management.
#
# The narration cache stays here. It is gitignored, around 400 MB, and no longer
# something the server needs handed to it: audio is made the first time it is
# asked for, so the server records what it is asked for and nothing else. What
# this used to ship was mostly recordings of text nobody had played. See
# docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
#
# .env is excluded in both directions. The server's copy holds the public URL,
# its own auth secret and the shared password, and none of that belongs in this
# tree. Excluded paths are also protected from --delete.
set -e

HOST="${PREP_HOST:-work@work}"
DIR="${PREP_DIR:-prep}"
URL="${PREP_URL:-https://work.tailba5bc0.ts.net}"

echo "copying to $HOST:$DIR"
rsync -a --delete \
  --exclude .env \
  --exclude .env.local \
  --exclude node_modules \
  --exclude .next \
  --exclude coverage \
  --exclude test-results \
  --exclude playwright-report \
  --exclude e2e/.auth \
  --exclude .speech-cache \
  --exclude .speech-cache-e2e \
  --exclude .DS_Store \
  ./ "$HOST:$DIR/"

# --profile speech, because on the server the speech engine is part of the stack
# rather than a tool: audio is made the first time it is asked for, so a play
# button only works if the voice is running. See
# docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
echo "rebuilding the stack"
ssh "$HOST" "cd '$DIR' && docker compose --profile speech up -d --build"

# The image is rebuilt on every deploy, so the app is down for as long as the
# build takes. Nothing here should report success before it is answering again.
printf 'waiting for the app'
tries=0
until ssh "$HOST" 'curl -sf -o /dev/null http://127.0.0.1:3000/'; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo ' failed'
    echo "the app did not come back up. logs: ssh $HOST 'docker logs prep-app-1'" >&2
    exit 1
  fi
  printf '.'
  sleep 2
done
echo ' ready'

# The voice model takes about half a minute to load, and the app is usually
# answering before it has. A deploy is not a failure without it, since every
# page still works, so this reports rather than exits: what it catches is an
# engine that never came up, which otherwise shows up as every play button
# saying the voice is unavailable.
printf 'waiting for the voice'
tries=0
voice=''
until ssh "$HOST" 'curl -sf -o /dev/null http://127.0.0.1:5001/info'; do
  tries=$((tries + 1))
  if [ "$tries" -ge 30 ]; then
    voice=missing
    break
  fi
  printf '.'
  sleep 2
done

if [ -n "$voice" ]; then
  echo ' not answering'
  echo "nothing can be listened to. logs: ssh $HOST 'docker logs prep-tts-1'" >&2
else
  echo ' ready'
fi

# Funnel config survives reboots and deploys, so this only ever reports what is
# already true. It is here because a deploy that quietly landed behind a dead
# URL looks identical to one that worked.
if ssh "$HOST" 'tailscale funnel status' 2>/dev/null | grep -q 'Funnel on'; then
  echo "live at $URL"
else
  echo "the app is up but nothing is published. run: ssh $HOST 'sudo tailscale funnel --bg 3000'" >&2
fi
