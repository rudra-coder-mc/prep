# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
# Every workspace manifest, because npm ci links the members and refuses to run
# without them.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/content/package.json ./packages/content/
RUN npm ci

# ---- development ------------------------------------------------------------
# Used by compose.dev.yaml, which bind-mounts the workspace sources over this.
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.dev.sh"]
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# ---- build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_STANDALONE=true
RUN npm run build
# Bundle the migrate and seed entrypoints so the runtime image needs neither
# TypeScript nor any development dependency.
RUN npx esbuild apps/web/src/db/migrate.ts apps/web/src/db/seed.ts \
      --bundle --platform=node --format=esm \
      --outdir=dist

# ---- runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs

# The speech cache is a named volume in compose. Docker gives a fresh volume the
# ownership of the image directory it is mounted over, so this has to exist and
# belong to nextjs or the app cannot write synthesised audio into it.
RUN mkdir -p /cache/speech && chown -R nextjs:nodejs /cache

# Standalone traces from the repository root, so it lands with the workspace
# shape it was built in and the server sits under apps/web.
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --chown=nextjs:nodejs apps/web/drizzle ./drizzle
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
