---
name: changzhou-project-opportunity-publisher
description: End-to-end Changzhou AI Club project collaboration opportunity launch workflow. Use when the user asks Codex to draft, publish, update, validate, or verify a 项目协作 / 协作机会 / 共建项目 / 比赛项目征集 / 项目经理招募 entry for the Changzhou AI Club website, including deciding whether it belongs under /projects, preparing an external or Feishu application form link, writing a project opportunity JSON file, running the project:publish dry run, publishing to Supabase, and verifying /projects plus the detail page.
---

# Changzhou Project Opportunity Publisher

## Core Workflow

Use the current repository root.

1. Confirm the publishing surface:
   - Use `/projects` for ongoing collaboration, project recruitment, project allocation, competition pre-registration, partner needs, project manager roles, or anything that needs screening and follow-up.
   - Use the event publisher as well only when there is a time-bound public activity that should appear under `/events`.
2. Confirm the minimum facts: title, target audience, collaboration goal, support provided, application path, owner or partner, deadline, visibility, and whether it should be public now.
3. Draft public copy: one-line summary, 1-3 paragraph description, role tags, topic tags, headcount label, time commitment, compensation or support, application CTA, and application note.
4. Prepare an application path:
   - If an external or Feishu form already exists, put it in `external_application_url`.
   - If the project should collect applications on the website, omit `external_application_url` and decide whether `application_requires_login` should be true.
   - Do not publish private group QR codes, raw contact lists, or unreviewed screenshots.
5. Create a JSON file under `output/project-publish/`. Use a lowercase ASCII slug such as `2026-songjianhu-opc-challenge-projects`.
6. Run a dry run first:

```bash
npm run project:publish -- --file output/project-publish/<slug>.json --dry-run
```

7. If validation passes and the user asked to publish, run:

```bash
npm run project:publish -- --file output/project-publish/<slug>.json
```

8. If the script reports that the slug already exists, do not overwrite by default. Ask once whether to update the existing opportunity, then rerun with `--upsert` only if the user confirms or clearly asked to update.
9. Verify the public site:

```bash
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy \
  curl --noproxy '*' -L https://club.occcc.cc/projects/<slug>
```

10. Return the public path `/projects/<slug>`, application URL, publish mode, and any cache note. If a matching event was also used, return that event path separately.

## Feishu Application Form Prompt

Use this structure and adapt fields to the opportunity. Keep it mobile-friendly and collect only what is needed for screening or follow-up.

```text
请帮我生成一份项目协作预登记表。

项目名称：<项目/协作机会标题>
发起方：常州 AI Club
项目简介：<1-2 句话说明项目方向、适合人群和支持方式>
后续安排：<筛选、辅导、资源对接、项目分配或正式报名节奏>

请生成一个简洁、适合手机填写的预登记表，包含以下字段：

1. 昵称 / 姓名，必填，单行文本
2. 手机号，必填，手机号格式
3. 微信号，选填，单行文本
4. 当前身份 / 方向，必填，单选：AI 应用实践者、技术开发、产品/设计、内容创作者、电商/运营、企业经营者、学生、其他
5. 想参与的项目方向，必填，多选：<按项目列 5-8 个选项>
6. 当前项目或能力基础，必填，长文本
7. 可投入时间，必填，单选：每周 1-2 小时、每周 3-5 小时、每周 5 小时以上、视项目安排
8. 希望获得的支持，必填，多选：项目解读、报名辅导、技术咨询、资源对接、团队匹配、商业化建议、其他
9. 作品/项目链接，选填，单行文本
10. 备注，选填，长文本

提交成功页文案：
预登记已提交，感谢关注 <项目名称>。社区会根据项目情况进行初筛和后续对接，请保持手机或微信畅通。

表单风格要求：简洁、专业、偏科技感，不要收集不必要的隐私信息。
```

## Project JSON

Use these fields. `title`, `slug`, and `summary` are required.

```json
{
  "title": "协作机会标题",
  "slug": "2026-06-example-project",
  "summary": "一句话公开简介",
  "description": ["第一段项目介绍", "第二段筛选或支持说明"],
  "opportunity_type": "project",
  "status": "recruiting",
  "visibility": "public",
  "role_tags": ["AI 实践者", "技术开发"],
  "topic_tags": ["AI 应用", "软件开发"],
  "headcount_label": "名额或项目数量",
  "time_commitment": "预计投入时间",
  "compensation": "奖金、补贴、资源支持或待定",
  "deadline_at": "2026-06-25T23:59",
  "location": "常州 / 线上",
  "application_cta": "申请参与",
  "application_note": "提交后社区会进行初筛和后续对接。",
  "external_application_url": null,
  "application_requires_login": false,
  "is_featured": false,
  "sort_order": 0
}
```

Allowed `opportunity_type` values are `crowdsource`, `project`, `project_manager`, `enterprise`, `role`, and `idea`. Use `project` for most collaboration opportunities, `project_manager` for PM/operator recruitment, `enterprise` for company needs, and `role` for role-specific recruitment.

Allowed `status` values are `draft`, `recruiting`, `matching`, `in_progress`, `filled`, `closed`, and `archived`. Use `recruiting` for a public opportunity that should accept applications now.

Allowed `visibility` values are `public`, `members`, and `private`.

## Authentication

The publish script writes through Supabase using the service role key from `.env.local`. Never print, copy, or expose secret values. A dry run does not require credentials.

Do not automate the web admin form for normal project opportunity publishing. The website admin API depends on a browser cookie session and staff membership; the local script is the stable path for Codex-driven publishing.

## Safety Checks

- Always run `--dry-run` before writing.
- Keep drafts and source notes under `output/`; do not add `files/` or `knowledge/` content to Git unless explicitly requested.
- The script rejects phone-like values in public fields by default. Remove the contact detail or use a generic instruction such as "请在报名表中填写手机号或微信号".
- Use `--allow-contact-info` only when the user explicitly confirms the contact information is meant to be public.
- For competitions, accelerators, or government/partner calls, prefer an external pre-registration link when the community needs to screen, train, or allocate applicants before official报名.
- After publishing, verify both `/projects` and `/projects/<slug>`. If a matching event also exists, verify `/events/<slug>` separately because the two surfaces have different operating purposes.
