#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/recruitment/app}"
PUBLIC_URL="${PUBLIC_URL:-https://recruitinsightai.com}"

cd "$PROJECT_DIR"

for service in ai-service backend frontend; do
  container_id="$(docker compose ps -q "$service")"
  if [[ -z "$container_id" ]]; then
    echo "CRITICAL: $service has no container." >&2
    exit 1
  fi

  status="$(docker inspect --format '{{.State.Status}}' "$container_id")"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id")"
  echo "$service: status=$status health=$health"

  if [[ "$status" != "running" || "$health" != "healthy" ]]; then
    echo "CRITICAL: $service is not healthy." >&2
    exit 1
  fi
done

curl --fail --silent --show-error --max-time 15 "$PUBLIC_URL/health" >/dev/null
echo "Public endpoint is healthy: $PUBLIC_URL"
