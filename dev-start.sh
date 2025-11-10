#!/usr/bin/env bash
set -euo pipefail

# dev-start.sh - Script to start development environment for sgm-contabilidad
# Usage: ./dev-start.sh

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)

echo "Starting backend services with docker-compose..."
sudo docker compose -f "$ROOT_DIR/docker-compose.yml" up -d --remove-orphans

echo "Waiting a few seconds for containers to settle..."
sleep 5

echo "Starting frontend dev server (Vite) on 0.0.0.0:5174"
cd "$ROOT_DIR"
npm run dev -- --host 0.0.0.0 --port 5174 &

echo "Frontend and backend started."
echo "Frontend: http://localhost:5174 (or http://<SERVER_IP>:5174)"
echo "Backend: http://localhost:8000 (or http://<SERVER_IP>:8000)"
