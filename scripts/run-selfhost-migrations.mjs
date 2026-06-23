import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const DEFAULT_ENV_FILE = ".env.local";
const DEFAULT_MIGRATIONS_DIR = "supabase/migrations";
const DEFAULT_REMOTE_SUPABASE_DIR = "/opt/changzhouai/supabase";
const MIGRATION_FILE_PATTERN = /^(\d{12,})_([A-Za-z0-9_.-]+)\.sql$/;

function printHelp() {
  console.log(`Apply Changzhou AI Club migrations to Tencent Cloud self-hosted Supabase.

Usage:
  npm run db:migrate:selfhost
  npm run db:migrate:selfhost -- --apply
  npm run db:migrate:selfhost -- --apply --only 20260623100131_project_opportunity_cover_image.sql
  npm run db:migrate:selfhost -- --mark-applied 20260623100131_project_opportunity_cover_image.sql
  npm run db:migrate:selfhost -- --mark-applied-all

Options:
  --apply                 Execute pending migrations. Without this flag, only prints a dry-run plan.
  --only <file|version>   Limit dry-run/apply to one migration.
  --mark-applied <target> Record one migration as applied without executing SQL.
  --mark-applied-all      Record all local migrations as applied without executing SQL.
  --env-file <path>       Local env file with Tencent Cloud SSH variables. Defaults to .env.local.
  --migrations-dir <path> Local migrations directory. Defaults to supabase/migrations.
  --remote-dir <path>     Remote self-hosted Supabase directory. Defaults to /opt/changzhouai/supabase.
  --help                  Show this help.

Required local env:
  TENCENT_CLOUD_USER, TENCENT_CLOUD_IP, TENCENT_CLOUD_PASSWORD

Remote env read on server only:
  /opt/changzhouai/supabase/.env -> POSTGRES_PASSWORD, POSTGRES_DB
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    envFile: DEFAULT_ENV_FILE,
    help: false,
    markApplied: null,
    markAppliedAll: false,
    migrationsDir: DEFAULT_MIGRATIONS_DIR,
    only: null,
    remoteDir: DEFAULT_REMOTE_SUPABASE_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--mark-applied-all") {
      options.markAppliedAll = true;
      continue;
    }

    if (arg === "--only") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--only requires a migration file name or version.");
      }

      options.only = value;
      index += 1;
      continue;
    }

    if (arg === "--mark-applied") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--mark-applied requires a migration file name or version.");
      }

      options.markApplied = value;
      index += 1;
      continue;
    }

    if (arg === "--env-file") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--env-file requires a path.");
      }

      options.envFile = value;
      index += 1;
      continue;
    }

    if (arg === "--migrations-dir") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--migrations-dir requires a path.");
      }

      options.migrationsDir = value;
      index += 1;
      continue;
    }

    if (arg === "--remote-dir") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--remote-dir requires a path.");
      }

      options.remoteDir = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.apply && (options.markApplied || options.markAppliedAll)) {
    throw new Error("--apply cannot be combined with --mark-applied or --mark-applied-all.");
  }

  if (options.markApplied && options.markAppliedAll) {
    throw new Error("Use either --mark-applied or --mark-applied-all, not both.");
  }

  return options;
}

function unquoteEnvValue(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1).replaceAll("\\n", "\n");
  }

  return trimmed;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Env file not found: ${filePath}`);
  }

  const env = {};
  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) {
      continue;
    }

    env[match[1]] = unquoteEnvValue(match[2]);
  }

  return env;
}

function getRequiredEnv(env, name) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env value in local env file: ${name}`);
  }

  return value;
}

function listLocalMigrations(migrationsDir) {
  if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .map((fileName) => {
      const match = fileName.match(MIGRATION_FILE_PATTERN);

      if (!match) {
        throw new Error(`Unexpected migration file name: ${fileName}`);
      }

      return {
        fileName,
        name: match[2],
        path: path.join(migrationsDir, fileName),
        version: match[1],
      };
    })
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

function resolveMigrationTarget(migrations, target) {
  if (!target) {
    return null;
  }

  const normalized = target.trim();
  const migration = migrations.find(
    (item) => item.fileName === normalized || item.version === normalized,
  );

  if (!migration) {
    throw new Error(`Migration not found: ${target}`);
  }

  return migration;
}

function buildSshCommand(env) {
  const user = getRequiredEnv(env, "TENCENT_CLOUD_USER");
  const host = getRequiredEnv(env, "TENCENT_CLOUD_IP");
  const password = getRequiredEnv(env, "TENCENT_CLOUD_PASSWORD");

  return {
    command: "sshpass",
    args: [
      "-e",
      "ssh",
      "-o",
      "StrictHostKeyChecking=accept-new",
      "-o",
      "ConnectTimeout=15",
      `${user}@${host}`,
      "bash",
      "-s",
    ],
    env: {
      ...process.env,
      SSHPASS: password,
    },
  };
}

function runRemote(sshConfig, script, args = [], options = {}) {
  const result = spawnSync(sshConfig.command, [...sshConfig.args, "--", ...args], {
    encoding: "utf8",
    env: sshConfig.env,
    input: script,
    maxBuffer: 1024 * 1024 * 8,
  });

  if (result.status !== 0) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    throw new Error(options.errorMessage ?? "Remote command failed.");
  }

  return result.stdout.trim();
}

function getRemoteStatus(sshConfig, remoteDir) {
  const output = runRemote(
    sshConfig,
    String.raw`
set -eu
REMOTE_DIR="$1"
cd "$REMOTE_DIR"

read_env_value() {
  grep -m 1 "^$1=" .env |
    sed "s/^[^=]*=//; s/\r$//; s/^\"//; s/\"$//; s/^'//; s/'$//"
}

POSTGRES_PASSWORD="$(read_env_value POSTGRES_PASSWORD)"
DB_NAME="$(read_env_value POSTGRES_DB || true)"
DB_NAME="\${DB_NAME:-postgres}"

psql_db() {
  sudo docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" supabase-db \
    psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
}

if [ "$(psql_db -tAc "select to_regclass('supabase_migrations.schema_migrations') is not null;")" != "t" ]; then
  printf "HISTORY_MISSING\n"
  exit 0
fi

psql_db -tAc "select version from supabase_migrations.schema_migrations order by version;"
`,
    [remoteDir],
    { errorMessage: "Failed to read remote migration status." },
  );

  if (!output || output === "HISTORY_MISSING") {
    return {
      historyExists: false,
      versions: new Set(),
    };
  }

  return {
    historyExists: true,
    versions: new Set(output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)),
  };
}

function createRemoteTempDir(sshConfig) {
  return runRemote(
    sshConfig,
    String.raw`
set -eu
mktemp -d /tmp/changzhouai-selfhost-migrations.XXXXXX
`,
    [],
    { errorMessage: "Failed to create remote temporary directory." },
  );
}

function removeRemoteTempDir(sshConfig, tempDir) {
  if (!tempDir) {
    return;
  }

  runRemote(
    sshConfig,
    String.raw`
set -eu
TEMP_DIR="$1"
case "$TEMP_DIR" in
  /tmp/changzhouai-selfhost-migrations.*) rm -rf "$TEMP_DIR" ;;
  *) printf "Refusing to remove unexpected temp dir: %s\n" "$TEMP_DIR" >&2; exit 1 ;;
esac
`,
    [tempDir],
    { errorMessage: "Failed to remove remote temporary directory." },
  );
}

function uploadMigration(sshConfig, migration, tempDir) {
  const sql = readFileSync(migration.path, "utf8");

  runRemote(
    sshConfig,
    String.raw`
set -eu
TEMP_DIR="$1"
FILE_NAME="$2"
case "$TEMP_DIR" in
  /tmp/changzhouai-selfhost-migrations.*) ;;
  *) printf "Unexpected temp dir: %s\n" "$TEMP_DIR" >&2; exit 1 ;;
esac
case "$FILE_NAME" in
  *[!A-Za-z0-9_.-]*) printf "Unexpected file name: %s\n" "$FILE_NAME" >&2; exit 1 ;;
esac
umask 077
cat > "$TEMP_DIR/$FILE_NAME"
`,
    [tempDir, migration.fileName],
    { errorMessage: `Failed to upload migration: ${migration.fileName}` },
  );
}

function runRemoteMigrationActionWithInput(sshConfig, remoteDir, action, migrations, tempDir = "") {
  const migrationInput = migrations
    .map((migration) => [migration.version, migration.name, migration.fileName].join("\t"))
    .join("\n");
  const script = String.raw`
set -eu
REMOTE_DIR="$1"
ACTION="$2"
TEMP_DIR="$3"
cd "$REMOTE_DIR"

read_env_value() {
  grep -m 1 "^$1=" .env |
    sed "s/^[^=]*=//; s/\r$//; s/^\"//; s/\"$//; s/^'//; s/'$//"
}

POSTGRES_PASSWORD="$(read_env_value POSTGRES_PASSWORD)"
DB_NAME="$(read_env_value POSTGRES_DB || true)"
DB_NAME="\${DB_NAME:-postgres}"

psql_db() {
  sudo docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" supabase-db \
    psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
}

ensure_history_table() {
  psql_db >/dev/null <<'SQL'
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key
);
alter table supabase_migrations.schema_migrations
  add column if not exists name text;
alter table supabase_migrations.schema_migrations
  add column if not exists statements text[];
SQL
}

record_migration() {
  version="$1"
  name="$2"
  psql_db >/dev/null <<SQL
insert into supabase_migrations.schema_migrations (version, name, statements)
values ('$version', '$name', array[]::text[])
on conflict (version) do update
set name = excluded.name;
SQL
}

ensure_history_table

while IFS="$(printf '\t')" read -r version name file_name; do
  [ -n "$version" ] || continue

  case "$version" in
    *[!0-9]*) printf "Unexpected version: %s\n" "$version" >&2; exit 1 ;;
  esac

  case "$name" in
    *[!A-Za-z0-9_.-]*) printf "Unexpected migration name: %s\n" "$name" >&2; exit 1 ;;
  esac

  case "$file_name" in
    *[!A-Za-z0-9_.-]*) printf "Unexpected file name: %s\n" "$file_name" >&2; exit 1 ;;
  esac

  if [ "$ACTION" = "apply" ]; then
    migration_file="$TEMP_DIR/$file_name"

    if [ ! -f "$migration_file" ]; then
      printf "Missing uploaded migration file: %s\n" "$migration_file" >&2
      exit 1
    fi

    if [ "$(psql_db -tAc "select exists (select 1 from supabase_migrations.schema_migrations where version = '$version');")" = "t" ]; then
      printf "skip %s already recorded\n" "$file_name"
      continue
    fi

    printf "apply %s\n" "$file_name"
    psql_db -f "$migration_file"
    record_migration "$version" "$name"
    continue
  fi

  if [ "$ACTION" = "mark" ]; then
    printf "mark %s\n" "$file_name"
    record_migration "$version" "$name"
    continue
  fi

  printf "Unknown action: %s\n" "$ACTION" >&2
  exit 1
done <<'MIGRATIONS'
${migrationInput}
MIGRATIONS

if [ "$ACTION" = "apply" ]; then
  psql_db -c "notify pgrst, 'reload schema';" >/dev/null
fi
`;

  return runRemote(sshConfig, script, [remoteDir, action, tempDir], {
    errorMessage:
      action === "apply"
        ? "Failed to apply remote migrations."
        : "Failed to update remote migration history.",
  });
}

function printPlan({ appliedVersions, historyExists, localMigrations, selectedMigrations }) {
  console.log(`Remote migration history: ${historyExists ? "present" : "missing"}`);
  console.log(`Local migrations: ${localMigrations.length}`);
  console.log(`Recorded remote migrations: ${appliedVersions.size}`);

  if (!historyExists) {
    console.log(
      "Warning: remote migration history table is missing. Use --mark-applied-all only after verifying the current schema already matches local migrations.",
    );
  }

  if (selectedMigrations.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  console.log("Pending migrations:");

  for (const migration of selectedMigrations) {
    console.log(`- ${migration.fileName}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const localEnv = loadEnvFile(options.envFile);
  const sshConfig = buildSshCommand(localEnv);
  const localMigrations = listLocalMigrations(options.migrationsDir);
  const onlyMigration = resolveMigrationTarget(localMigrations, options.only);
  const markAppliedMigration = resolveMigrationTarget(localMigrations, options.markApplied);
  const status = getRemoteStatus(sshConfig, options.remoteDir);
  const selectedLocalMigrations = onlyMigration ? [onlyMigration] : localMigrations;

  if (options.markApplied || options.markAppliedAll) {
    const migrationsToMark = options.markAppliedAll ? localMigrations : [markAppliedMigration];
    const output = runRemoteMigrationActionWithInput(
      sshConfig,
      options.remoteDir,
      "mark",
      migrationsToMark,
    );

    if (output) {
      console.log(output);
    }

    console.log(`Marked ${migrationsToMark.length} migration(s) as applied.`);
    return;
  }

  const pendingMigrations = selectedLocalMigrations.filter(
    (migration) => !status.versions.has(migration.version),
  );

  if (!options.apply) {
    printPlan({
      appliedVersions: status.versions,
      historyExists: status.historyExists,
      localMigrations,
      selectedMigrations: pendingMigrations,
    });
    return;
  }

  if (!status.historyExists && !onlyMigration) {
    throw new Error(
      "Remote migration history is missing. Refusing to apply all local migrations. Use --only for one known migration, or --mark-applied-all after manually verifying the existing schema.",
    );
  }

  if (pendingMigrations.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  let tempDir = "";

  try {
    tempDir = createRemoteTempDir(sshConfig);

    for (const migration of pendingMigrations) {
      uploadMigration(sshConfig, migration, tempDir);
    }

    const output = runRemoteMigrationActionWithInput(
      sshConfig,
      options.remoteDir,
      "apply",
      pendingMigrations,
      tempDir,
    );

    if (output) {
      console.log(output);
    }

    console.log(`Applied ${pendingMigrations.length} migration(s).`);
  } finally {
    removeRemoteTempDir(sshConfig, tempDir);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
