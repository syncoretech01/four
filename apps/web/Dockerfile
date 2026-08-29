FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm install --filter @four/web... --filter @four/shared...
RUN pnpm --filter @four/shared build && pnpm --filter @four/web build

FROM node:22-slim
RUN corepack enable
WORKDIR /repo
COPY --from=build /repo ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@four/web", "start"]
