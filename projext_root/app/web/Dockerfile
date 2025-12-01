FROM node:20-alpine AS build
WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY app ./app
COPY packages ./packages
COPY services ./services
RUN corepack enable && pnpm install --filter @chat/web --frozen-lockfile
RUN pnpm --filter @chat/web build

FROM nginx:1.25-alpine
COPY --from=build /workspace/app/web/dist /usr/share/nginx/html
EXPOSE 80
