# ══════════════════════════════════════════════════════════════════════════════
# Norton E-Library — Backend Dockerfile
# Multi-stage build: Node.js 20 Alpine · production deps only · non-root user
# ══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package files first (Docker layer cache)
COPY package.json package-lock.json ./

# Install ALL dependencies (dev deps needed for sequelize-cli migrations)
RUN npm ci --ignore-scripts

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Security: add dumb-init for proper signal handling (PID 1 problem)
# netcat-openbsd is required by docker-entrypoint.sh to wait for PostgreSQL
RUN apk add --no-cache dumb-init curl netcat-openbsd

# Non-root user for security
RUN addgroup -g 1001 -S elibrary && \
    adduser  -S elibrary -u 1001 -G elibrary

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json package-lock.json .sequelizerc ./
COPY src/ ./src/
COPY seed_permissions.js ./
COPY scripts/ ./scripts/
COPY docker-entrypoint.sh ./

# Create directories for runtime data (owned by non-root user)
RUN mkdir -p uploads/covers uploads/pdfs logs backups && \
    chown -R elibrary:elibrary /app

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER elibrary

# ── Runtime config 
ENV NODE_ENV=production
ENV PORT=5005

EXPOSE 5005

# Health check — lightweight ping to the API root
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5005}/ || exit 1

# Use dumb-init so Node gets proper SIGTERM signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
