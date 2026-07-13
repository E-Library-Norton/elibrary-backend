#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Norton E-Library — PostgreSQL Daily Backup Script
#
# Creates a compressed, timestamped backup of the PostgreSQL database.
# Designed to run once daily via cron or manually.
#
# Features:
#   • Compressed .sql.gz dumps (saves ~80% disk)
#   • Automatic retention — deletes backups older than N days
#   • Works with Docker container OR external (Render) DB
#   • Color-coded log output
#   • Exit codes for monitoring integration
#
# Usage:
#   Manual:    ./scripts/backup-db.sh
#   Docker:    ./scripts/backup-db.sh --docker
#   Render:    ./scripts/backup-db.sh --url postgresql://user:pass@host:5432/db
#
# Cron (every day at 2:00 AM):
#   0 2 * * * cd /path/to/user-backend && ./scripts/backup-db.sh --docker >> logs/backup.log 2>&1
#
# Restore:
#   ./scripts/restore-db.sh backups/elibrary_2026-04-07_020000.sql.gz
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Config (override via environment) ─────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-$(cd "$(dirname "$0")/.." && pwd)/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"           # keep backups for 7 days
TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-elibrary-db}"

# ── Defaults from .env.docker ────────────────────────────────────────────────
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

# ── Parse arguments ──────────────────────────────────────────────────────────
MODE="local"           # local | docker | url
DATABASE_URL_ARG=""

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
    --retention)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    --dir)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--docker] [--url DATABASE_URL] [--retention DAYS] [--dir PATH]"
      echo ""
      echo "Modes:"
      echo "  (default)   Connect to local PostgreSQL on localhost:5432"
      echo "  --docker    Dump from Docker container '${DOCKER_CONTAINER}'"
      echo "  --url URL   Dump from a remote DATABASE_URL (e.g. Render)"
      echo ""
      echo "Options:"
      echo "  --retention N   Keep backups for N days (default: 7)"
      echo "  --dir PATH      Backup output directory (default: ./backups)"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# ── Ensure backup directory exists ───────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/elibrary_${TIMESTAMP}.sql.gz"

log() { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }

# ── Perform dump ─────────────────────────────────────────────────────────────
log "${GREEN}Starting PostgreSQL backup...${NC}"
log "Mode: ${YELLOW}${MODE}${NC}  |  Retention: ${RETENTION_DAYS} days"

case "$MODE" in

  docker)
    # Dump directly from the Docker container (no pg_dump on host needed)
    if ! docker ps --format '{{.Names}}' | grep -q "^${DOCKER_CONTAINER}$"; then
      log "${RED}✗ Container '${DOCKER_CONTAINER}' is not running.${NC}"
      exit 1
    fi
    log "Container: ${YELLOW}${DOCKER_CONTAINER}${NC}  |  DB: ${DB_NAME}"
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$DOCKER_CONTAINER" \
      pg_dump -U "$DB_USER" -d "$DB_NAME" \
        --no-owner --no-privileges --clean --if-exists \
    | gzip > "$BACKUP_FILE"
    ;;

  url)
    # Dump from a remote DATABASE_URL (e.g. Render managed DB)
    log "URL: ${YELLOW}remote database (credentials hidden)${NC}"
    PGPASSWORD="" pg_dump "$DATABASE_URL_ARG" \
      --no-owner --no-privileges --clean --if-exists \
    | gzip > "$BACKUP_FILE"
    ;;

  local)
    # Dump from local PostgreSQL (host machine)
    log "Host: ${YELLOW}${DB_HOST}:${DB_PORT}${NC}  |  DB: ${DB_NAME}"
    PGPASSWORD="$DB_PASSWORD" pg_dump \
      -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
      --no-owner --no-privileges --clean --if-exists \
    | gzip > "$BACKUP_FILE"
    ;;

esac

# ── Verify backup ────────────────────────────────────────────────────────────
FILESIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
if [[ "$FILESIZE" -lt 100 ]]; then
  log "${RED}✗ Backup file is suspiciously small (${FILESIZE} bytes). Check for errors.${NC}"
  rm -f "$BACKUP_FILE"
  exit 1
fi

FILESIZE_KB=$((FILESIZE / 1024))
log "${GREEN}✓ Backup created: ${BACKUP_FILE} (${FILESIZE_KB} KB)${NC}"

# ── Cleanup old backups ─────────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "elibrary_*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')
if [[ "$DELETED" -gt 0 ]]; then
  log "${YELLOW}♻ Cleaned up ${DELETED} backup(s) older than ${RETENTION_DAYS} days.${NC}"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
TOTAL=$(find "$BACKUP_DIR" -name "elibrary_*.sql.gz" | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "${GREEN}✓ Backup complete. ${TOTAL} backup(s) stored, total size: ${TOTAL_SIZE}${NC}"
log "─────────────────────────────────────────────────────"
