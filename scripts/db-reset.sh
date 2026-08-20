#!/bin/sh
# Wipes the database and rebuilds it empty: drop, migrate, seed.
#
# Only the database is started, not the speech engine, because none of the three
# steps says a word. That is the difference between this and with-services.sh.
set -e

docker compose up -d db >/dev/null

printf 'waiting for postgres'
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-prep}" -d "${POSTGRES_DB:-prep}" >/dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo ' ready'

DATABASE_URL="postgres://${POSTGRES_USER:-prep}:${POSTGRES_PASSWORD:-prep}@localhost:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-prep}"
export DATABASE_URL

tsx src/db/reset.ts
tsx src/db/migrate.ts
tsx src/db/seed.ts
