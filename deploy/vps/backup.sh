#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/recruitment/app}"
BACKUP_DIR="${BACKUP_DIR:-/opt/recruitment/backups}"
UPLOADS_DIR="${UPLOADS_PATH:-/opt/recruitment/data/uploads}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$BACKUP_DIR/recruitment-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

items=()
[[ -f "$PROJECT_DIR/.env" ]] && items+=("$PROJECT_DIR/.env")
[[ -f "$PROJECT_DIR/docker-compose.yml" ]] && items+=("$PROJECT_DIR/docker-compose.yml")
[[ -d "$UPLOADS_DIR" ]] && items+=("$UPLOADS_DIR")

if [[ ${#items[@]} -eq 0 ]]; then
  echo "Nothing to back up. Check PROJECT_DIR and UPLOADS_PATH." >&2
  exit 1
fi

tar -czf "$ARCHIVE" --absolute-names "${items[@]}"
chmod 600 "$ARCHIVE"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'recruitment-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

echo "Backup created: $ARCHIVE"
echo "SQL Server is external and must be backed up separately at the database provider."
