---
name: changzhou-production-deploy
description: Publish the current Changzhou AI Club website version to the Tencent Cloud production host and verify the live site. Use when the user asks to update/publish/deploy the online version, push changes online, refresh production, check whether the latest version is live, or run the established changzhouai.club SSH + rsync + Docker Compose release flow for /Users/nobugai/develop/changzhouai-club.
---

# Changzhou Production Deploy

Use the repository root `/Users/nobugai/develop/changzhouai-club`.

This skill is for releasing the website application. Do not use it for event-content publishing, project-opportunity publishing, local Supabase Docker work, or broad server maintenance unless the user explicitly ties that work to a production website release.

## Success Criteria

- The intended local version is identified.
- `npm run build` passes before release.
- Any intended code changes are committed, and `main` is pushed to `origin/main` when it is ahead and safe to push.
- Source is synced to `/opt/changzhouai/app/source` without overwriting production env files or local-only knowledge/assets.
- The remote `web` service is rebuilt and started with `/opt/changzhouai/app/source/.env.selfhost.local`.
- `source-web-1` is running and `https://changzhouai.club/` responds successfully.
- No secret values are printed.

## Preflight

1. Inspect state:

```bash
git fetch origin --prune
git status --short --branch
git log -1 --oneline
```

2. If there are uncommitted changes:
   - Commit only changes that belong to the user's request after verification.
   - Leave unrelated user changes unstaged.
   - Ask once before publishing if the deployment target is ambiguous, if unrelated dirty files make the release unclear, or if pushing would include work outside the request.

3. If `main` is ahead of `origin/main` and the commits are intended for this release, push first:

```bash
git push origin main
```

4. Confirm local SSH env keys exist without printing values:

```bash
node -e "const fs=require('fs'); const text=fs.readFileSync('.env.local','utf8'); for (const k of ['TENCENT_CLOUD_USER','TENCENT_CLOUD_IP','TENCENT_CLOUD_PASSWORD']) console.log(k+': '+(new RegExp('^'+k+'=.+','m').test(text)?'set':'missing'))"
```

## Local Verification

Run:

```bash
npm run build
```

Do not release if the build fails. Fix the cause or report the blocker.

## Sync Source

Load local env before SSH or rsync. Keep `.env*`, `.git/`, build output, dependencies, and local-only knowledge folders out of the sync.

```bash
set -e
set -a
source .env.local
set +a
sshpass -p "$TENCENT_CLOUD_PASSWORD" rsync -az --delete --stats \
  -e 'ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10' \
  --exclude='.git/' \
  --exclude='.next/' \
  --exclude='node_modules/' \
  --exclude='.env*' \
  --exclude='output/' \
  --exclude='files/' \
  --exclude='knowledge/' \
  --exclude='.codex/' \
  ./ "$TENCENT_CLOUD_USER@$TENCENT_CLOUD_IP:/opt/changzhouai/app/source/"
```

## Remote Rebuild

Source the remote runtime env before Compose so interpolation and runtime config are correct.

```bash
set -e
set -a
source .env.local
set +a
sshpass -p "$TENCENT_CLOUD_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$TENCENT_CLOUD_USER@$TENCENT_CLOUD_IP" \
  'set -e; cd /opt/changzhouai/app/source; set -a; source .env.selfhost.local; set +a; sudo -E docker compose -f docker-compose.app.yml up -d --build'
```

Expected note: Nextra may warn that no git repository exists under `/app` because `.git/` is intentionally excluded. Treat that as harmless if the build and runtime checks pass.

## Verification

Check container state:

```bash
set -e
set -a
source .env.local
set +a
sshpass -p "$TENCENT_CLOUD_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$TENCENT_CLOUD_USER@$TENCENT_CLOUD_IP" \
  'sudo docker ps --filter name=source-web-1 --format "{{.Names}} {{.Status}} {{.Ports}}"'
```

Check logs:

```bash
set -e
set -a
source .env.local
set +a
sshpass -p "$TENCENT_CLOUD_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$TENCENT_CLOUD_USER@$TENCENT_CLOUD_IP" \
  'cd /opt/changzhouai/app/source && set -a; source .env.selfhost.local; set +a; sudo -E docker compose -f docker-compose.app.yml logs --tail=80 web'
```

Check live routes:

```bash
curl -I -L --max-time 20 https://changzhouai.club/
curl -sL --max-time 20 https://changzhouai.club/ | rg -o "常州 AI Club|Changzhou AI Club|AI Club" -m 3
curl -I -L --max-time 20 https://changzhouai.club/events
```

Add route-specific checks when the release changes a specific page, for example `/works`, `/account/works/new`, `/admin/social`, or event detail pages.

## Report Back

Include:

- Commit hash or version released.
- Whether `origin/main` was already current or was pushed.
- Build result.
- Sync/rebuild result.
- Container status and live-domain checks.
- Any warnings that remain relevant.

If no code changed, say there was no commit to create.
