#!/bin/sh
set -e

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "Installing dependencies..."
  npm install
fi

mkdir -p data

echo "Running migrations..."
npm run db:migrate

echo "Seeding database..."
npm run db:seed

echo "Starting dev server..."
exec npm run dev -- --host 0.0.0.0 --port "${PORT:-3000}"
