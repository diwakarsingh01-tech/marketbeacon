#!/bin/bash

# MarketBeacon Startup Script
# Optimized for Local Mac Deployment

echo "🚀 Starting MarketBeacon Ecosystem..."

# 1. Navigate to project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# 2. Kill existing processes on ports 3001 and 5173
echo "🧹 Cleaning up existing ports..."
lsof -ti :3001 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# 3. Start Backend
echo "📡 Launching Backend on Port 3001..."
cd "$PROJECT_ROOT/backend"
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

# 4. Start Frontend
echo "💻 Launching Frontend on Port 5173..."
cd "$PROJECT_ROOT"
npm run dev -- --host > frontend.log 2>&1 &
FRONTEND_PID=$!

# 5. Wait for servers to initialize
echo "⏳ Waiting for services to wake up..."
sleep 5

echo "------------------------------------------------"
echo "✅ MarketBeacon is now LIVE!"
echo "🔗 Dashboard: http://localhost:5173/dashboard"
echo "📂 Logs: backend.log, frontend.log"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop (Background PIDs: $BACKEND_PID, $FRONTEND_PID)"

# Keep script alive to monitor background processes if needed, 
# or just exit if user prefers them in background.
wait
