FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM base AS builder

ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS migrator

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

COPY scripts/create-admin.mjs scripts/diagnose-database.mjs scripts/setup-database.mjs scripts/check-runtime.mjs ./scripts/

CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS worker
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/analytics-worker.mjs ./scripts/analytics-worker.mjs
USER node
CMD ["node", "scripts/analytics-worker.mjs"]

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/check-runtime.mjs ./scripts/check-runtime.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/migrations ./prisma/migrations

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "node scripts/check-runtime.mjs && exec node server.js"]
