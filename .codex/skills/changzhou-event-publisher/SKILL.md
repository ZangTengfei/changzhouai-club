---
name: changzhou-event-publisher
description: End-to-end Changzhou AI Club event planning, launch, publishing, and promotion workflow. Use when the user asks Codex to plan, draft, prepare, publish, schedule, promote, update, or validate a 常州 AI Club / Changzhou AI Club event, including theme selection, agenda and venue/time confirmation, Feishu registration form prompts, registration links and QR codes, poster creation or QR overlay, website event publishing, WeChat group notices, and WeChat Official Account / Xiaohongshu / social platform copy packages.
---

# Changzhou Event Publisher

## Default Launch Workflow

Use the current repository root.

Use this workflow whenever the user is preparing a repeatable community event:

1. **Event framing**
   - Confirm the public event theme, title, target audience, topic scope, host/partner, and whether it should be public now.
   - Ask only for missing high-impact facts. If the user has already implied the pattern, proceed with reasonable assumptions and state them.
   - Keep internal motives, leadership visits, private sponsor discussions, and unconfirmed partner details out of public copy.
2. **Basic logistics**
   - Confirm or propose date/time, duration, venue, city, capacity if known, and whether parking details are needed.
   - If only “周六下午” or similar is known, use an explicit assumption such as `14:00-17:00` and make it easy to update later.
3. **Public copy package**
   - Draft a one-line summary, 1-2 paragraph description, agenda, speaker/host line, registration note, poster copy, and short CTA.
   - For Changzhou AI Club community-hosted events, include the community platform angle when appropriate: speakers share real practice and may connect to cooperation opportunities; the community structures demand, matches capabilities, and can support workflow customization/development rather than only serving as a free event organizer.
4. **Registration form**
   - Generate a Feishu form prompt if the form does not already exist. Keep it mobile-friendly and collect only necessary fields.
   - Include optional parking/license-plate collection only when the venue needs it. State that it is only for this event's parking registration.
5. **Registration URL and QR**
   - If a Feishu/browser session is available and the user asked you to operate it, use the browser/Chrome workflow to create the form.
   - If authentication or workspace access is not available, provide the generated prompt and ask the user to create/export the form link or QR code.
   - Decode or verify the final QR when possible, for example with OpenCV `QRCodeDetector`.
6. **Poster**
   - Put working assets under `output/posters/<slug>/`.
   - Use the community logo from `public/logo.png` unless a stronger current brand asset is provided.
   - For production posters, keep text and QR reliable: generated backgrounds are fine, but place exact text, logo, and real QR with deterministic local rendering.
   - If the user explicitly asks for a full image-generated poster, warn that model-drawn QR codes may not scan; replace with the real QR before publishing.
7. **Website publishing**
   - Upload the finished poster cover to Supabase Storage when publishing:

```bash
node .codex/skills/changzhou-event-publisher/scripts/upload-event-cover.mjs \
  --slug <slug> \
  --file output/posters/<slug>/<poster>.png
```

   - Create an event JSON file under `output/event-publish/`. Use a lowercase ASCII slug such as `2026-05-15-opc-ai-manufacturing`.
   - Run a dry run first:

```bash
npm run event:publish -- --file output/event-publish/<slug>.json --dry-run
```

   - If validation passes and the user asked to publish, run:

```bash
npm run event:publish -- --file output/event-publish/<slug>.json
```

   - If the script reports that the slug already exists, do not overwrite by default. Ask once whether to update the existing event, then rerun with `--upsert` only if the user confirms or clearly asked to update.
8. **Promotion package**
   - Draft a WeChat group notice, usually with emoji when the user asks for group copy.
   - Draft platform-ready copy for WeChat Official Account, Xiaohongshu, or other social channels when requested. Do not post to external social platforms unless the user explicitly asks and a trusted authenticated workflow is available.
   - Use the final poster and website/event link in all public-facing materials.
9. **Verification and handoff**
   - Verify the public site. Check the detail page and `/events` separately because page caches may refresh on different schedules:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy \
  curl --noproxy '*' -L https://changzhouai.club/events/<slug>
```

   - Return the public path `/events/<slug>`, the registration URL, poster path/cover URL, group notice, social copy paths if generated, verification result, and any cache note.
   - If durable event decisions or reusable operation notes were produced, create a concise draft under `output/session-knowledge/`.

## Standard Outputs

Use these locations unless the user asks otherwise:

- `output/event-publish/<slug>.json` for website publishing payloads.
- `output/posters/<slug>/` for poster source files, generated images, final poster, and QR assets.
- `output/social/<slug>/` for WeChat group notices, Official Account drafts, Xiaohongshu copy, short video captions, and captions for reposting.
- `output/session-knowledge/<date>-<slug>.md` for reviewable durable session notes.

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
4. 车牌号，选填，单行文本。说明：如开车前往，可填写车牌号，便于提前登记停车入场；不开车可不填。车牌号仅用于本次活动停车登记，不作其他用途。
5. 所在行业 / 职业方向，必填，单选：内容创作、电商运营、品牌/市场、产品/设计、技术开发、企业经营者、学生、其他
6. 当前相关经验，必填，单选：还没接触、尝试过工具、已在日常工作中使用、正在做商业化或项目落地
7. 最感兴趣的话题，必填，多选：<按活动主题列 6-8 个选项>
8. 希望现场交流的问题，选填，长文本
9. 是否愿意做 3-5 分钟简短分享，必填，单选：愿意、不确定、暂不分享
10. 备注，选填，长文本

提交成功页文案：
报名已提交，感谢关注 <活动标题>。活动具体安排以组织方后续通知为准，请保持手机或微信畅通。

表单风格要求：简洁、专业、偏科技感，不要收集不必要的隐私信息。
```

## WeChat Group Notice

Use this shape for group announcements and adapt the tone to the group:

```text
🚀 常州 AI Club 本周活动报名开启

🎯《<活动标题>》

这次我们会围绕 <一句话主题>，从真实案例和现场讨论出发，看看 AI 怎么真正进入工作流和项目落地。

📅 时间：<日期 + 星期 + 时间>
📍 地点：<地点>
🤝 举办：<主办/联合举办>
🌐 详情：<官网活动链接>

适合这些朋友：
✅ <人群 1>
✅ <人群 2>
✅ <人群 3>

现场会聊：
1. <话题 1>
2. <话题 2>
3. <话题 3>

🚗 如需开车前往，可在报名表填写车牌号，便于提前登记停车。

👇 扫码或点击链接报名
<报名链接>
```

## Social Promotion Package

When the user asks for公众号/小红书/社媒发布素材, produce a compact package:

- **公众号**: title options, intro paragraph, event highlights, agenda, registration CTA, poster placement note, and concise closing.
- **小红书**: 2-3 title options, short hook, bullet highlights, who should join, registration CTA, hashtags.
- **朋友圈/视频号/短视频 caption**: one short version under 120 Chinese characters plus a slightly longer version.
- Include the event URL, registration URL, poster path, and whether the QR was decoded/verified.
- Do not claim official endorsement, guaranteed project opportunities, or partner commitments beyond confirmed facts.

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
