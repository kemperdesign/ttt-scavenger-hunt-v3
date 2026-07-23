#!/usr/bin/env bash
set -euo pipefail

# St. Augustine TimeQuest — Development Reset Script
# Usage: ./scripts/reset-dev.sh [--soft] [--images] [--restart]
#
#   --soft     Stop containers only, keep volumes (data preserved)
#   --images   Also remove built Docker images
#   --restart  Wipe everything then immediately restart

SOFT=false
IMAGES=false
RESTART=false

for arg in "$@"; do
  case $arg in
    --soft)    SOFT=true ;;
    --images)  IMAGES=true ;;
    --restart) RESTART=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

if [ "$SOFT" = false ]; then
  read -r -p "⚠️  This will DELETE all local data (database, uploads). Continue? [y/N] " confirm
  case "$confirm" in
    [yY]) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "→ Stopping containers..."
if [ "$SOFT" = true ]; then
  docker compose stop
  echo "   ✓ Containers stopped (data preserved)"
else
  docker compose down --remove-orphans --volumes
  echo "   ✓ Containers and volumes removed"
fi

if [ "$IMAGES" = true ]; then
  echo "→ Removing built images..."
  docker compose down --rmi local 2>/dev/null || true
  echo "   ✓ Local images removed"
fi

# Clean build artifacts
echo "→ Cleaning build caches..."
rm -rf frontend/.next
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
echo "   ✓ Build caches cleared"

echo ""
echo "✅  Reset complete."

if [ "$RESTART" = true ]; then
  echo "→ Restarting..."
  exec ./scripts/start-dev.sh
fi
