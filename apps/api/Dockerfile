FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --filter @four/api... --filter @four/db... --filter @four/shared...
RUN pnpm --filter @four/shared build && pnpm --filter @four/db generate && pnpm --filter @four/api build

FROM node:22-slim
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY --from=build /repo ./
EXPOSE 4000
# push the schema + seed idempotently, then serve
CMD ["sh", "-c", "pnpm --filter @four/db exec prisma db push --skip-generate && pnpm --filter @four/db seed && node apps/api/dist/server.js"]
