# API NestJS: monorepo pnpm + turbo. Listo para Fly.io (escucha PORT, 0.0.0.0 en main.ts).
FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
# Evita emit vacío: Nest borra dist y tsc incremental puede no re-emitir si coló un .tsbuildinfo.
RUN find apps packages -name '*.tsbuildinfo' -delete 2>/dev/null || true
# Misma cadena que en local: nest-cli usa tsconfig.build.json (emit completo).
RUN pnpm exec turbo run build --filter=api \
  && test -f apps/api/dist/main.js \
  && test -f apps/api/dist/app.module.js

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
