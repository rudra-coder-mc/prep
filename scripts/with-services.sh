#!/bin/sh
# Ensures the services the integration tests talk to are up, then runs the given
# command pointed at them. Those tests need a real Postgres and a real speech
# engine, and compose already knows how to provide both.
#
# The first run builds the speech image, which downloads a voice model and takes
# a few minutes. Every run after that starts it in seconds.
set -e

docker compose up -d db tts >/dev/null

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

exec "$@"
