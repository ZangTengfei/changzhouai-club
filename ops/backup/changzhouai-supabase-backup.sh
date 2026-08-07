#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

CONFIG_FILE="${BACKUP_CONFIG_FILE:-/etc/changzhouai-backup/backup.env}"
LOCK_FILE="${BACKUP_LOCK_FILE:-/run/lock/changzhouai-supabase-backup.lock}"
STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/changzhouai-backup}"
EXPORT_DIR="${STATE_DIR}/export"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/changzhouai/supabase}"
SUPABASE_DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"
SUPABASE_STORAGE_DIR="${SUPABASE_DIR}/volumes/storage"

if [[ ! -r "$CONFIG_FILE" ]]; then
  printf 'Backup config is not readable: %s\n' "$CONFIG_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$CONFIG_FILE"
set +a

require_value() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    printf 'Missing required backup config: %s\n' "$name" >&2
    exit 1
  fi
}

for name in RESTIC_REPOSITORY RESTIC_PASSWORD_FILE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION; do
  require_value "$name"
done

run_restic() {
  restic -o s3.bucket-lookup=dns -o "s3.region=${AWS_REGION}" "$@"
}

notify_failure() {
  local message="$1"

  if [[ -z "${FEISHU_BOT_WEBHOOK_URL:-}" || -z "${FEISHU_BOT_WEBHOOK_SECRET:-}" ]]; then
    return 0
  fi

  BACKUP_FAILURE_MESSAGE="$message" python3 - <<'PY'
import base64
import hashlib
import hmac
import json
import os
import time
import urllib.request

timestamp = int(time.time())
secret = os.environ["FEISHU_BOT_WEBHOOK_SECRET"]
string_to_sign = f"{timestamp}\n{secret}".encode()
signature = base64.b64encode(
    hmac.new(string_to_sign, b"", hashlib.sha256).digest()
).decode()
payload = {
    "timestamp": str(timestamp),
    "sign": signature,
    "msg_type": "text",
    "content": {"text": os.environ["BACKUP_FAILURE_MESSAGE"]},
}
request = urllib.request.Request(
    os.environ["FEISHU_BOT_WEBHOOK_URL"],
    data=json.dumps(payload, ensure_ascii=False).encode(),
    headers={"Content-Type": "application/json"},
)
with urllib.request.urlopen(request, timeout=15) as response:
    result = json.loads(response.read().decode())
if result.get("code", result.get("StatusCode", 0)) != 0:
    raise RuntimeError(f"Feishu bot returned an error: {result}")
PY
}

on_error() {
  local status="$?"
  local line="$1"
  trap - ERR
  set +e
  notify_failure "【常州 AI 社区】Supabase 自动备份失败\n主机：$(hostname)\n时间：$(date -Is)\n退出码：${status}\n脚本行：${line}\n日志：/var/log/changzhouai-supabase-backup.log"
  printf 'Backup failed at line %s with exit code %s.\n' "$line" "$status" >&2
  exit "$status"
}

trap 'on_error $LINENO' ERR

for command in docker restic python3 flock sha256sum; do
  command -v "$command" >/dev/null
done

install -d -m 0700 "$STATE_DIR"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf 'Another Supabase backup or verification is already running.\n' >&2
  exit 75
fi

if [[ "$EXPORT_DIR" != "/var/lib/changzhouai-backup/export" ]]; then
  printf 'Unexpected export directory: %s\n' "$EXPORT_DIR" >&2
  exit 1
fi

find "$EXPORT_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + 2>/dev/null || true
install -d -m 0700 "$EXPORT_DIR"

started_at="$(date -Is)"
database_dump="$EXPORT_DIR/database.dump"
globals_dump="$EXPORT_DIR/globals.sql"

docker inspect "$SUPABASE_DB_CONTAINER" >/dev/null
test -d "$SUPABASE_STORAGE_DIR"

docker exec "$SUPABASE_DB_CONTAINER" sh -c \
  'exec env PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U postgres -d "$POSTGRES_DB" --format=custom --compress=6 --no-owner --no-privileges' \
  >"$database_dump"

docker exec "$SUPABASE_DB_CONTAINER" sh -c \
  'exec env PGPASSWORD="$POSTGRES_PASSWORD" pg_dumpall -U postgres --globals-only --no-role-passwords' \
  >"$globals_dump"

database_size_bytes="$(
  docker exec "$SUPABASE_DB_CONTAINER" sh -c \
    'exec env PGPASSWORD="$POSTGRES_PASSWORD" psql -U postgres -d "$POSTGRES_DB" -Atc "select pg_database_size(current_database())"'
)"
storage_file_count="$(find "$SUPABASE_STORAGE_DIR" -type f | wc -l | tr -d ' ')"
storage_size_bytes="$(du -sb "$SUPABASE_STORAGE_DIR" | awk '{print $1}')"

(
  cd "$SUPABASE_STORAGE_DIR"
  find . -type f -print0 | sort -z | xargs -0 -r sha256sum
) >"$EXPORT_DIR/storage.sha256"

sha256sum "$database_dump" "$globals_dump" >"$EXPORT_DIR/database.sha256"

cat >"$EXPORT_DIR/manifest.txt" <<EOF
started_at=${started_at}
completed_export_at=$(date -Is)
host=$(hostname)
database_size_bytes=${database_size_bytes}
storage_file_count=${storage_file_count}
storage_size_bytes=${storage_size_bytes}
database_container_image=$(docker inspect --format '{{.Config.Image}}' "$SUPABASE_DB_CONTAINER")
EOF

run_restic snapshots --json >/dev/null 2>&1 || run_restic init

run_restic backup \
  --host "$(hostname)" \
  --tag automated \
  --tag supabase \
  --exclude "$SUPABASE_DIR/volumes/db/data" \
  --exclude "$SUPABASE_DIR/volumes/logs" \
  "$EXPORT_DIR" \
  "$SUPABASE_DIR"

run_restic forget \
  --host "$(hostname)" \
  --tag supabase \
  --keep-hourly 28 \
  --keep-daily 14 \
  --keep-weekly 8 \
  --keep-monthly 12 \
  --prune

date -Is >"$STATE_DIR/last-backup-success"
printf 'Supabase backup completed successfully at %s.\n' "$(date -Is)"
