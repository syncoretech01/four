FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# manifests + lockfile first: dependencies re-resolve only when they change.
# every workspace manifest must be present or --frozen-lockfile rejects the
# lockfile as out of date, even for packages this image does not build.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @four/web... --filter @four/shared...
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter @four/shared build && pnpm --filter @four/web build

FROM node:22-slim
RUN corepack enable
WORKDIR /repo
COPY --from=build /repo ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@four/web", "start"]
