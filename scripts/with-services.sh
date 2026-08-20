#!/bin/sh
# Ensures the services the integration tests talk to are up, then runs the given
# command pointed at them. Those tests need a real Postgres and a real speech
# engine, and compose already knows how to provide both.
#
# The speech engine is behind a compose profile and is off the rest of the time,
# so this starts it, waits for the voice model to load, and stops it again on
# the way out. Naming a profiled service on the command line is enough to start
# it. See docs/decisions/0020-the-speech-engine-runs-on-demand.md.
#
# The first run builds the speech image, which downloads a voice model and takes
# a few minutes. Every run after that starts it in seconds.
set -e

docker compose up -d db tts >/dev/null
trap 'docker compose stop tts >/dev/null 2>&1' EXIT INT TERM

printf 'waiting for postgres'
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-prep}" -d "${POSTGRES_DB:-prep}" >/dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo ' ready'

DATABASE_URL="postgres://${POSTGRES_USER:-prep}:${POSTGRES_PASSWORD:-prep}@localhost:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-prep}"
export DATABASE_URL

printf 'waiting for the speech engine'
until curl -sf "http://127.0.0.1:${TTS_PORT:-5001}/info" >/dev/null 2>&1; do
  printf '.'
  sleep 2
done
echo ' ready'

SPEECH_SERVICE_URL="http://127.0.0.1:${TTS_PORT:-5001}"
export SPEECH_SERVICE_URL

# Not exec, because the trap above has to survive the command finishing.
"$@"
