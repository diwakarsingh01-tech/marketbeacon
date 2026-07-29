#!/bin/bash
set -e
KEY=~/.ssh/marketbeacon
HOST=diwakar@165.99.223.76
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(node -p "require('./package.json').version")
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

notify() {
  local level="$1" msg="$2"
  echo "[$level] $msg"
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST "$SLACK_WEBHOOK" -H 'Content-type: application/json' \
      -d "{\"text\":\"[$level] MarketBeacon Deploy ($VERSION): $msg\"}" 2>/dev/null || true
  fi
}

cleanup() {
  rm -f /tmp/mb-be-"$TIMESTAMP".tar.gz /tmp/mb-fe-"$TIMESTAMP".tar.gz
  echo "Cleaned up temp files"
}
trap cleanup EXIT

echo "=== Pre-deploy checks ==="
if [ ! -f "package.json" ]; then echo "Run from project root"; exit 1; fi
if [ ! -d "backend" ]; then echo "backend/ not found"; exit 1; fi
if [ ! -f "$KEY" ]; then echo "SSH key $KEY not found"; exit 1; fi

echo "=== Building backend ==="
(cd backend && npm run build) || { notify "FAIL" "Backend build failed"; exit 1; }

echo "=== Building frontend + prerender ==="
npm run build:prerender || { notify "FAIL" "Frontend build failed"; exit 1; }

echo "=== Packaging ==="
tar czf /tmp/mb-be-"$TIMESTAMP".tar.gz -C backend/dist .
tar czf /tmp/mb-fe-"$TIMESTAMP".tar.gz -C dist .

echo "=== Uploading to staging ==="
ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "
  mkdir -p /tmp/mb-deploy-${TIMESTAMP}
  sudo mkdir -p /opt/marketbeacon-backend/backups /var/www/marketbeacon/frontend/backups
"
scp -i "$KEY" -o StrictHostKeyChecking=no /tmp/mb-be-"$TIMESTAMP".tar.gz /tmp/mb-fe-"$TIMESTAMP".tar.gz "$HOST:/tmp/mb-deploy-${TIMESTAMP}/"

ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "
  set -e
  echo '=== Rolling backup ==='
  if [ -d /opt/marketbeacon-backend/current ]; then
    sudo cp -a /opt/marketbeacon-backend/current /opt/marketbeacon-backend/backups/backup-${TIMESTAMP}
    echo 'Backend backup saved'
  fi
  if [ -d /var/www/marketbeacon/frontend/current ]; then
    sudo cp -a /var/www/marketbeacon/frontend/current /var/www/marketbeacon/frontend/backups/backup-${TIMESTAMP}
    echo 'Frontend backup saved'
  fi

  echo '=== Deploying to staging ==='
  sudo mkdir -p /opt/marketbeacon-backend/staging /var/www/marketbeacon/frontend/staging
  sudo rm -rf /opt/marketbeacon-backend/staging/* /var/www/marketbeacon/frontend/staging/*
  sudo tar xzf /tmp/mb-deploy-${TIMESTAMP}/mb-be-${TIMESTAMP}.tar.gz -C /opt/marketbeacon-backend/staging/
  sudo tar xzf /tmp/mb-deploy-${TIMESTAMP}/mb-fe-${TIMESTAMP}.tar.gz -C /var/www/marketbeacon/frontend/staging/

  echo '=== Atomic swap ==='
  sudo rm -rf /opt/marketbeacon-backend/previous /var/www/marketbeacon/frontend/previous
  if [ -d /opt/marketbeacon-backend/current ]; then sudo mv /opt/marketbeacon-backend/current /opt/marketbeacon-backend/previous; fi
  if [ -d /var/www/marketbeacon/frontend/current ]; then sudo mv /var/www/marketbeacon/frontend/current /var/www/marketbeacon/frontend/previous; fi
  sudo mv /opt/marketbeacon-backend/staging /opt/marketbeacon-backend/current
  sudo mv /var/www/marketbeacon/frontend/staging /var/www/marketbeacon/frontend/current
  rm -rf /tmp/mb-deploy-${TIMESTAMP}
  echo 'Staging ready, restarting services...'
  # Sync frontend current -> dist (nginx serves from /var/www/marketbeacon/frontend/dist)
  echo '=== Syncing frontend current -> dist ==='
  sudo rm -rf /var/www/marketbeacon/frontend/dist
  sudo cp -a /var/www/marketbeacon/frontend/current /var/www/marketbeacon/frontend/dist
  sudo chown -R www-data:www-data /var/www/marketbeacon/frontend/dist

  # Sync backend current -> dist (Docker container mounts from dist)
  echo '=== Syncing backend current -> dist ==='
  # Preserve cache files that are mounted separately by Docker
  if [ -f /opt/marketbeacon-backend/market_snapshot.json ]; then
    sudo cp /opt/marketbeacon-backend/market_snapshot.json /tmp/mb-snapshot-backup.json
  fi
  if [ -f /opt/marketbeacon-backend/alpha_40_results.json ]; then
    sudo cp /opt/marketbeacon-backend/alpha_40_results.json /tmp/mb-alpha40-backup.json
  fi
  sudo rm -rf /opt/marketbeacon-backend/dist
  sudo cp -a /opt/marketbeacon-backend/current /opt/marketbeacon-backend/dist
  # Restore cached files after dist sync
  if [ -f /tmp/mb-snapshot-backup.json ]; then
    sudo mv /tmp/mb-snapshot-backup.json /opt/marketbeacon-backend/market_snapshot.json
    echo 'Market snapshot file preserved'
  fi
  if [ -f /tmp/mb-alpha40-backup.json ]; then
    sudo mv /tmp/mb-alpha40-backup.json /opt/marketbeacon-backend/alpha_40_results.json
    echo 'Alpha-40 results file preserved'
  fi

  echo '=== Restarting backend service ==='
  pm2 restart marketbeacon-backend
  docker restart mb-backend 2>/dev/null || true
  echo 'Services restarted'
"

echo "=== Post-deploy health check ==="
sleep 5
HEALTH_HTTP=$(ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/health")
if [ "$HEALTH_HTTP" != "200" ]; then
  notify "FAIL" "Backend health check returned $HEALTH_HTTP, initiating rollback..."
  ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "
    echo '=== Rolling back ==='
    if [ -d /opt/marketbeacon-backend/previous ]; then
      sudo rm -rf /opt/marketbeacon-backend/current
      sudo mv /opt/marketbeacon-backend/previous /opt/marketbeacon-backend/current
      echo 'Backend rolled back'
    fi
    if [ -d /var/www/marketbeacon/frontend/previous ]; then
      sudo rm -rf /var/www/marketbeacon/dist
      sudo mkdir -p /var/www/marketbeacon/dist
      sudo cp -a /var/www/marketbeacon/frontend/previous/* /var/www/marketbeacon/dist/
      sudo chown -R www-data:www-data /var/www/marketbeacon/dist
      echo 'Frontend rolled back'
    fi
    pm2 restart marketbeacon-backend
    echo 'Rollback complete'
  "
  exit 1
fi

echo "=== Post-deploy health check ==="
sleep 3
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' https://marketbeaconpro.com/)
if [ "$HEALTH" != "200" ]; then
  notify "WARN" "Site returned $HEALTH after deploy"
else
  notify "OK" "Deploy v$VERSION ($TIMESTAMP) successful"
fi

echo "=== Done ==="
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
