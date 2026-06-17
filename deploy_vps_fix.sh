#!/bin/bash
# ==============================================================================
# MarketBeacon VPS Full Deployment Script (Frontend + Backend)
# ==============================================================================
# Prerequisites:
#   Frontend: run "npm run build:prerender" locally, then upload dist/ to the VPS
#   Backend:  run "npm run build" in backend/ locally, then upload dist/ to the VPS
#   Config:   place marketbeacon.nginx.conf at /etc/nginx/sites-available/
# ==============================================================================

MODE="${1:-all}"  # all, frontend, backend

# ── Paths ──
FRONTEND_SRC="/var/www/marketbeacon/frontend/dist"
NGINX_AVAILABLE="/etc/nginx/sites-available/marketbeaconpro.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/marketbeaconpro.com"
HOST_BACKEND="/var/www/marketbeacon/backend"
DOCKER_CONTEXT="/opt/marketbeacon-backend"
DOCKER_DIR="/opt"

echo "MarketBeacon VPS Deployment (mode: $MODE)"
echo "==========================================="

# ── FRONTEND ──
if [ "$MODE" = "all" ] || [ "$MODE" = "frontend" ]; then
    echo ""
    echo "[Frontend] Deploying..."

    if [ ! -d "$FRONTEND_SRC" ]; then
        echo "[Frontend] Creating $FRONTEND_SRC..."
        mkdir -p "$FRONTEND_SRC"
    fi

    if [ ! -f "$FRONTEND_SRC/index.html" ]; then
        echo "[Frontend] WARNING: No index.html found at $FRONTEND_SRC."
        echo "Upload the prerendered build (dist/) before running this script."
        echo "  rsync -avz --delete dist/ user@vps:$FRONTEND_SRC/"
        exit 1
    fi

    # Enable nginx site if not already enabled
    if [ -f "$NGINX_AVAILABLE" ] && [ ! -f "$NGINX_ENABLED" ]; then
        ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
        echo "[Frontend] Nginx site enabled."
    fi

    echo "[Frontend] Frontend files ready at $FRONTEND_SRC"
fi

# ── BACKEND ──
if [ "$MODE" = "all" ] || [ "$MODE" = "backend" ]; then
    echo ""
    echo "[Backend] Deploying..."

    if [ ! -d "$HOST_BACKEND/dist" ]; then
        echo "[Backend] ERROR: Build folder not found at $HOST_BACKEND/dist."
        echo "Upload the backend dist/ before running this script."
        exit 1
    fi

    # Stop PM2 host processes to free up port 3001
    if command -v pm2 &> /dev/null; then
        pm2 stop marketbeacon-backend 2>/dev/null
        pm2 delete marketbeacon-backend 2>/dev/null
        pm2 save 2>/dev/null
        echo "[Backend] PM2 host process cleared."
    fi

    # Create Docker context dir
    if [ ! -d "$DOCKER_CONTEXT" ]; then
        mkdir -p "$DOCKER_CONTEXT"
    fi

    # Copy backend dist
    echo "[Backend] Copying dist files..."
    if [ -d "$DOCKER_CONTEXT/dist" ]; then
        mv "$DOCKER_CONTEXT/dist" "$DOCKER_CONTEXT/dist_backup_$(date +%s)"
    fi
    cp -r "$HOST_BACKEND/dist" "$DOCKER_CONTEXT/"

    # Copy database and cache files
    echo "[Backend] Copying data files..."
    for f in marketbeacon.db alpha_40_results.json market_snapshot.json; do
        if [ -f "$HOST_BACKEND/$f" ]; then
            cp "$HOST_BACKEND/$f" "$DOCKER_CONTEXT/$f"
        fi
    done
    if [ -f "$HOST_BACKEND/alpha_40_results.json" ]; then
        mkdir -p "$DOCKER_CONTEXT/dist"
        cp "$HOST_BACKEND/alpha_40_results.json" "$DOCKER_CONTEXT/dist/alpha_40_results.json"
    fi

    # Detect Docker Compose command
    if docker compose version &> /dev/null; then
        DOCKER_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_CMD="docker-compose"
    else
        echo "[Backend] ERROR: No docker compose command found."
        exit 1
    fi

    # Restart Docker containers
    cd "$DOCKER_DIR" || exit 1
    $DOCKER_CMD down
    $DOCKER_CMD build
    $DOCKER_CMD up -d

    echo "[Backend] Docker containers restarted."

    # Health check
    sleep 5
    echo "[Backend] Health check:"
    curl -s http://localhost:3001/api/health
    echo ""
fi

# ── NGINX RELOAD ──
if [ "$MODE" = "all" ] || [ -f "$NGINX_ENABLED" ]; then
    echo ""
    echo "[Nginx] Testing config and reloading..."
    nginx -t && systemctl reload nginx
    echo "[Nginx] Reloaded successfully."
fi

echo ""
echo "==========================================="
echo "Deployment complete (mode: $MODE)."
