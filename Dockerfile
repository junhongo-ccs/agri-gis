FROM node:20-bookworm-slim AS build
WORKDIR /app/web

COPY web/package*.json ./
RUN npm ci

COPY web ./
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app/web
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/web ./web

WORKDIR /app/web/web
CMD ["node", "scripts/railway-server.mjs"]
