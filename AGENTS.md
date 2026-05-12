# Repository Workflow

After every successful code change, automatically stage and commit the changes unless the user explicitly says not to commit.

Rules:
- Commit after verification when feasible.
- Use a concise commit message describing the change.
- Do not wait for the user to ask for a commit.
- If there are unrelated user changes in the worktree, avoid committing them unless they are part of the requested task.
- If a commit would be risky or ambiguous, ask once before committing.

# Local Knowledge Workspace

This repository also contains local-only community knowledge directories that are intentionally ignored by Git:

- `output/`: temporary generated artifacts, drafts, intermediate analysis files, and files that can be regenerated or discarded.
- `files/`: original source materials and large/binary assets, such as cloud-drive exports, photos, PDFs, audio/video, slide decks, posters, and finished media files.
- `knowledge/`: the Obsidian knowledge base for structured community memory, such as event notes, recaps, meeting summaries, SOPs, people profiles, content planning, and other durable Markdown knowledge.

When producing new files:
- Put temporary work products in `output/` first.
- Put original materials and finalized binary/media exports in `files/`.
- Put durable Markdown knowledge and Obsidian notes in `knowledge/`.
- Only copy curated, publishable content into tracked website directories such as `content/` or `public/`.
- Do not add `files/` or `knowledge/` contents to Git unless the user explicitly requests it.
- Use Chinese names for `knowledge/` directories, files, and note titles when possible. Follow the local guide at `knowledge/00_知识库规范/知识库规范.md` when creating or organizing knowledge notes.

# cc-connect Integration

This project is managed via cc-connect, a bridge to messaging platforms.

## Scheduled tasks (cron)

When the user asks you to do something on a schedule, such as "every day at 6am" or "every Monday morning", use the Bash/shell tool to run:

```bash
cc-connect cron add --cron "<min> <hour> <day> <month> <weekday>" --prompt "<task description>" --desc "<short label>"
```

Environment variables `CC_PROJECT` and `CC_SESSION_KEY` are already set. Do not specify `--project` or `--session-key`.

Examples:

```bash
cc-connect cron add --cron "0 6 * * *" --prompt "Collect GitHub trending repos and send a summary" --desc "Daily GitHub Trending"
cc-connect cron add --cron "0 9 * * 1" --prompt "Generate a weekly project status report" --desc "Weekly Report"
```

To list or delete cron jobs:

```bash
cc-connect cron list
cc-connect cron del <job-id>
```

## Send message to current chat

To proactively send a message back to the user's chat session, use `--stdin` for long or multi-line messages:

```bash
cc-connect send --stdin <<'CCEOF'
your message here
CCEOF
```

For short single-line messages:

```bash
cc-connect send -m "short message"
```
