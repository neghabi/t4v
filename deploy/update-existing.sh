#!/usr/bin/env bash
# For the existing db/web installation. Never generates or rewrites credentials.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
umask 077
[[ -f .env && -f docker-compose.yml && -f compose.auth-repair.yml ]] || { echo "Missing existing .env / Compose files; update stopped."; exit 1; }
command -v flock >/dev/null || { echo "Install util-linux (flock) first."; exit 1; }
exec 9>.update.lock
flock -n 9 || { echo "Another update is running."; exit 1; }
compose=(docker compose -f docker-compose.yml -f compose.auth-repair.yml)
"${compose[@]}" config --quiet
for service in web auth-migrate db; do
  "${compose[@]}" config --services | grep -qx "$service" || { echo "Missing service: $service"; exit 1; }
done
echo "Building candidate images; current web container stays running."
"${compose[@]}" build web auth-migrate
echo "Checking candidate database credentials before touching the running website."
"${compose[@]}" run --rm --no-deps auth-migrate node scripts/check-runtime.mjs --connection-only
"${compose[@]}" run --rm --no-deps --entrypoint node web scripts/check-runtime.mjs --skip-schema
mkdir -p backups
backup="backups/before-update-$(date -u +%Y%m%dT%H%M%SZ).dump"
"${compose[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup"
test -s "$backup"
echo "Backup saved. Applying migrations."
"${compose[@]}" run --rm --no-deps auth-migrate
"${compose[@]}" run --rm --no-deps auth-migrate node scripts/check-runtime.mjs --schema-only
echo "Checking candidate web environment and schema before replacing the old container."
# Same merged web environment/image/network, with no published ports.
"${compose[@]}" run --rm --no-deps --entrypoint node web scripts/check-runtime.mjs
"${compose[@]}" up -d --no-deps --force-recreate web
ready=0
for attempt in {1..30}; do
  if "${compose[@]}" exec -T web node -e 'fetch("http://127.0.0.1:3000/api/health").then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))' >/dev/null 2>&1; then ready=1; break; fi
  sleep 2
done
[[ "$ready" == 1 ]] || { echo "Web readiness failed. Inspect web logs; no automatic database rollback was attempted."; exit 1; }
cp deploy/compose.reporting.yml compose.reporting.yml
reporting=("${compose[@]}" -f compose.reporting.yml)
"${reporting[@]}" build analytics-worker
"${reporting[@]}" up -d --no-deps --force-recreate analytics-worker
echo "Update completed; web schema and database checks passed."
