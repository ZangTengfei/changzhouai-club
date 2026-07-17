# 小程序视觉实现 QA

- 日期：2026-07-15
- 目标设备：微信开发者工具，390px 逻辑宽度
- 参考图：`output/ui-design/2026-07-14/01-field-notes.png`、`02-activity-index.png`、`03-community-passport.png`
- 实现截图：`output/ui-design/2026-07-14/implementation/`、`output/ui-design/2026-07-15-me-simplified/`
- 并排对照：`output/ui-design/2026-07-14/comparison-01-home.png`、`comparison-02-events.png`、`comparison-03-me.png`

## 对照结论

- 首页保留了参考图的品牌抬头、橙色编辑线、现场简报编号和高密度回顾列表。
- 活动页保留了参考图的月度索引、日期轴、活动类型色彩和紧凑列表节奏。
- 成员页进一步收敛为成员档案和我的活动两个主要区域；成员卡只展示姓名、组织、正式身份和最多两枚真实荣誉标签。
- 成员档案顶部不再使用强调线，由导航与内容之间的留白建立页面层级。
- “我的活动”使用全宽白色内容带和上下细边界，与页面浅灰背景形成清晰分区。
- 独立的下一步横幅、活动统计块和主页成长进度均已移除；编辑资料、账号连接、隐私及退出登录继续集中在设置页。
- “我的活动”只展示报名/到场摘要和一条最近参与记录，状态直接使用后端的已报名、候补中、已参加或分享嘉宾，不推断待签到。
- 成员卡整体可进入独立成长档案页，成长等级、报名/到场统计、身份路径和全部真实社区荣誉在该页集中展示。
- 正式身份与成长等级已分开表达，例如社区主理人可以同时处于社区成员成长等级，避免身份语义冲突。
- 等级图形只在成长档案页展示；没有真实荣誉时显示简短说明，不渲染空徽章占位。
- 活动详情沿用同一套记录编号、信息条带和真实海报展示规则。
- 三个 TabBar 页面使用同一个自定义顶部组件，按状态栏和微信胶囊位置动态计算高度与右侧安全距离。
- 使用线上真实活动和当前登录用户状态；未伪造二维码、通行证编号、参与人数或成员成就。
- 首页现场简报主图使用 `aspectFill` 铺满容器；索引与详情中的竖版海报保留 `aspectFit`。
- 长标题、日期、成员组织信息和按钮文字未发现重叠或越界。
- 首页、活动筛选、活动详情跳转和成员登录态加载均通过开发者工具自动化检查。

## 验证

- `npx tsc -p miniapp/tsconfig.json --noEmit`：通过
- 微信开发者工具截图检查：主页和成长档案页通过，390px 逻辑宽度下无文字重叠或越界
- 微信开发者工具预览编译：通过
- `git diff --check`：通过
- `npm run miniapp:verify-api`：既有签到验收夹具在 check-in 步骤返回 409；本次未修改后端签到逻辑，单列为后续测试维护项。

final result: passed

---

# 群聊日报三模板选择 Design QA

- Source visual truth:
  - `/Users/nobugai/.codex/generated_images/019f6e02-ffee-7973-b13e-fc2ab4d32d67/exec-3996f442-9705-4eee-8d3d-f5228c597216.png`
  - `/Users/nobugai/.codex/generated_images/019f6e02-ffee-7973-b13e-fc2ab4d32d67/exec-122aadc7-f748-4a83-8dc9-61f1782d68fd.png`
  - `/Users/nobugai/.codex/generated_images/019f6e02-ffee-7973-b13e-fc2ab4d32d67/exec-4b76fb1f-ee2f-490d-9fdd-7fe1e4cc45fe.png`
- Implementation screenshots:
  - `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-template-neural-glass.jpg`
  - `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-template-intelligent-grid.jpg`
  - `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-template-holographic-orbit.jpg`
- Viewport: `1080 × 1440`
- State: 同一话题卡、默认文案密度、2026-07-17、话题 1 / 4
- Three-way comparison: `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-template-three-way-comparison.png`

## Findings

- No actionable P0/P1/P2 differences remain.
- 三套模板保留各自独立的视觉语言：神经玻璃使用轻盈网络光点，智能网格使用理性技术纸张，全息光场使用柔和环形光带。
- 三套模板共用标题、摘要、统计、二维码、页脚及文案密度逻辑；切换模板不会丢失后台已编辑内容。
- 模板状态同时驱动封面、话题卡、结束卡与 PNG 导出，预览和下载结果保持一致。
- 两套新增背景均为 `1080 × 1440` 实际位图资产，没有使用 CSS 图形近似。
- 三套话题卡均未出现文字溢出、遮挡或异常留白，浏览器控制台无警告和错误。

## Comparison History

1. First pass: three templates rendered at the same viewport and content state with distinct hierarchy and complete content.
   - No P0/P1/P2 visual fixes were required.
2. Selector integration: reviewed shared template state, card propagation, selected-state styling, and export background lookup.
   - TypeScript, production build, and diff checks form the implementation gate.

## Implementation Checklist

- [x] 后台提供三套带缩略图的可选模板。
- [x] 默认继续使用用户已选择的智能网格模板。
- [x] 封面、话题卡、结束卡同步切换。
- [x] PNG 导出使用当前模板背景。
- [x] 长文案继续使用现有紧凑与密集排版保护。
- [x] 完成三模板同状态视觉对比。

final result: passed

---

# 群聊日报智能网格模板 Design QA

- Source visual truth: `/Users/nobugai/.codex/generated_images/019f6e02-ffee-7973-b13e-fc2ab4d32d67/exec-122aadc7-f748-4a83-8dc9-61f1782d68fd.png`
- Implementation screenshot: `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-card-intelligent-grid-final.png`
- Viewport: `1080 × 1440`
- State: 话题卡默认文案密度，2026-07-17，话题 1 / 4
- Full-view comparison: `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-card-intelligent-grid-final-comparison.png`
- Focused title comparison: `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-card-intelligent-grid-title-comparison.png`
- Supporting cover capture: `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-card-intelligent-grid-cover.jpg`
- Supporting end-card capture: `/Users/nobugai/develop/changzhouai-club/output/playwright/wedaily-card-intelligent-grid-end.jpg`

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: implementation preserves the selected concept's extra-bold navy headline, compact metadata, blue topic label, and medium-weight summary. Exact line breaks remain content- and system-font-dependent by design because the title is editable.
- Spacing and layout rhythm: title, summary block, metadata, index, and footer occupy comparable regions to the source; the earlier excessive middle gap has been removed.
- Colors and visual tokens: white, powder blue, cobalt, and deep navy match the selected direction. Website green, orange, and beige are absent.
- Image quality and asset fidelity: the technical grid and right-edge blue band use a generated 1080 × 1440 raster asset rather than a CSS approximation. The asset remains sharp at export resolution.
- Copy and content: all existing editable title, summary, metadata, statistics, QR code, and footer content remain present.
- Browser console: no warning or error entries during topic, cover, and end-card checks.

## Comparison History

1. Initial implementation: headline expanded across three wide lines and left a large unused middle region.
   - Fix: narrowed the topic headline measure and increased its type scale.
   - Evidence: `wedaily-card-intelligent-grid-comparison.png`.
2. Second pass: headline hierarchy improved but remained shorter than the selected reference.
   - Fix: set the default topic title to `144px` with a `700px` measure while preserving compact and dense fallbacks.
   - Post-fix evidence: `wedaily-card-intelligent-grid-final-comparison.png` and `wedaily-card-intelligent-grid-title-comparison.png`.

## Open Questions

- None blocking. Editable copy can naturally produce different line breaks from the fixed mockup; the existing density modes protect longer content.

## Implementation Checklist

- [x] Use the selected blue technical-grid visual system.
- [x] Apply the system to cover, topic, and QR end cards.
- [x] Preserve editable copy and density fallbacks.
- [x] Preserve PNG export with background and QR layers.
- [x] Check topic, cover, and end-card browser rendering.

## Follow-up Polish

- P3: If a future bundled display font is introduced, recheck Chinese glyph width and topic wrapping across macOS and Windows.

final result: passed
