#!/bin/sh
# Runs the end-to-end suite against a dedicated database, so it never touches
# whatever is in the development one.
set -e

DB_NAME=${E2E_DB_NAME:-prep_e2e}

docker compose up -d db >/dev/null
printf 'waiting for postgres'
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-prep}" -d "${POSTGRES_DB:-prep}" >/dev/null 2>&1; do
  printf '.'
  sleep 1
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

npm run db:migrate
npm run db:seed

exec npx playwright test "$@"
