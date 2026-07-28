#!/bin/bash
set -e
KEY=~/.ssh/marketbeacon
HOST=diwakar@165.99.223.76
PORT=2222
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(node -p "require('./package.json').version")

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
(cd backend && npm run build) || { echo "Backend build failed"; exit 1; }

echo "=== Building frontend + prerender ==="
npm run build:prerender || { echo "Frontend build failed"; exit 1; }

echo "=== Packaging ==="
# Include market_snapshot.json in backend package for fresh installations
tar czf /tmp/mb-be-"$TIMESTAMP".tar.gz -C backend/dist .
if [ -f backend/market_snapshot.json ]; then
  echo "Including market_snapshot.json separately (not in tar)"
fi
tar czf /tmp/mb-fe-"$TIMESTAMP".tar.gz -C dist .

echo "=== Uploading to staging ==="
ssh -i "$KEY" -o StrictHostKeyChecking=no -p "$PORT" "$HOST" "
  mkdir -p /tmp/mb-deploy-${TIMESTAMP}
  sudo mkdir -p /opt/marketbeacon-backend/backups /var/www/marketbeacon/frontend/backups
"
scp -i "$KEY" -o StrictHostKeyChecking=no -P "$PORT" /tmp/mb-be-"$TIMESTAMP".tar.gz /tmp/mb-fe-"$TIMESTAMP".tar.gz "$HOST:/tmp/mb-deploy-${TIMESTAMP}/"

ssh -i "$KEY" -o StrictHostKeyChecking=no -p "$PORT" "$HOST" "
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

  # Sync frontend current -> dist (nginx serves from dist)
  echo '=== Syncing frontend current -> dist ==='
  sudo rm -rf /var/www/marketbeacon/frontend/dist
  sudo cp -a /var/www/marketbeacon/frontend/current /var/www/marketbeacon/frontend/dist
  sudo chown -R www-data:www-data /var/www/marketbeacon/frontend/dist

  # Sync backend current -> dist (Docker container mounts from dist)
  echo '=== Syncing backend current -> dist ==='
  # Preserve the market_snapshot.json file if it exists (it's mounted separately by Docker)
  if [ -f /opt/marketbeacon-backend/market_snapshot.json ]; then
    sudo cp /opt/marketbeacon-backend/market_snapshot.json /tmp/mb-snapshot-backup.json
  fi
  # Also copy the database file to dist so Docker container has it
  if [ -f /opt/marketbeacon-backend/current/marketbeacon.db ]; then
    sudo cp /opt/marketbeacon-backend/current/marketbeacon.db /tmp/mb-db-backup.db
  fi
  sudo rm -rf /opt/marketbeacon-backend/dist
  sudo cp -a /opt/marketbeacon-backend/current /opt/marketbeacon-backend/dist
  # Restore snapshot file after dist sync
  if [ -f /tmp/mb-snapshot-backup.json ]; then
    sudo mv /tmp/mb-snapshot-backup.json /opt/marketbeacon-backend/market_snapshot.json
    echo 'Market snapshot file preserved'
  fi
  # Restore database file after dist sync
  if [ -f /tmp/mb-db-backup.db ]; then
    sudo mv /tmp/mb-db-backup.db /opt/marketbeacon-backend/dist/marketbeacon.db
    echo 'Market database file preserved'
  fi

  echo '=== Restarting backend service ==='
  pm2 restart marketbeacon-backend
  docker restart mb-backend 2>/dev/null || true
  echo 'Services restarted'
"

echo "=== Post-deploy health check ==="
sleep 10
HEALTH_HTTP=$(ssh -i "$KEY" -o StrictHostKeyChecking=no -p "$PORT" "$HOST" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/health")
if [ "$HEALTH_HTTP" != "200" ]; then
  echo "FAIL: Backend health check returned $HEALTH_HTTP"
  echo "Initiating rollback..."
  ssh -i "$KEY" -o StrictHostKeyChecking=no -p "$PORT" "$HOST" "
    echo '=== Rolling back ==='
    if [ -d /opt/marketbeacon-backend/previous ]; then
      sudo rm -rf /opt/marketbeacon-backend/current
      sudo mv /opt/marketbeacon-backend/previous /opt/marketbeacon-backend/current
      echo 'Backend rolled back'
    fi
    if [ -d /var/www/marketbeacon/frontend/previous ]; then
      sudo rm -rf /var/www/marketbeacon/frontend/dist
      sudo mv /var/www/marketbeacon/frontend/previous /var/www/marketbeacon/frontend/dist
      echo 'Frontend rolled back'
    fi
    pm2 restart marketbeacon-backend
    echo 'Rollback complete'
  "
  exit 1
fi

echo "=== Post-deploy health check ==="
sleep 3
HEALTH=$(curl -s -o /dev/null -w '%{http_code}' https://marketbeaconpro.com/ 2>/dev/null || echo "000")
echo "Site returned HTTP $HEALTH"

echo "=== Done ==="
echo "Version: $VERSION"
echo "Timestamp: $TIMESTAMP"
