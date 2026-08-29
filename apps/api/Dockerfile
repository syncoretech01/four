FROM node:22-slim AS build
# openssl in the BUILD stage too: prisma generate probes it to resolve the
# `native` binary target, and without it picks openssl-1.1.x on a 3.x image
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
# manifests + lockfile first: dependencies re-resolve only when they change.
# every workspace manifest must be present or --frozen-lockfile rejects the
# lockfile as out of date, even for packages this image does not build.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @four/api... --filter @four/db... --filter @four/shared...
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @four/shared build && pnpm --filter @four/db generate && pnpm --filter @four/api build

FROM node:22-slim
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY --from=build /repo ./
EXPOSE 4000
# apply migrations + seed idempotently, then serve
CMD ["sh", "-c", "pnpm --filter @four/db exec prisma migrate deploy && pnpm --filter @four/db seed && node apps/api/dist/server.js"]
