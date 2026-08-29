#!/usr/bin/env bash
#
# Nightly Postgres backup for the single-host deployment.
#
# The database runs in a container on the same instance as everything else, so
# a lost or replaced instance loses the orders with it. This dumps to disk and,
# when BACKUP_S3_URI is set, copies the dump off the instance - which is the
# part that actually protects you.
#
# Run from cron on the host, not inside a container:
#   0 3 * * * /opt/four/deploy/backup.sh >> /var/log/four-backup.log 2>&1
#
# S3 upload uses the EC2 instance role, so there are no keys to store. Attach a
# role allowing s3:PutObject on the target prefix and set BACKUP_S3_URI.

set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/four}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/four}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
BACKUP_S3_URI="${BACKUP_S3_URI:-}"   # e.g. s3://four-backups/postgres

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="four-${stamp}.sql.gz"
mkdir -p "$BACKUP_DIR"

cd "$COMPOSE_DIR"

# -T: no TTY, so this works unattended from cron
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U postgres --clean --if-exists four \
  | gzip -9 > "${BACKUP_DIR}/${file}.partial"

# only becomes a real backup once the dump succeeded end to end, so a failed
# run can never leave a truncated file that looks restorable
mv "${BACKUP_DIR}/${file}.partial" "${BACKUP_DIR}/${file}"

size="$(du -h "${BACKUP_DIR}/${file}" | cut -f1)"
echo "$(date -u +%FT%TZ) backup ok: ${file} (${size})"

if [ -n "$BACKUP_S3_URI" ]; then
  aws s3 cp "${BACKUP_DIR}/${file}" "${BACKUP_S3_URI%/}/${file}" --only-show-errors
  echo "$(date -u +%FT%TZ) uploaded to ${BACKUP_S3_URI%/}/${file}"
else
  echo "$(date -u +%FT%TZ) WARNING: BACKUP_S3_URI unset - backup exists only on this instance"
fi

find "$BACKUP_DIR" -name 'four-*.sql.gz' -mtime "+${RETAIN_DAYS}" -delete
find "$BACKUP_DIR" -name '*.partial' -mtime +1 -delete
