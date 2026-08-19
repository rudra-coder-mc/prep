#!/bin/sh
set -e

# Both steps are idempotent, so this is safe on every container start.
node dist/migrate.js
node dist/seed.js

exec "$@"
