#!/usr/bin/env bash
# St. Augustine TimeQuest — Database & Media Backup
#
# Run this on the Linode VPS. Add to crontab for automated daily backups:
#   0 3 * * * /opt/timequest/scripts/backup.sh >> /var/log/timequest-backup.log 2>&1
#
# What it backs up:
#   1. PostgreSQL dump (pg_dump via Docker)
#   2. MinIO media bucket (s3cmd sync to a local backup dir)
#
# Retention: keeps 7 daily backups, auto-purges older ones.
#
# Requirements on the host:
#   - Docker Compose stack running at /opt/timequest
#   - s3cmd installed: apt-get install s3cmd
#   - s3cmd configured for MinIO: s3cmd --configure (use MinIO endpoint/keys from .env)
#   OR: set MINIO_ACCESS_KEY / MINIO_SECRET_KEY / MINIO_ENDPOINT below

set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/timequest}"
BACKUP_DIR="${BACKUP_DIR:-/opt/timequest/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"
MEDIA_BACKUP="${BACKUP_DIR}/media_${TIMESTAMP}"

# Load env from the production .env if it exists
if [ -f "${COMPOSE_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  set -a; source "${COMPOSE_DIR}/.env"; set +a
fi

# ── Setup ──────────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting TimeQuest backup (timestamp: ${TIMESTAMP})"

# ── 1. PostgreSQL dump ─────────────────────────────────────────────────────────
echo "→ Dumping PostgreSQL..."
docker compose -f "${COMPOSE_DIR}/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-timequest}" "${POSTGRES_DB:-timequest}" \
  | gzip > "$DB_BACKUP"
echo "   ✓ DB backup: ${DB_BACKUP} ($(du -sh "$DB_BACKUP" | cut -f1))"

# ── 2. MinIO media backup ──────────────────────────────────────────────────────
echo "→ Syncing MinIO media..."
MINIO_ENDPOINT_HOST="${MINIO_ENDPOINT:-localhost:9000}"
MINIO_KEY="${MINIO_ACCESS_KEY:-timequest}"
MINIO_SECRET="${MINIO_SECRET_KEY:-changeme}"
MINIO_BUCKET_NAME="${MINIO_BUCKET:-timequest-media}"

mkdir -p "$MEDIA_BACKUP"

if command -v s3cmd >/dev/null 2>&1; then
  s3cmd sync \
    --access_key="$MINIO_KEY" \
    --secret_key="$MINIO_SECRET" \
    --host="$MINIO_ENDPOINT_HOST" \
    --host-bucket="$MINIO_ENDPOINT_HOST" \
    --no-ssl \
    "s3://${MINIO_BUCKET_NAME}/" \
    "${MEDIA_BACKUP}/"
  echo "   ✓ Media backup: ${MEDIA_BACKUP}"
else
  echo "   ⚠ s3cmd not found — skipping media backup. Install: apt-get install s3cmd"
fi

# ── 3. Prune old backups ───────────────────────────────────────────────────────
echo "→ Pruning backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
find "$BACKUP_DIR" -maxdepth 1 -type d -name "media_*" -mtime "+${KEEP_DAYS}" \
  -exec rm -rf {} + 2>/dev/null || true
echo "   ✓ Pruned"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup complete."
echo "   DB:    ${DB_BACKUP}"
echo "   Media: ${MEDIA_BACKUP}"
