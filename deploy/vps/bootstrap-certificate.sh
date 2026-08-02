#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 your-email@example.com" >&2
  exit 1
fi

EMAIL="$1"
PROJECT_DIR="${PROJECT_DIR:-/opt/recruitment/app}"
CERT_PATH="/etc/letsencrypt/live/recruitinsightai.com/fullchain.pem"

if [[ -f "$CERT_PATH" ]]; then
  echo "Certificate already exists: $CERT_PATH"
  exit 0
fi

cd "$PROJECT_DIR"
docker compose stop frontend >/dev/null 2>&1 || true

docker run --rm \
  -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d recruitinsightai.com \
  -d www.recruitinsightai.com

echo "Certificate issued successfully. You can now start the frontend service."
