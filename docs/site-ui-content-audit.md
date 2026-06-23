# 整站 UI / 文案审查与优化追踪

> 审计日期：2026-06-23　·　审计范围：`src/app/(site)` 全部公共页面 + 全局组件 + `src/app/globals.css` 设计系统 + `src/components/ui/*`
> 维护方式：每完成一条把 `- [ ]` 改为 `- [x]`，并在文末「变更记录」补一行。ID 稳定不变，便于 PR / issue 引用。

## 状态图例

- `[ ]` 待处理　·　`[~]` 进行中　·　`[x]` 已完成　·　`[-]` 决定不修（附理由）

## 进度总览

| 分类 | P0 | P1 | P2 | 小计 | 完成 |
|------|----|----|----|------|------|
| 立即修复（硬伤） | 9 | — | — | 9 | 0 |
| 设计系统（DS） | 2 | 4 | 2 | 8 | 0 |
| 文案一致性（CW） | — | 5 | 2 | 7 | 0 |
| 信息架构与转化（IA） | — | 6 | — | 6 | 0 |
| 可访问性（A11Y） | — | 4 | 1 | 5 | 0 |
| 报告数据可信度（DATA） | — | 2 | 1 | 3 | 0 |
| **合计** | **11** | **21** | **6** | **38** | **0** |

---

## 一、立即修复（P0 · 硬伤，建议先做）

- [ ] **FIX-01**　about 页出现内部交付话术泄漏　`src/app/(site)/about/page.tsx:116`
  - 原文：「你给的设计理念图里最重要的不是一个图形，而是一套关于连接的解释。」"你给的"是设计稿评审口语。
  - 建议：改为中性表述，如「这套标识的核心不是图形本身，而是一套关于连接的解释。」
- [ ] **FIX-02**　首页主按钮绿色不达 WCAG AA 且与全站不一致　`src/app/globals.css:379,384`
  - `#0d8b5f`（白字对比度仅 **4.31:1，FAIL AA 4.5**），hover `#087549`；全站 `--accent #0f7a6a` 为 5.23:1 达标。
  - 建议：`.home-primary-button` 改回 `var(--accent)`，hover 改 `var(--accent-strong)`。
- [ ] **FIX-03**　`300+` 成员数硬编码、无来源，且 `/join` 转化页反而无社会证明　`src/app/(site)/page.tsx:219,345,574`
  - hero proof、stats panel、join banner 三处写死；经费稿里已有 300+/7+/3 份调研。
  - 建议：接真实成员数或注明口径与更新时间；把数据搬到 `/join` Hero。
- [ ] **FIX-04**　全站无隐私政策，却在收集手机号/微信　`cooperate/page.tsx`、`account-profile-form.tsx`、`email-auth-form.tsx`
  - `grep` 无 `/privacy`、`/terms`，表单无数据用途说明。
  - 建议：表单底部加「提交即表示同意我们用以上信息与你联系」+ 一份简要隐私说明页。
- [ ] **FIX-05**　报告中心缺失经费申请稿入口　`src/app/(site)/reports/page.tsx:23`
  - 列表只有 3 篇，`opc-community-funding`（含 100 万预算、面向科教城的关键转化物料）只能直链。
  - 建议：加入列表并标注「经费申请汇报（演示稿）」。
- [ ] **FIX-06**　报名 loading 用 ASCII 点　`src/components/event-registration-form.tsx:126`
  - "正在检查你的报名状态..." 应为中文省略号「……」；顺手扫全站其它 `...`。
- [ ] **FIX-07**　项目详情错误提示与校验逻辑不符　`src/app/(site)/projects/[slug]/page.tsx:53`
  - 提示「请填写微信号和手机号，邮箱可以选填。」但表单两字段均标「（必填）」、邮箱「（选填）」。
  - 建议：改为「请填写微信号和手机号。」并与 `actions` 真实校验对齐。
- [ ] **FIX-08**　合作/活动提议表单联系字段 placeholder 错位　`cooperate/page.tsx:129-137`、`events/propose/page.tsx:150,159`
  - 微信号、手机号两个字段 placeholder 都是「微信或手机号至少填一项」。
  - 建议：各自清晰 placeholder（如「用于沟通排期」「用于紧急联系」）+ 字段下统一约束小字。
- [ ] **FIX-09**　sponsor 详情页暴露后台元数据　`src/app/(site)/sponsors/[slug]/page.tsx:119-125`
  - 展示「展示排序：{displayOrder}」「赞助者链接：/sponsors/{slug}」对终端用户无意义。
  - 建议：移除这两项，或仅在管理员视角显示。

---

## 二、设计系统收敛（DS · 系统性根因）

> 现状：`globals.css` 原生 CSS 类是事实主轨（`.button` 用 72 次）；`components/ui/*` shadcn 体系被边缘化；admin / docs / reports 各自一套子主题令牌（`--admin-*` / `--deck-*`）—— 四套并行。

- [ ] **DS-01 (P0)**　绿色 token 收敛：全站至少 6 种绿色绕过 `--accent`
  - `#0f7a6a`(令牌)、`#0d5f53`(令牌)、`#0d8b5f`(home-primary，见 FIX-02)、`#087549`、`#11835f`(`home-visual-assets.tsx:85,165,169`)、`#1a9f87`(reports 图表)。
  - 建议：绿色只留 `--accent` / `--accent-strong` 两个语义色，其余引用令牌。
- [ ] **DS-02 (P0)**　确立单一按钮主轨，收敛三套规格
  - `.button`(44px/胶囊)、`.home-primary-button`(**54px/方角**)、`ui/button.tsx`(**36px**) 并存；首页 54px 方角与同页胶囊按钮混排违和。
  - 建议：以 `.button` 为唯一主按钮，`home-primary-button` 降为大小变体或删除；`ui/button.tsx` 高度/圆角对齐到 44px/999px。
- [ ] **DS-03 (P1)**　圆角令牌化：337 处裸值、近 20 种　`999/28/24/22/20/18/16/14/12/10…`
  - 令牌 `--radius-lg/md/sm=28/18/12` 形同虚设；`14px` 不在体系内。
  - 建议：归并到 `12/18/28 + --radius-pill(999px)` 四档，全量替换裸值。
- [ ] **DS-04 (P1)**　阴影令牌化：134 处 `box-shadow`，仅 4 处用令牌
  - 建议：收敛到 `--shadow-sm/md/lg` 三档。
- [ ] **DS-05 (P1)**　字体衬线回退补 Windows 选项　`globals.css:240`
  - 标题 `"Iowan Old Style"` 仅 macOS/iOS，Windows 退化为通用 serif，标题与正文差异变大。
  - 建议：`"Songti SC"` 后补 `"SimSun","Noto Serif SC",serif`；admin/docs 字体栈统一引用 `var(--font-display)` 而非各自重写。
- [ ] **DS-06 (P1)**　Tailwind `@theme` 与原生 CSS 变量同名不同值　`globals.css:3-28`
  - `--radius-lg` Tailwind 侧≈14.4px、原生侧 28px；`--muted` 两套语义（背景 surface vs 文字色）。
  - 建议：消除同名冲突，明确 Tailwind 侧命名（如 `--color-muted-text` 区分文字色）。
- [ ] **DS-07 (P2)**　响应式断点统一：30+ 种 `max-width` 碎片化
  - 各页用 `520/640/720/760/800/820/860/980/1024/1080/1120` 等，不同宽度各自塌缩。
  - 建议：归并到 `640/820/1024` 三档。
- [ ] **DS-08 (P2)**　清理死代码 / 边缘组件　`src/components/ui/`
  - `tabs` 零引用、`card`/`badge` 各 1 次（职责被 `.pill`/`.surface` 取代）。
  - 建议：删 `tabs`；决定 `card`/`badge` 去留——若保留 shadcn 体系则让其取代 `.pill`/`.surface`，避免两套并存让后续开发者困惑。

---

## 三、文案一致性（CW）

- [ ] **CW-01 (P1)**　品牌英文名 4 种写法　header `ChangzhouAI.Club` / about `CHANGZHOU AI CLUB` / brand-lab `Changzhou AI Club` / hero `AI Club`
  - 建议：在 `src/lib/site-data.ts` 新增 `siteName` / `siteNameEn` 常量统一引用。
- [ ] **CW-02 (P1)**　同一「加入」动作 5 种说法　加入社区 / 申请加入 / 加入我们 / 加入我们
  - 建议：统一为「申请加入」（需审核），footer 同步。
- [ ] **CW-03 (P1)**　占位/兜底文案不统一　「待更新」/「时间待定」/「待公布」混用（如 `page.tsx:32-44` `formatMetricDate`）
  - 建议：统一为「待公布」一类口径。
- [ ] **CW-04 (P1)**　报告 footer 时间格式不一　「报告生成时间」/「报告整理时间」，OPC 带秒 `17:02:55`
  - 建议：统一字段名与格式（去掉时分秒）。
- [ ] **CW-05 (P1)**　成员故事兜底是假数据　`src/app/(site)/page.tsx:131-160`
  - 无真实成员时回退到「社区成员 / AI 爱好者」通用文案，可能误导用户。
  - 建议：明确标注「示例」或改为空状态引导。
- [ ] **CW-06 (P2)**　首页副标偏文艺抽象　`page.tsx:392`「活动不是终点，而是让问题、伙伴和项目进入同一个现场」；`page.tsx:446`「活动已开放报名，报名状态以活动详情页为准。」一句两「报名」
  - 建议：改具体收益表述；精简为「报名请以活动详情页为准。」
- [ ] **CW-07 (P2)**　活动详情 gallery 标题恒为活动名　`src/app/(site)/events/[slug]/page.tsx:433`
  - 每张照片 `<h3>{event.title}</h3>` 重复，冗余且不利 SEO/a11y。
  - 建议：有 caption 用 caption，无则不渲染 h3 或用「现场照片 N」。

---

## 四、信息架构与转化（IA）

- [ ] **IA-01 (P1)**　列表页普遍缺搜索/筛选　`members`、`projects`、`events`(往期)
  - 成员页只能按固定顺序翻页，与「找到正在做 AI 的人」定位不符。
  - 建议：复用 works 页筛选面板模式，加角色/城市/技能筛选 + 关键词搜索。
- [ ] **IA-02 (P1)**　详情页无「相关推荐」出口　`events/[slug]`、`projects/[slug]`、`updates/[updateId]`
  - 读完即流失。建议各加 2-3 条同类推荐（同类型往期活动 / 同角色标签项目）。
- [ ] **IA-03 (P1)**　`/join` Hero 缺真实社会证明　`src/app/(site)/join/page.tsx:114`
  - 转化最关键页当前零背书。建议把 300+/7+ 场活动搬上 Hero。
- [ ] **IA-04 (P1)**　FAQ 覆盖不足且无出口　`src/lib/site-data.ts:179-210`
  - 仅 6 条，未覆盖「收费吗/活动收费吗/资料谁可见/怎么注销/未成年能否参加」；无「没找到答案？联系我们」CTA。
- [ ] **IA-05 (P1)**　报告页无下载/分享　`reports/*.tsx`
  - B 端报告不可下载转发是硬伤。建议加 PDF/打印 + 分享按钮。
- [ ] **IA-06 (P1)**　导航 8 项偏长　`src/lib/site-data.ts:1-10`
  - 桌面端 1024 断点可能换行。建议把「案例库/项目协作」或「成员地图」折叠进二级。

---

## 五、可访问性（A11Y）

- [ ] **A11Y-01 (P1)**　`<img>` 缺 alt：37 个中 26 个无 alt（70%）　首页/archive/admin 为重灾区
  - 建议：装饰图 `alt=""`，内容图写描述（WCAG 1.1.1）。
- [ ] **A11Y-02 (P1)**　前台输入框无 focus 样式　`globals.css:595+`（`.input`/`.textarea`）
  - 仅 admin 覆写有聚焦反馈。建议补 `:focus-visible` 边框/ring。
- [ ] **A11Y-03 (P1)**　可点击区域 < 44px　`.pill`(34px)、`.member-signal-pill-compact`(24px)、`.field-meta-tag`
  - 建议：作为可交互元素时提至 ≥44px（WCAG 2.5.5）。
- [ ] **A11Y-04 (P1)**　首页轮播不支持 `prefers-reduced-motion`　`src/components/hero-photo-carousel.tsx:78-90`
  - 定时器始终运行。建议监听 reduced-motion 关闭 auto-advance + 鼠标悬停暂停。
- [ ] **A11Y-05 (P2)**　经费演示稿锁滚动 + 劫持空格 + `role="application"`　`reports/opc-community-funding/deck-controls.tsx:63-122`
  - 对屏幕阅读器不友好，全局空格被拦截。
  - 建议：限制键盘劫持范围，提供明显的「退出演示」出口，非激活 slide 对 SR 隐藏。

---

## 六、报告数据可信度（DATA）

- [ ] **DATA-01 (P1)**　问卷样本量小且未注明渠道　三份报告（16/23/30 份）
  - 均无调研渠道、回收时间窗、是否加权。
  - 建议：每篇 hero 注明「调研渠道：XX 交流群 + 线下活动 / 回收期：2026-04 至 05」。
- [ ] **DATA-02 (P1)**　饼图 0 值项仍渲染 + 对色弱/SR 不友好　`opc-package-survey/page.tsx:84` 等，纯 CSS `conic-gradient`
  - 建议：0 值不渲染或加注脚；补 `<table>` 隐藏版或带完整数值的 `aria-label`。
- [ ] **DATA-03 (P2)**　报告标题与列表断链　列表写「OPC 套餐需求调研」，实际 `opc-community-funding` 是「经费申请汇报」（见 FIX-05）
  - 建议：列表与详情标题/类型标签对齐。

---

## 建议执行顺序

**第一波 · Quick Wins（半天，低风险高感知）**　FIX-01、FIX-02、FIX-06、CW-01、CW-02、FIX-04（表单加一行）、FIX-05
**第二波 · 系统收敛（1-2 天，治本）**　DS-01～DS-06、A11Y-01～A11Y-04
**第三波 · 信息架构与转化（需产品决策）**　IA-01～IA-06、剩余 CW/DATA

---

## 变更记录

| 日期 | 条目 | 操作 | 说明 |
|------|------|------|------|
| 2026-06-23 | — | 建档 | 初次审计，38 条纳入追踪 |
