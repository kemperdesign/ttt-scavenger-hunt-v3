#!/usr/bin/env bash
set -euo pipefail

# St. Augustine TimeQuest — Development Startup Script
# Usage: ./scripts/start-dev.sh [--no-seed] [--no-migrate] [--rebuild]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
NO_SEED=false
NO_MIGRATE=false
REBUILD=false

for arg in "$@"; do
  case $arg in
    --no-seed)    NO_SEED=true ;;
    --no-migrate) NO_MIGRATE=true ;;
    --rebuild)    REBUILD=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

echo ""
echo "🗺  St. Augustine TimeQuest — Dev Startup"
echo "=========================================="

# ── Prerequisites ──────────────────────────────────────────────────────────────
echo "→ Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌  Docker not found. Install Docker Desktop first."; exit 1; }
docker info >/dev/null 2>&1 || { echo "❌  Docker is not running. Start Docker Desktop first."; exit 1; }
echo "   ✓ Docker is running"

# ── Environment files ──────────────────────────────────────────────────────────
cd "$ROOT_DIR"
if [ ! -f .env ]; then
  echo "→ Creating .env from .env.example..."
  cp .env.example .env
  echo "   ✓ Created .env — review and update secrets before production use"
else
  echo "   ✓ .env already exists"
fi

if [ ! -f frontend/.env.local ]; then
  echo "→ Creating frontend/.env.local from frontend/.env.example..."
  cp frontend/.env.example frontend/.env.local
  echo "   ✓ Created frontend/.env.local"
fi

# ── Docker Compose ─────────────────────────────────────────────────────────────
if [ "$REBUILD" = true ]; then
  echo "→ Rebuilding containers..."
  docker compose down --remove-orphans
  docker compose build --no-cache
fi

echo "→ Starting services..."
docker compose up -d --remove-orphans

# ── Wait for PostgreSQL ────────────────────────────────────────────────────────
echo "→ Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U timequest -d timequest >/dev/null 2>&1; then
    echo "   ✓ PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌  PostgreSQL failed to become ready after 30 attempts."
    docker compose logs postgres
    exit 1
  fi
  sleep 2
done

# ── Wait for Qdrant ────────────────────────────────────────────────────────────
echo "→ Waiting for Qdrant..."
for i in $(seq 1 20); do
  if curl -sf http://localhost:6333/readyz >/dev/null 2>&1; then
    echo "   ✓ Qdrant is ready"
    break
  fi
  sleep 2
done

# ── Wait for MinIO ─────────────────────────────────────────────────────────────
echo "→ Waiting for MinIO..."
for i in $(seq 1 20); do
  if curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "   ✓ MinIO is ready"
    break
  fi
  sleep 2
done

# ── Migrations ─────────────────────────────────────────────────────────────────
if [ "$NO_MIGRATE" = false ]; then
  echo "→ Running database migrations..."
  # Generate initial migration if none exist yet
  MIGRATION_COUNT=$(find "$ROOT_DIR/alembic/versions" -name "*.py" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "   No migrations found — generating initial migration..."
    docker compose exec -T backend alembic revision --autogenerate -m "initial"
    echo "   ✓ Initial migration generated"
  fi
  docker compose exec -T backend alembic upgrade head
  echo "   ✓ Migrations complete"
fi

# ── Seed data ──────────────────────────────────────────────────────────────────
if [ "$NO_SEED" = false ]; then
  echo "→ Seeding adventure data..."
  ADVENTURE_COUNT=$(docker compose exec -T postgres psql -U timequest -d timequest -tAc \
    "SELECT COUNT(*) FROM adventures;" 2>/dev/null || echo "0")
  if [ "$ADVENTURE_COUNT" -eq 0 ]; then
    docker compose exec -T backend python scripts/import_adventure.py \
      --file scripts/founding_st_augustine.json
    docker compose exec -T backend python scripts/seed_sources.py
    echo "   ✓ Adventure (with challenges) and source registry seeded"
  else
    echo "   ✓ Adventure data already seeded (${ADVENTURE_COUNT} adventure(s) found)"
  fi

  echo "→ Seeding AI characters (idempotent)..."
  docker compose exec -T backend python scripts/seed_characters.py
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo "✅  TimeQuest is running!"
echo ""
echo "   Player app:   http://localhost:3000"
echo "   Admin portal: http://localhost:3000/admin"
echo "   API docs:     http://localhost:8000/docs"
echo "   MinIO console:http://localhost:9001  (user: timequest / timequest_dev_secret)"
echo ""
echo "   Stop:   docker compose down"
echo "   Reset:  ./scripts/reset-dev.sh"
echo ""
