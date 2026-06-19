#!/bin/bash
# Run this on the VPS via provider web console or SSH
# Usage: bash server_deploy.sh

set -e

FRONTEND_DIR="/var/www/marketbeacon/frontend/dist"
NGINX_AVAILABLE="/etc/nginx/sites-available/marketbeaconpro.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/marketbeaconpro.com"

echo "=== MarketBeacon Deploy ==="

# 1. Install nginx config
echo "[1/4] Installing nginx config..."
if [ -f "marketbeacon.nginx.conf" ]; then
  cp marketbeacon.nginx.conf "$NGINX_AVAILABLE"
  ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  echo "nginx config installed"
fi

# 2. Deploy frontend
echo "[2/4] Deploying frontend..."
mkdir -p "$FRONTEND_DIR"
cp -r dist/* "$FRONTEND_DIR/"
echo "Frontend deployed to $FRONTEND_DIR"

# 3. Test and reload nginx
echo "[3/4] Testing and reloading nginx..."
nginx -t && systemctl reload nginx && echo "nginx reloaded"

# 4. Verify
echo "[4/4] Verification..."
curl -sI https://marketbeaconpro.com/ | head -1
curl -s https://marketbeaconpro.com/ | grep -o '<title>[^<]*</title>'
echo "=== Done ==="
