#!/usr/bin/env bash
set -Eeuo pipefail

APP_DOMAIN="${1:-t4v.ir}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"

if [[ -f "${PROJECT_DIR}/compose.auth-repair.yml" ]]; then
  echo "Existing db/web deployment detected. Preserve its configuration and run: bash deploy/update-existing.sh"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker نصب نیست. ابتدا Docker Engine و افزونه Docker Compose را نصب کنید."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose در دسترس نیست."
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "برای ساخت امن رمزها، بسته openssl باید نصب باشد."
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  DB_PASSWORD="$(openssl rand -hex 24)"
  APP_SECRET="$(openssl rand -hex 48)"
  DASHBOARD_SECRET="$(openssl rand -hex 12)"
  PAYMENT_ENCRYPTION_KEY="$(openssl rand -base64 32)"

  cat >"${ENV_FILE}" <<EOF
POSTGRES_USER=t4v
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=t4v
DATABASE_URL=postgresql://t4v:${DB_PASSWORD}@db:5432/t4v?schema=public
APP_SECRET=${APP_SECRET}
PAYMENT_ENCRYPTION_KEY=${PAYMENT_ENCRYPTION_KEY}
DASHBOARD_SECRET=${DASHBOARD_SECRET}
APP_DOMAIN=${APP_DOMAIN}
PUBLIC_SHORT_URL_BASE=https://${APP_DOMAIN}
COOKIE_SECURE=true
APP_PORT=3000
EOF

  chmod 600 "${ENV_FILE}"
  echo "فایل .env با رمزهای تصادفی ساخته شد."
else
  echo "فایل .env موجود حفظ شد؛ هیچ رمزی بازنویسی نشد."
fi

cd "${PROJECT_DIR}"
docker compose \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  up --build -d --wait --wait-timeout 300

mkdir -p "${PROJECT_DIR}/.local"
chmod 700 "${PROJECT_DIR}/.local"
docker compose run --rm --no-deps \
  -e "PUBLIC_SHORT_URL_BASE=https://${APP_DOMAIN}" \
  -v "${PROJECT_DIR}/.local:/app/.local" \
  migrate node scripts/create-admin.mjs admin

echo
echo "T4V با موفقیت راه‌اندازی شد."
echo "Website: https://${APP_DOMAIN}"
echo "Admin:   https://${APP_DOMAIN}/admin"
echo "Admin credentials: .local/admin-admin.json (private file; existing accounts are preserved)"
