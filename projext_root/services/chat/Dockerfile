FROM node:20-alpine AS build
WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY app ./app
COPY packages ./packages
COPY services ./services
RUN corepack enable && pnpm install --filter @chat/chat --frozen-lockfile
RUN pnpm --filter @chat/chat build

FROM node:20-alpine
WORKDIR /workspace
COPY --from=build /workspace /workspace
WORKDIR /workspace/services/chat
EXPOSE 4100
CMD ["node", "dist/index.js"]
