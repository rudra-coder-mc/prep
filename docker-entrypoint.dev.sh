#!/bin/sh
set -e

# Development counterpart of docker-entrypoint.sh. Runs the TypeScript sources
# directly rather than the bundled dist/, which only exists in the built image.
npx tsx apps/web/src/db/migrate.ts
npx tsx apps/web/src/db/seed.ts

exec "$@"
