#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Norton E-Library — PostgreSQL Restore Script
#
# Restores a compressed .sql.gz backup into the database.
#
# Usage:
#   ./scripts/restore-db.sh backups/elibrary_2026-04-07_020000.sql.gz
#   ./scripts/restore-db.sh --docker backups/elibrary_2026-04-07_020000.sql.gz
#   ./scripts/restore-db.sh --url postgresql://... backups/elibrary_2026-04-07_020000.sql.gz
#
# ⚠️  WARNING: This will DROP and recreate all tables in the target database!
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Load env ─────────────────────────────────────────────────────────────────
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.docker"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

DB_USER="${POSTGRES_USER:-elibrary}"
DB_NAME="${POSTGRES_DB:-nu_elibrary_db}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT_EXTERNAL:-5432}"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-elibrary-db}"

MODE="local"
DATABASE_URL_ARG=""
BACKUP_FILE=""

# ── Parse arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker)
      MODE="docker"
      shift
      ;;
    --url)
      MODE="url"
      DATABASE_URL_ARG="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--docker] [--url DATABASE_URL] <backup_file.sql.gz>"
      exit 0
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

log() { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }

# ── Validate ─────────────────────────────────────────────────────────────────
if [[ -z "$BACKUP_FILE" ]]; then
  echo -e "${RED}Error: No backup file specified.${NC}"
  echo "Usage: $0 [--docker] [--url DATABASE_URL] <backup_file.sql.gz>"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo -e "${RED}Error: File not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

# ── Confirmation ─────────────────────────────────────────────────────────────
if [[ "$MODE" == "url" ]]; then
  TARGET_LABEL="remote database (credentials hidden)"
else
  TARGET_LABEL="database '${DB_NAME}'"
fi
log "${YELLOW}⚠ WARNING: This will OVERWRITE the ${TARGET_LABEL}!${NC}"
log "Backup file: ${BACKUP_FILE}"
read -rp "$(echo -e "${YELLOW}Are you sure? (yes/no): ${NC}")" CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  log "Restore cancelled."
  exit 0
fi

# ── Restore ──────────────────────────────────────────────────────────────────
log "${GREEN}Restoring database from ${BACKUP_FILE}...${NC}"

case "$MODE" in

  docker)
    if ! docker ps --format '{{.Names}}' | grep -q "^${DOCKER_CONTAINER}$"; then
      log "${RED}✗ Container '${DOCKER_CONTAINER}' is not running.${NC}"
      exit 1
    fi
    gunzip -c "$BACKUP_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DOCKER_CONTAINER" \
      psql -U "$DB_USER" -d "$DB_NAME" --quiet --single-transaction
    ;;

  url)
    gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL_ARG" --quiet --single-transaction
    ;;

  local)
    PGPASSWORD="$DB_PASSWORD" gunzip -c "$BACKUP_FILE" | \
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --quiet --single-transaction
    ;;

esac

log "${GREEN}✓ Database restored successfully from: ${BACKUP_FILE}${NC}"
log "─────────────────────────────────────────────────────"
