#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Norton E-Library — Production Health Check
#
# Checks all production services are alive and responding correctly.
# Designed to run manually or via cron (e.g. every 5 minutes).
#
# Checks:
#   1. Backend API — GET /api/stats (public endpoint)
#   2. Database — via API response (if API is up, DB is up)
#   3. Student Frontend — GET https://frontend.samnangchan.shop
#   4. Admin Dashboard — GET https://admin-elibrary.samnangchan.shop
#   5. Cloudflare R2 — HEAD request to R2 endpoint
#   6. SSL certificate expiry — warn if <14 days
#
# Usage:
#   ./scripts/health-check.sh                    # check all services
#   ./scripts/health-check.sh --json             # output as JSON
#   ./scripts/health-check.sh --notify           # send alert on failure (future)
#
# Cron (every 5 min):
#   */5 * * * * cd /path/to/user-backend && ./scripts/health-check.sh >> logs/health.log 2>&1
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
BACKEND_URL="${BACKEND_URL:-https://elibrary-api.nortonu.app}"
FRONTEND_URL="${FRONTEND_URL:-https://elibrary.nortonu.app}"
DASHBOARD_URL="${DASHBOARD_URL:-https://admin-elibrary.nortonu.app}"
TIMEOUT=15         # seconds
SSL_WARN_DAYS=14   # warn if cert expires in less than N days

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Parse args ────────────────────────────────────────────────────────────────
JSON_MODE=false
for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
    -h|--help)
      echo "Usage: $0 [--json] [--notify]"
      echo "  --json    Output results as JSON"
      echo "  --notify  (future) Send alert on failure"
      exit 0
      ;;
  esac
done

# ── State ─────────────────────────────────────────────────────────────────────
PASS=0
FAIL=0
WARN=0
RESULTS=()
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

log()  { echo -e "${CYAN}[${TIMESTAMP}]${NC} $1"; }
pass() { PASS=$((PASS + 1)); RESULTS+=("{\"name\":\"$1\",\"status\":\"pass\",\"ms\":$2}"); }
fail() { FAIL=$((FAIL + 1)); RESULTS+=("{\"name\":\"$1\",\"status\":\"fail\",\"error\":\"$2\"}"); }
warn() { WARN=$((WARN + 1)); RESULTS+=("{\"name\":\"$1\",\"status\":\"warn\",\"msg\":\"$2\"}"); }

# ── Check function ────────────────────────────────────────────────────────────
check_url() {
  local name="$1"
  local url="$2"
  local expect_code="${3:-200}"

  local start_ms
  start_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")
  local end_ms
  end_ms=$(python3 -c 'import time; print(int(time.time()*1000))')
  local elapsed=$(( end_ms - start_ms ))

  if [[ "$http_code" == "$expect_code" ]]; then
    PASS=$((PASS + 1))
    RESULTS+=("{\"name\":\"$name\",\"status\":\"pass\",\"ms\":$elapsed}")
    if ! $JSON_MODE; then
      log "${GREEN}✓ ${name}${NC} — HTTP ${http_code} (${elapsed}ms)"
    fi
  else
    FAIL=$((FAIL + 1))
    RESULTS+=("{\"name\":\"$name\",\"status\":\"fail\",\"error\":\"HTTP ${http_code}\"}")
    if ! $JSON_MODE; then
      log "${RED}✗ ${name}${NC} — HTTP ${http_code} (expected ${expect_code})"
    fi
  fi
}

# ── Check SSL expiry ─────────────────────────────────────────────────────────
check_ssl() {
  local name="$1"
  local host="$2"

  local expiry
  expiry=$(echo | openssl s_client -servername "$host" -connect "${host}:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | cut -d= -f2)

  if [[ -z "$expiry" ]]; then
    FAIL=$((FAIL + 1))
    RESULTS+=("{\"name\":\"ssl:${name}\",\"status\":\"fail\",\"error\":\"Cannot read certificate\"}")
    if ! $JSON_MODE; then
      log "${RED}✗ SSL ${name}${NC} — Cannot read certificate"
    fi
    return
  fi

  local expiry_epoch
  expiry_epoch=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s 2>/dev/null \
    || date -d "$expiry" +%s 2>/dev/null)
  local now_epoch=$(date +%s)
  local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

  if [[ "$days_left" -lt "$SSL_WARN_DAYS" ]]; then
    WARN=$((WARN + 1))
    RESULTS+=("{\"name\":\"ssl:${name}\",\"status\":\"warn\",\"msg\":\"Expires in ${days_left} days\"}")
    if ! $JSON_MODE; then
      log "${YELLOW}⚠ SSL ${name}${NC} — Expires in ${days_left} days! (${expiry})"
    fi
  else
    PASS=$((PASS + 1))
    RESULTS+=("{\"name\":\"ssl:${name}\",\"status\":\"pass\",\"ms\":0}")
    if ! $JSON_MODE; then
      log "${GREEN}✓ SSL ${name}${NC} — Valid for ${days_left} days"
    fi
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# RUN CHECKS
# ══════════════════════════════════════════════════════════════════════════════

if ! $JSON_MODE; then
  echo ""
  log "═══════════════════════════════════════════════════════"
  log "  Norton E-Library — Production Health Check"
  log "═══════════════════════════════════════════════════════"
  echo ""
fi

# 1. Backend root
check_url "Backend Root (/)" "${BACKEND_URL}/"

# 2. Backend API — get a book (lightweight keep-alive)
check_url "Backend API — Get A Book (/api/books?limit=1)" "${BACKEND_URL}/api/books?limit=1"

# 3. Backend Auth (should return 401 without token = auth is working)
check_url "Backend Auth Guard" "${BACKEND_URL}/api/auth/profile" "401"

# 4. Student Frontend
check_url "Student Frontend" "${FRONTEND_URL}"

# 5. Admin Dashboard (307 redirect to login is expected)
check_url "Admin Dashboard" "${DASHBOARD_URL}" "307"

# 5. SSL Certificates
check_ssl "frontend" "elibrary.nortonu.app"
check_ssl "dashboard" "admin-elibrary.nortonu.app"
check_ssl "backend" "elibrary-api.nortonu.app"

# ── Summary ───────────────────────────────────────────────────────────────────
if $JSON_MODE; then
  echo "{\"timestamp\":\"${TIMESTAMP}\",\"pass\":${PASS},\"fail\":${FAIL},\"warn\":${WARN},\"checks\":[$(IFS=,; echo "${RESULTS[*]}")]}"
else
  echo ""
  log "───────────────────────────────────────────────────────"
  if [[ "$FAIL" -eq 0 ]]; then
    log "${GREEN}✓ All checks passed!${NC}  (${PASS} pass, ${WARN} warnings)"
  else
    log "${RED}✗ ${FAIL} check(s) FAILED${NC}  (${PASS} pass, ${WARN} warnings)"
  fi
  log "───────────────────────────────────────────────────────"
  echo ""
fi

exit "$FAIL"
