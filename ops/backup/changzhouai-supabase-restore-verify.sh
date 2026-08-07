#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

CONFIG_FILE="${BACKUP_CONFIG_FILE:-/etc/changzhouai-backup/backup.env}"
LOCK_FILE="${BACKUP_LOCK_FILE:-/run/lock/changzhouai-supabase-backup.lock}"
STATE_DIR="${BACKUP_STATE_DIR:-/var/lib/changzhouai-backup}"
RESTORE_DIR="${STATE_DIR}/restore-test"
SUPABASE_DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"
RESTORED_EXPORT_DIR="${RESTORE_DIR}${STATE_DIR}/export"
RESTORED_STORAGE_DIR="${RESTORE_DIR}/opt/changzhouai/supabase/volumes/storage"
VERIFY_DATABASE="backup_verify_$(date +%Y%m%d%H%M%S)"
database_created=0

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

cleanup() {
  set +e
  if [[ "$database_created" == "1" ]]; then
    docker exec "$SUPABASE_DB_CONTAINER" sh -c \
      'exec env PGPASSWORD="$POSTGRES_PASSWORD" dropdb -U supabase_admin --if-exists "$1"' \
      sh "$VERIFY_DATABASE" >/dev/null 2>&1
  fi
  if [[ "$RESTORE_DIR" == "/var/lib/changzhouai-backup/restore-test" ]]; then
    find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + 2>/dev/null
  fi
}

on_error() {
  local status="$?"
  local line="$1"
  trap - ERR
  cleanup
  notify_failure "【常州 AI 社区】Supabase 备份恢复校验失败\n主机：$(hostname)\n时间：$(date -Is)\n退出码：${status}\n脚本行：${line}\n日志：/var/log/changzhouai-supabase-verify.log"
  printf 'Restore verification failed at line %s with exit code %s.\n' "$line" "$status" >&2
  exit "$status"
}

trap 'on_error $LINENO' ERR
trap cleanup EXIT

for command in docker restic python3 flock sha256sum; do
  command -v "$command" >/dev/null
done

install -d -m 0700 "$STATE_DIR"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf 'Another Supabase backup or verification is already running.\n' >&2
  exit 75
fi

if [[ "$RESTORE_DIR" != "/var/lib/changzhouai-backup/restore-test" ]]; then
  printf 'Unexpected restore directory: %s\n' "$RESTORE_DIR" >&2
  exit 1
fi

find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + 2>/dev/null || true
install -d -m 0700 "$RESTORE_DIR"

run_restic check --read-data-subset=10%
run_restic restore latest --host "$(hostname)" --tag supabase --target "$RESTORE_DIR"

test -s "$RESTORED_EXPORT_DIR/database.dump"
test -s "$RESTORED_EXPORT_DIR/globals.sql"
test -s "$RESTORED_EXPORT_DIR/manifest.txt"
test -d "$RESTORED_STORAGE_DIR"

(
  cd "$RESTORED_EXPORT_DIR"
  sha256sum --check --quiet database.sha256
)
(
  cd "$RESTORED_STORAGE_DIR"
  sha256sum --check --quiet "$RESTORED_EXPORT_DIR/storage.sha256"
)

docker exec -i "$SUPABASE_DB_CONTAINER" pg_restore --list \
  <"$RESTORED_EXPORT_DIR/database.dump" >/dev/null

docker exec "$SUPABASE_DB_CONTAINER" sh -c \
  'exec env PGPASSWORD="$POSTGRES_PASSWORD" createdb -U supabase_admin "$1"' \
  sh "$VERIFY_DATABASE"
database_created=1

docker exec -i "$SUPABASE_DB_CONTAINER" sh -c \
  'exec env PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -U supabase_admin -d "$1" --no-owner --no-privileges --exit-on-error' \
  sh "$VERIFY_DATABASE" <"$RESTORED_EXPORT_DIR/database.dump"

restored_counts="$(
  docker exec "$SUPABASE_DB_CONTAINER" sh -c \
    'exec env PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -d "$1" -Atc "select (select count(*) from auth.users)::text || '"'"','"'"' || (select count(*) from storage.objects)::text"' \
    sh "$VERIFY_DATABASE"
)"

date -Is >"$STATE_DIR/last-restore-verify-success"
printf 'Supabase restore verification completed successfully at %s; auth_users,storage_objects=%s.\n' \
  "$(date -Is)" "$restored_counts"
