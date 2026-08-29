#!/usr/bin/env bash
#
# Restore a dump produced by backup.sh. A backup nobody has restored is a
# guess, not a backup - run this against a throwaway instance once before you
# need it for real.
#
#   ./deploy/restore.sh /var/backups/four/four-20260829T030000Z.sql.gz
#
# The dump is --clean --if-exists, so it drops and recreates every object it
# owns. That means restoring REPLACES the current database contents.

set -euo pipefail

DUMP="${1:?usage: restore.sh <dump.sql.gz>}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/four}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

[ -f "$DUMP" ] || { echo "no such dump: $DUMP" >&2; exit 1; }

cd "$COMPOSE_DIR"

echo "This REPLACES the contents of the 'four' database from:"
echo "  $DUMP"
read -r -p "Type the word restore to continue: " confirm
[ "$confirm" = "restore" ] || { echo "aborted"; exit 1; }

# stop the API so nothing writes mid-restore; leave postgres up
docker compose -f "$COMPOSE_FILE" stop api web

gunzip -c "$DUMP" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U postgres -d four -v ON_ERROR_STOP=1

docker compose -f "$COMPOSE_FILE" start api web
echo "restored from $DUMP"
