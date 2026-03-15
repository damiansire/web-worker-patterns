#!/bin/bash
# Inicia la app en macOS/Linux. Misma lógica que npm run dev (script Node multiplataforma).
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec node scripts/start/start.cjs
