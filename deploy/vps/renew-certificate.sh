#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/recruitment/app}"
cd "$PROJECT_DIR"

mkdir -p /var/www/certbot

docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot renew --webroot --webroot-path /var/www/certbot --non-interactive

docker compose exec -T frontend nginx -s reload
echo "Certificate renewal check completed and Nginx reloaded without downtime."
