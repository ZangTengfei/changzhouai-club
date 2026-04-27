# Repository Workflow

After every successful code change, automatically stage and commit the changes unless the user explicitly says not to commit.

Rules:
- Commit after verification when feasible.
- Use a concise commit message describing the change.
- Do not wait for the user to ask for a commit.
- If there are unrelated user changes in the worktree, avoid committing them unless they are part of the requested task.
- If a commit would be risky or ambiguous, ask once before committing.

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
