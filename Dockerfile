# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- development ------------------------------------------------------------
# Used by compose.dev.yaml, which bind-mounts src/ and content/ over this.
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
RUN npx esbuild src/db/migrate.ts src/db/seed.ts \
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

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --chown=nextjs:nodejs drizzle ./drizzle
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
