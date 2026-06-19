#!/bin/bash
# Resume MarketBeacon dev session from stage: P/E fixed + 67% Funda filters + lazy backtest
# Run: bash resume.sh

echo "=== MarketBeacon Resume Script ==="

# Kill existing servers
lsof -ti :3001 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# Start backend
cd /Users/diwakarsingh/marketbeacon/backend
nohup npx tsx src/index.ts > /tmp/backend.log 2>&1 &
echo "Backend started on :3001 (PID $!)"

# Start frontend dev server
cd /Users/diwakarsingh/marketbeacon
nohup npx vite --port 5173 --host 0.0.0.0 > /tmp/vite-dev.log 2>&1 &
echo "Frontend started on :5173 (PID $!)"

sleep 3
echo "=== Ready ==="
echo "Frontend: http://localhost:5173/"
echo "Backend:  http://127.0.0.1:3001/"
