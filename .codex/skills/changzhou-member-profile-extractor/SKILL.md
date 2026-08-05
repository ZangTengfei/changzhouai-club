---
name: changzhou-member-profile-extractor
description: Extract, review, and optionally import private Changzhou AI Club member profiles from historical salon AI summaries and paired transcript files. Use when the user asks to screen people from activity recordings or transcripts,整理历史活动成员画像,更新成员池,生成或复核别名映射,把逐字稿资料关联网站活动, or import the resulting profiles into the private admin member-profile system.
---

# Changzhou Member Profile Extractor

Use the repository root `/Users/nobugai/develop/changzhouai-club`. Treat all source material, identity judgments, aliases, observations, and generated profiles as private member data.

## Current Capability Boundary

- Process existing paired salon materials: an AI summary ending in `-AI 沙龙.md` and, when available, a transcript ending in `-transcript.txt`.
- Extract profile observations from named introductions and named-speaker sections in the AI summary. The current importer records the paired transcript filename as evidence but does not parse the full transcript body.
- Do not claim that raw audio transcription, transcript upload, model API processing, automatic account linking, or public profile publishing exists. Read `docs/member-private-profile-roadmap.md` when the user asks about those future capabilities.
- Use the existing importer at `scripts/import-member-private-profiles.mjs`; do not recreate extraction logic inside the Skill.

## Workflow

### 1. Inspect Before Processing

1. Read `AGENTS.md`, check `git status --short --branch`, and preserve unrelated user changes.
2. Resolve the source directory explicitly. Keep original recordings, transcripts, and exports outside tracked source directories; prefer `files/` for originals and `output/` for working artifacts.
3. Inspect representative files and confirm the filename pattern. Never print large transcript excerpts or lists of private member details into tool output or the final response.
4. Read these implementation anchors when behavior or schema details matter:
   - `scripts/import-member-private-profiles.mjs`
   - `supabase/migrations/20260805143000_member_private_profiles.sql`
   - `docs/member-private-profile-roadmap.md`

### 2. Apply Identity and Privacy Rules

- Match a source activity to the website event by its `Asia/Shanghai` calendar date only. Treat equal dates as the same event even when the AI-generated title differs. Preserve the AI title only as evidence metadata; never use it as an event key.
- If no website event exists on that date, keep the evidence `unmatched`. If multiple website events exist on that date, keep it `ambiguous_date`. Do not choose by title similarity.
- Create candidates only for a real name or a stable, reviewable identifier. Skip generic labels such as `Speaker 1`, “某负责人”, “参会者”, or profession-only descriptions.
- Skip entries explicitly describing minors unless a dedicated guardian-consent and protection process has been approved.
- Treat partial names, English nicknames, honorifics, ASR spelling variants, and identical names across organizations as unresolved identity evidence. Do not merge them automatically.
- Keep aliases in the ignored private file `output/member-private-profiles/aliases.json`. Never place real aliases or member data inside this Skill, Git history, `content/`, or `public/`.
- Use an alias only after manually reviewing source context. Prefer a date-scoped key when the same observed label could identify different people:

```json
{
  "2026-01-01|观察到的称呼": "复核后的姓名",
  "全局唯一且已确认的别名": "复核后的姓名"
}
```

- Treat roles, organizations, industries, capabilities, interests, needs, and offers as source-backed observations, not verified facts. Preserve conflicting evidence for review instead of silently overwriting it.
- Never infer or add sensitive traits such as health status, finances, political views, precise location, family circumstances, or private contact details.

### 3. Run a Dry Run First

Use a private alias file only if it exists and has been reviewed:

```bash
npm run members:profiles:import -- \
  --source '<历史活动资料目录>' \
  --aliases output/member-private-profiles/aliases.json \
  --dry-run
```

Omit `--aliases` when no reviewed mapping exists. The dry run must succeed before any write. Report only aggregate counts unless the user explicitly asks to review individual identities:

- summary files and paired transcript files;
- identifiable observations and private profiles;
- partial identities;
- skipped anonymous and minor entries;
- distinct event dates.

Investigate unexpected zero counts, missing pairs, date parsing failures, unusually high partial-identity counts, and duplicate-looking identities before proceeding.

### 4. Review Before Applying

Do not treat a successful parser run as identity verification. Review:

1. ambiguous or partial identities;
2. alias decisions and possible same-name collisions;
3. organization or role contradictions;
4. anonymous and minor exclusions;
5. whether the user asked only for analysis or explicitly wants a database import.

Default to stopping after the dry run and review summary. Run `--apply` only when the user has clearly requested importing/updating the private backend and the target environment is confirmed.

### 5. Apply to the Private Backend

Confirm that migration `20260805143000_member_private_profiles.sql` is present in the target database. If a targeted migration is required and the user authorized the environment change, use the repository's scoped migration workflow rather than applying unrelated migrations.

Then run:

```bash
npm run members:profiles:import -- \
  --source '<历史活动资料目录>' \
  --aliases output/member-private-profiles/aliases.json \
  --apply
```

The importer uses service credentials from `.env.local`. Never print or copy credential values. Re-running the same source is intended to be idempotent through profile keys and evidence fingerprints.

### 6. Verify the Result

- Confirm the command reports the expected profile/evidence counts and separate `matchedByDate`, `ambiguousDate`, and `unmatched` counts.
- Treat any ambiguous or unmatched event evidence as a review queue, not a successful association.
- Check the private admin page at `/admin/member-profiles` only with an authorized L3 account.
- Verify private profile APIs reject unauthenticated and unauthorized access. Do not expose these fields through public website or mini-program APIs.
- Leave account association for explicit human review in the backend. Do not auto-link a profile to a mini-program account by name alone.
- Summarize verification with aggregate counts and unresolved categories. Do not paste the member list into the final response.

## Stop Conditions

Stop before a write and ask for direction when:

- the source directory, target environment, or user intent to import is unclear;
- the date cannot be resolved reliably;
- one date maps to multiple website events;
- identity conflicts cannot be resolved from source evidence;
- source handling would require publishing, sending data to a third-party model, or processing sensitive/minor data beyond the approved boundary.

If the user asks for future automatic upload or model enrichment, produce or update a roadmap only unless implementation is explicitly requested. Keep model outputs as review candidates with source evidence; never make them authoritative or public automatically.
