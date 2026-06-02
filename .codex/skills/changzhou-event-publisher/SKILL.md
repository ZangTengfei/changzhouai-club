---
name: changzhou-event-publisher
description: Publish Changzhou AI Club website events from natural-language announcements or organizer notes. Use when the user asks Codex to create, draft, publish, schedule, update, or validate an event for the 常州 AI Club / Changzhou AI Club community site without manually filling the admin website.
---

# Changzhou Event Publisher

## Workflow

Use the current repository root.

1. Extract only public event information: title, date/time, venue, city, summary, description, agenda, organizers, event type, registration note, external registration URL, status, and optional cover image URL.
2. Omit internal instructions, personal phone numbers, private group QR codes, and administrative contact details unless the user explicitly asks to publish them.
3. If the exact event time is unknown, set `event_at` to `null` and say that the public page will show “时间待定”. Do not invent a time.
4. Create an event JSON file under `output/event-publish/`. Use a lowercase ASCII slug such as `2026-05-15-opc-ai-manufacturing`.
5. Run a dry run first:

```bash
npm run event:publish -- --file output/event-publish/<slug>.json --dry-run
```

6. If validation passes and the user asked to publish, run:

```bash
npm run event:publish -- --file output/event-publish/<slug>.json
```

7. If the script reports that the slug already exists, do not overwrite by default. Ask once whether to update the existing event, then rerun with `--upsert` only if the user confirms or clearly asked to update.
8. Return the public path `/events/<slug>` and mention that the site cache may take a short moment to refresh.

## Event JSON

Use these fields. `title` and `slug` are required.

```json
{
  "title": "活动标题",
  "slug": "2026-05-15-event-slug",
  "summary": "一句话公开简介",
  "description": ["第一段活动介绍", "第二段活动介绍"],
  "event_at": "2026-05-15T14:00",
  "venue": "常州电信",
  "city": "常州",
  "agenda": ["签到与交流", "主题分享", "自由讨论"],
  "speaker_lineup": ["主办：...", "本地组织：..."],
  "event_type": "community",
  "registration_note": "报名后请在备注里填写必要对接信息，最终安排以组织方通知为准。",
  "registration_url": null,
  "cover_image_url": null,
  "status": "scheduled"
}
```

Allowed `status` values are `draft`, `scheduled`, `completed`, and `cancelled`. Use `scheduled` for an activity that should appear on the public events page.

Allowed `event_type` values are `community` and `external`. Use `external` for partner, government, institution, or other non-Changzhou AI Club hosted activities that should still appear on the site and support registration.

## Authentication

The publish script writes through Supabase using the service role key from `.env.local`. Never print, copy, or expose secret values. A dry run does not require credentials.

Do not automate the web admin form for normal event publishing. The website admin API depends on a browser cookie session and staff membership; the local script is the stable path for Codex-driven publishing.

## Safety Checks

- Always run `--dry-run` before writing.
- Keep raw source material in `output/` if you need a working note; do not add `files/` or `knowledge/` content to Git.
- The script rejects phone-like values in public fields by default. Remove the contact detail or use a generic instruction such as “请在报名备注中填写手机号或微信号”.
- Use `--allow-contact-info` only when the user explicitly confirms that the contact information is meant to be public.
