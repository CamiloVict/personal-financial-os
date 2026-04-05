#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Misma URL que docker-compose (puerto host 5433 → Postgres del contenedor en 5432)
export DATABASE_URL="${DATABASE_URL:-postgresql://pfo:pfo@127.0.0.1:5433/pfo}"

if ! command -v docker >/dev/null 2>&1; then
  if [[ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]]; then
    export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
  fi
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "No se encontró Docker. Instala Docker Desktop o ajusta PATH y vuelve a ejecutar."
  exit 1
fi

echo "==> Levantando Postgres (docker compose)..."
docker compose up -d

echo "==> Esperando a que Postgres del contenedor acepte conexiones..."
for i in $(seq 1 45); do
  if docker compose exec -T postgres pg_isready -U pfo -d pfo -h localhost -p 5432 >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 45 ]]; then
    echo "Timeout esperando Postgres. Revisa: docker compose logs postgres"
    exit 1
  fi
  sleep 1
done

echo "==> Migraciones Prisma (DATABASE_URL=$DATABASE_URL)..."
(cd packages/database && DATABASE_URL="$DATABASE_URL" pnpm exec prisma migrate deploy)

echo "==> Seed (usuario u1 + tipos de inversión)..."
(cd packages/database && DATABASE_URL="$DATABASE_URL" pnpm exec prisma db seed)

echo ""
echo "Listo. El API usa DATABASE_URL en apps/api/.env (debe apuntar al puerto 5433 del contenedor)."
echo "Si cambias el mapeo en docker-compose.yml, actualiza también packages/database/.env y apps/api/.env."
