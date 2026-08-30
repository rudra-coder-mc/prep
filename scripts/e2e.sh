#!/bin/sh
# Runs the end-to-end suite against a dedicated database, speech cache and
# content archive, so it never touches whatever is in the development ones.
set -e

DB_NAME=${E2E_DB_NAME:-prep_e2e}
# Absolute, so the script and the app agree on one directory. The app runs from
# apps/web, so a relative path would have them emptying and filling two.
SPEECH_CACHE_DIR=${E2E_SPEECH_CACHE_DIR:-"$PWD/.speech-cache-e2e"}
CONTENT_ARCHIVE_DIR=${E2E_CONTENT_ARCHIVE_DIR:-"$PWD/.content-archive-e2e"}

# The speech engine is off by default and the speech specs need it, so it is
# started here and stopped again when the run ends, the same way
# scripts/with-services.sh does it.
docker compose up -d db tts >/dev/null
trap 'docker compose stop tts >/dev/null 2>&1' EXIT INT TERM

printf 'waiting for postgres'
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-prep}" -d "${POSTGRES_DB:-prep}" >/dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo ' ready'

printf 'waiting for the speech engine'
until curl -sf "http://127.0.0.1:${TTS_PORT:-5001}/info" >/dev/null 2>&1; do
  printf '.'
  sleep 2
done
echo ' ready'

docker compose exec -T db psql -U "${POSTGRES_USER:-prep}" -d "${POSTGRES_DB:-prep}" \
  -c "drop database if exists \"$DB_NAME\" with (force)" -c "create database \"$DB_NAME\"" >/dev/null

DATABASE_URL="postgres://${POSTGRES_USER:-prep}:${POSTGRES_PASSWORD:-prep}@localhost:${POSTGRES_PORT:-5432}/$DB_NAME"
export DATABASE_URL
export BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-e2e-secret-not-used-anywhere-else}
# better-auth rejects requests from origins other than its baseURL, so it has to
# match the host Playwright actually serves on.
export E2E_PORT=${E2E_PORT:-3100}
export BETTER_AUTH_URL=${E2E_BASE_URL:-http://127.0.0.1:$E2E_PORT}
export SEED_USER_EMAIL=${SEED_USER_EMAIL:-e2e@prep.test}
export SEED_USER_PASSWORD=${SEED_USER_PASSWORD:-e2e-password}

# Emptied rather than reused, so a spec asserting that a script had to be
# synthesised is asserting something. The database is dropped above for the same
# reason.
rm -rf "$SPEECH_CACHE_DIR"
export SPEECH_CACHE_DIR
export SPEECH_SERVICE_URL="http://127.0.0.1:${TTS_PORT:-5001}"

# The device endpoints serve what a build wrote, so the run needs one. It is
# built here rather than reused from the repository for the same reason the
# database is dropped above: a spec should not pass or fail on what a developer
# happened to have lying around. It takes about a second.
export CONTENT_ARCHIVE_DIR
npm run content:archive -- "$CONTENT_ARCHIVE_DIR"

npm run db:migrate
npm run db:seed

# Not exec, because the trap above has to survive the run finishing.
npx playwright test --config apps/web/playwright.config.ts "$@"
