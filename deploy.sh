#!/bin/bash
set -e
KEY=~/.ssh/marketbeacon
HOST=diwakar@165.99.223.76

echo "=== Building backend ==="
(cd backend && npm run build)
echo "=== Building frontend + prerender ==="
npm run build:prerender

echo "=== Packaging ==="
tar czf /tmp/mb-be.tar.gz -C backend/dist .
tar czf /tmp/mb-fe.tar.gz -C dist .

echo "=== Uploading to staging ==="
ssh -i $KEY -o StrictHostKeyChecking=no $HOST "
  mkdir -p /tmp/mb-deploy
  rm -rf /tmp/mb-deploy/*
"
scp -i $KEY -o StrictHostKeyChecking=no /tmp/mb-be.tar.gz /tmp/mb-fe.tar.gz $HOST:/tmp/mb-deploy/
ssh -i $KEY -o StrictHostKeyChecking=no $HOST "
  sudo mkdir -p /opt/marketbeacon-backend/staging /var/www/marketbeacon/frontend/staging
  sudo rm -rf /opt/marketbeacon-backend/staging/* /var/www/marketbeacon/frontend/staging/*
  sudo tar xzf /tmp/mb-deploy/mb-be.tar.gz -C /opt/marketbeacon-backend/staging/
  sudo tar xzf /tmp/mb-deploy/mb-fe.tar.gz -C /var/www/marketbeacon/frontend/staging/
  rm -rf /tmp/mb-deploy
  echo 'Staging ready, triggering webhook...'
"

echo "=== Triggering deploy ==="
ssh -i $KEY -o StrictHostKeyChecking=no $HOST "curl -s -X POST http://127.0.0.1:3099/deploy -H 'x-deploy-key: mb-deploy-2026'" | python3 -m json.tool
rm -f /tmp/mb-be.tar.gz /tmp/mb-fe.tar.gz
