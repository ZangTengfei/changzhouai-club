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
- When preparing materials for community co-builders, follow `knowledge/00_知识库规范/共建资料同步规范.md`: treat local `knowledge/` and `files/` as the source of truth, generate reviewed sync packages under `output/`, and never include `visibility: private` source material unless the user explicitly approves a sanitized summary.

Session knowledge capture:
- When a session produces durable community knowledge, operational decisions, reusable runbooks, event/project context, or follow-up tasks, create a reviewable Markdown draft under `output/session-knowledge/` before ending the work.
- Keep the draft concise: include the date, source session summary, key decisions, useful paths/commands, open follow-ups, and any privacy or verification notes.
- Do not write raw transcripts, secrets, private contact details, unreviewed member data, or speculative conclusions into `knowledge/`.
- Move or rewrite the draft into `knowledge/` only when the user explicitly asks to archive, publish, sync, or preserve it as durable knowledge. Follow the `knowledge/00_知识库规范/` guides when doing so.

# Project-local Skills

This repository keeps project-specific Codex skill instructions under `.codex/skills/`.

For Changzhou AI Club website event publishing, use `.codex/skills/changzhou-event-publisher/SKILL.md` and the repository script `npm run event:publish`. Keep this skill project-local because it writes to this website's Supabase project and should not implicitly apply to unrelated repositories.
