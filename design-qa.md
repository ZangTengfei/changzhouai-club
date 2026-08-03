# 社区平面图集中办公室调整 Design QA

- Source visual truth: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-floor-plan-source.png`，结合用户指令“去掉打印区；集中办公室文字完整显示；整体上移并与沙龙区顶部对齐”
- Implementation screenshot: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-floor-plan-refined-v1.png`
- Full comparison: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-floor-plan-comparison-v1.png`
- State: 社区页工位预约模式，平面图视图，空间数据已加载
- Simulator viewport: 688 × 1486 px；小程序截图密度由微信开发者工具模拟器决定
- Source pixels: 612 × 718 px；有效平面图区域为 586 × 694 px
- Implementation pixels: 688 × 1486 px；有效平面图区域为 586 × 696 px
- CSS size and density normalization: 将源图有效区域缩放到 586 × 696 px，与实现平面图同尺寸并排比较

## Findings

- 无 P0、P1、P2 问题。
- 字体与层级：集中办公室标题完整保持单行显示，标题与两排工位之间保留清晰间距；独立办公室、沙龙区和会议室的文字层级未发生回退。
- 间距与布局：集中办公室容器顶部由 47% 上移到 31%，与沙龙区顶部严格对齐；F01–F06 同步整体上移 16 个百分点，仍完整落在办公室边界内。
- 色彩与视觉标记：房间边框、工位状态色、底色和阴影保持原样；未引入新的左侧彩色竖线。
- 图片与图标：打印区及其图标已经完整移除，没有留下空图标、占位或无效素材引用；其他区域不依赖新增图片资源。
- 文案与内容：平面图不再显示“打印区”；“集中办公室”完整可读，6 个工位编号及其他空间名称保持正确。
- 交互：仅调整静态房间和 F01–F06 的布局坐标，工位按钮、选择状态、预约与常驻申请交互均保持原绑定。

## Focused Region Comparison

- `community-floor-plan-comparison-v1.png` 将调整前后平面图等宽并排，可清楚核对打印区移除、集中办公室顶线、标题完整度以及六个工位边界，因此无需额外局部裁图。

## Comparison History

1. 基线：打印区仍可见；集中办公室顶部位于 47%，明显低于沙龙区 31% 的顶部；标题可用宽度缺少明确约束，属于 P1/P2 可见偏差。
2. 最终轮：删除打印区结构和样式；集中办公室及 F01–F06 同步上移 16 个百分点；标题增加全宽、居中、禁止换行约束。开发者工具同尺寸并排复核后无可执行的 P0、P1、P2 差异。

## Follow-up Polish

- 无需继续调整；集中办公室与沙龙区顶部已形成清晰水平基准线。

## Verification

- `npm run typecheck`: passed
- `git diff --check`: passed
- 微信开发者工具自动化重载 `pages/community/index`: passed
- 小程序运行时异常: 0
- 页面截图和同尺寸并排对比: passed

final result: passed
