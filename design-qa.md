# 社区页 Hero Design QA

- Source visual truth: `/Users/nobugai/.codex/generated_images/019fc7d1-ddec-7892-814f-aa48174b257a/exec-d65713e2-b563-4863-9052-74d0cd1c522a.png`
- Implementation screenshot: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-hero-top-implementation-v3.png`
- Full comparison: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-hero-comparison-v3.png`
- Interaction evidence: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-gallery-interaction-settled.png`
- State: 社区页顶部，线上空间数据已加载，未展开其他模块
- Simulator viewport: 688 × 1486 px；小程序内容宽度约 688 px，截图密度由微信开发者工具模拟器决定
- Source pixels: 1358 × 1158 px
- Implementation pixels: 688 × 1486 px；Hero 对比区域为 630 × 538 px
- Density normalization: 将源图缩放到 630 × 538 px，并与实现截图中同尺寸 Hero 区域并排比较

## Findings

- 无 P0、P1、P2 问题。
- 字体与层级：品牌行、三行主标题、说明、地点、数字统计的层级与目标一致；使用小程序系统字体替代效果图字体，属于运行时约束下的可接受差异。
- 间距与布局：浅色信息区和实景照片采用 52:48 分栏；相较效果图略微增加信息区宽度，以保证真实地点、动态统计和服务标签在小程序窄屏下不截断。
- 色彩：Hero 已从墨绿色切换为雾蓝白底、深蓝正文和蓝色数字，没有左侧彩色竖线，也没有多余装饰卡片。
- 图片：使用真实办公空间原图；照片内容向左移动，墙面 AI Club Logo、世界地图、蓝色前台和部分办公区均可见，图片无拉伸和明显压缩失真。
- 文案与数据：标题、简介、地点和服务信息与确认稿一致；工位总数使用线上实际值 30，不写死效果图中的旧值 24。
- 交互：点击右侧照片可进入原有 2 张实景预览，原生预览层显示 `1/2`；自动化截图无法记录原生预览层最终解码出的图片，但入口调用成功且页面控制台无错误。

## Focused Region Comparison

- 已在 `community-hero-comparison-v3.png` 中并排检查品牌行、标题换行、地点行、统计区、照片焦点、墙面 Logo 和实景入口，因此无需额外局部裁图。

## Comparison History

1. 首轮实现：信息区 60%、照片区 40%，标题换行和照片占比偏离目标。
2. 第二轮：改为独立三行标题并将照片区扩大到 45%，墙面 Logo 完整显示。
3. 最终轮：照片区扩大到 48%，同时调整图片偏移，让办公区、蓝色前台和墙面 Logo 共同进入画面；并排复核后无可执行的 P0/P1/P2 差异。

## Follow-up Polish

- P3：如需更贴近效果图，可在后续素材阶段补充同风格的相册图标；当前采用纯文字入口，避免引入不匹配的图标资产。

## Verification

- `npm run typecheck`: passed
- `git diff --check`: passed
- 微信开发者工具自动化重载 `pages/community/index`: passed
- 点击 `.hero-photo` 打开 2 张实景预览: passed
- 控制台错误: 0

final result: passed
