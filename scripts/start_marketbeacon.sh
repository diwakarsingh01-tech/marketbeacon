#!/bin/bash
lsof -ti :3001,5173 | xargs kill -9 2>/dev/null
cd /Users/diwakarsingh/supertracker-replica/backend
npm run dev > ../backend_live.log 2>&1 &
cd /Users/diwakarsingh/supertracker-replica
npm run dev -- --host localhost --port 5173 > frontend_live.log 2>&1 &
sleep 10
