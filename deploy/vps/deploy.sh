#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/recruitment/app}"
WAIT_SECONDS="${DEPLOY_WAIT_SECONDS:-180}"
cd "$PROJECT_DIR"

docker compose config --quiet

for image in recruitment-ai recruitment-backend recruitment-frontend; do
  if docker image inspect "$image:latest" >/dev/null 2>&1; then
    docker tag "$image:latest" "$image:rollback"
  fi
done

rollback() {
  echo "Deployment failed; restoring the previous images." >&2
  for image in recruitment-ai recruitment-backend recruitment-frontend; do
    if docker image inspect "$image:rollback" >/dev/null 2>&1; then
      docker tag "$image:rollback" "$image:latest"
    fi
  done
  docker compose up -d --no-build
}
trap rollback ERR

docker compose build
docker compose up -d --remove-orphans

deadline=$((SECONDS + WAIT_SECONDS))
while (( SECONDS < deadline )); do
  all_healthy=true
  for service in ai-service backend frontend; do
    container_id="$(docker compose ps -q "$service")"
    health=""
    if [[ -n "$container_id" ]]; then
      health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id")"
    fi
    [[ "$health" == "healthy" ]] || all_healthy=false
  done

  if [[ "$all_healthy" == "true" ]]; then
    trap - ERR
    docker compose ps
    echo "Deployment completed successfully."
    exit 0
  fi
  sleep 5
done

echo "Services did not become healthy within $WAIT_SECONDS seconds." >&2
exit 1
