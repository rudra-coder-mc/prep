#!/bin/sh
# Ensures the Postgres service is up and healthy, then runs the given command
# with DATABASE_URL pointing at it. Integration tests need a real Postgres, and
# compose already knows how to provide one.
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

exec "$@"
