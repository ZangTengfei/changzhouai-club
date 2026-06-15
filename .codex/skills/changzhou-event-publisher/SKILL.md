---
name: changzhou-event-publisher
description: End-to-end Changzhou AI Club event launch workflow. Use when the user asks Codex to plan, draft, publish, schedule, update, or validate a 常州 AI Club / Changzhou AI Club event, including confirming the event theme, generating a Feishu registration-form prompt, creating or preparing the Feishu form link and QR code, making an event poster with community logo and registration QR, uploading the poster cover, and publishing the event to the community website without manually filling the admin website.
---

# Changzhou Event Publisher

## Core Workflow

Use the current repository root.

1. Confirm the public event theme and minimum facts: title, date/time, venue, city, target audience, topic scope, host/partner, and whether it should be public now.
2. Draft public copy: one-line summary, 1-2 paragraph description, agenda, speaker/host line, registration note, and poster copy. For Changzhou AI Club community-hosted events, also remind the user to include the community platform angle: speakers share real practice and may connect to cooperation opportunities, while the community structures demand, matches capabilities, and can support workflow customization/development rather than only serving as a free event organizer.
3. Generate a Feishu form prompt if the form does not already exist. Keep it mobile-friendly and collect only necessary fields.
4. Create or obtain the Feishu registration URL and QR code:
   - If a Feishu/browser session is available and the user asked you to operate it, use the browser/Chrome workflow to create the form.
   - If authentication or workspace access is not available, provide the generated prompt and ask the user to create/export the form link or QR code.
   - Decode or verify the final QR when possible, for example with OpenCV `QRCodeDetector`.
5. Make the poster:
   - Put working assets under `output/posters/<slug>/`.
   - Use the community logo from `public/logo.png` unless a stronger current brand asset is provided.
   - For production posters, keep text and QR reliable: generated backgrounds are fine, but place exact text, logo, and real QR with deterministic local rendering.
   - If the user explicitly asks for a full image-generated poster, warn that model-drawn QR codes may not scan; replace with the real QR before publishing.
6. Upload the finished poster cover to Supabase Storage when publishing:

```bash
node .codex/skills/changzhou-event-publisher/scripts/upload-event-cover.mjs \
  --slug <slug> \
  --file output/posters/<slug>/<poster>.jpg
```

7. Create an event JSON file under `output/event-publish/`. Use a lowercase ASCII slug such as `2026-05-15-opc-ai-manufacturing`.
8. Run a dry run first:

```bash
npm run event:publish -- --file output/event-publish/<slug>.json --dry-run
```

9. If validation passes and the user asked to publish, run:

```bash
npm run event:publish -- --file output/event-publish/<slug>.json
```

10. If the script reports that the slug already exists, do not overwrite by default. Ask once whether to update the existing event, then rerun with `--upsert` only if the user confirms or clearly asked to update.
11. Verify the public site. Check the detail page and `/events` separately because page caches may refresh on different schedules:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy \
  curl --noproxy '*' -L https://club.occcc.cc/events/<slug>
```

12. Return the public path `/events/<slug>`, the registration URL, the poster path/cover URL, and any cache note.

## Feishu Registration Form Prompt

Use this structure and adapt fields to the event. Do not add private or excessive fields.

```text
请帮我生成一份活动报名表。

活动名称：<活动标题>
主办方：常州 AI Club
活动时间：<日期和时间>
活动地点：<地点>
活动简介：<1-2 句话说明活动主题、适合人群和交流内容>

请生成一个简洁、适合手机填写的报名表，包含以下字段：

1. 昵称 / 姓名，必填，单行文本
2. 手机号，必填，手机号格式
3. 微信号，选填，单行文本
4. 所在行业 / 职业方向，必填，单选：内容创作、电商运营、品牌/市场、产品/设计、技术开发、企业经营者、学生、其他
5. 当前相关经验，必填，单选：还没接触、尝试过工具、已在日常工作中使用、正在做商业化或项目落地
6. 最感兴趣的话题，必填，多选：<按活动主题列 6-8 个选项>
7. 希望现场交流的问题，选填，长文本
8. 是否愿意做 3-5 分钟简短分享，必填，单选：愿意、不确定、暂不分享
9. 备注，选填，长文本

提交成功页文案：
报名已提交，感谢关注 <活动标题>。活动具体安排以组织方后续通知为准，请保持手机或微信畅通。

表单风格要求：简洁、专业、偏科技感，不要收集不必要的隐私信息。
```

## Community Platform Messaging

For future event posters, registration pages, opening remarks, and host scripts, include a short practical community-promotion segment when appropriate:

- Do not only say abstract phrases such as “连接大家” or “共同学习”.
- State the concrete flywheel: real case sharing can bring speakers visibility and cooperation requests; this attracts stronger speakers and better scenarios.
- Also state the community's own role and “self-interest”: Changzhou AI Club wants to become a cooperation platform, not a pure公益活动 organizer. It can help structure demand, connect scenario owners with practitioners, and turn needs into workflows, prototypes, or projects.
- Keep the wording balanced: do not promise guaranteed leads or imply that every cooperation request belongs to the community.

Reusable Chinese lines:

```text
来常州 AI Club 分享真实实践，不只是一次曝光，也可能连接到本地企业、团队和项目方的真实合作机会。

我们办活动不只是为了热闹，也有一点自己的私心：希望把本地真实需求、AI 实践者和可交付的工作流组织到一个平台里。大家有场景、有能力、有项目，都可以在这里被看见、被梳理、被对接。

社区可以协助把一个模糊需求拆成具体场景、工作流、原型或项目合作；视频方向可以是 AI 视频工作流，其他方向也可以沉淀成对应的行业工作流。
```

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
- Do not publish private group QR codes, unreviewed screenshots, raw报名名单, phone numbers, WeChat IDs, or internal organizer notes.
- The script rejects phone-like values in public fields by default. Remove the contact detail or use a generic instruction such as “请在报名备注中填写手机号或微信号”.
- Use `--allow-contact-info` only when the user explicitly confirms that the contact information is meant to be public.
- After deploying website code changes, verify both the detail page and `/events`; homepage and events-page visibility can intentionally differ.
