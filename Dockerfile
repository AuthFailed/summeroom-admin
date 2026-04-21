# syntax=docker/dockerfile:1.7

FROM oven/bun:1-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN bun run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
