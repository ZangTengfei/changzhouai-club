# 社区页 Hero 斜切遮罩 Design QA

- Source visual truth: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-hero-diagonal-source.png`
- Implementation screenshot: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-hero-diagonal-implementation-v3.png`
- Full comparison: `/Users/nobugai/develop/changzhouai-club/output/design-qa/community-hero-diagonal-comparison-v3.png`
- State: 社区页顶部，空间数据已加载，页面滚动位置为顶部
- Simulator viewport: 688 × 1486 px；小程序内容宽度约 688 px，截图密度由微信开发者工具模拟器决定
- Source pixels: 1358 × 1158 px；有效 Hero 区域裁切为 1316 × 1111 px
- Implementation pixels: 688 × 1486 px；Hero 对比区域为 630 × 538 px
- CSS size and density normalization: 将源图有效 Hero 区域缩放到 630 × 538 px，并与实现截图中同尺寸 Hero 区域并排比较

## Findings

- 无 P0、P1、P2 问题。
- 字体与层级：品牌行、三行主标题、说明、地点和数据统计保持原实现，不因遮罩修正发生换行或层级回退；系统字体与效果图字体的细微差异属于小程序运行时约束。
- 间距与布局：照片边界已改为顶部靠右、向下逐步往左展开的斜切；底部交点约位于 Hero 宽度 48%，顶部圆角后的交点约位于 57%，与源图比例一致。
- 色彩：浅色信息底、深蓝正文、蓝色统计和照片色调均保持一致；没有新增彩色左侧竖线或其他装饰。
- 图片：继续使用真实办公室照片，通过反向变形保持照片中的墙线、Logo 和文字不倾斜；墙面 AI Club Logo、世界地图与蓝色前台仍完整可见。
- 文案与数据：文案结构与设计稿一致；当前线上数据为 30 个工位且标签为“已常驻”，与设计稿中的静态 24 / 已固定差异属于真实数据和既有产品文案，不是本次遮罩偏差。
- 交互：实景入口仍位于照片右下角，变形已反向抵消，文字和点击区域保持水平；本次仅修改 WXSS，原有 `previewSpacePhotos` 绑定未变。

## Focused Region Comparison

- `community-hero-diagonal-comparison-v3.png` 已将源图和 630 × 538 px 的实现 Hero 同框并排，能够清楚检查斜切交点、圆角、照片焦点、标题换行、数据区和实景入口，因此无需额外局部裁图。

## Comparison History

1. 基线：实现为 52:48 的垂直分栏，照片左边界没有斜切，属于 P1 主视觉偏差。
2. 第一轮：将照片容器改为斜切并对图片、入口反向校正；56% 照片宽度使边界整体比源图偏左，记录为 P2。
3. 第二轮：照片宽度收至 52%，底部交点与源图对齐；顶部 72rpx 圆角仍偏大，使顶部可见起点略偏右，记录为 P2。
4. 最终轮：顶部圆角收至 48rpx；同尺寸并排复核后，顶部和底部交点、边界角度及圆角过渡均与源图一致，无可执行的 P0、P1、P2 差异。

## Follow-up Polish

- 无需继续调整。照片本身的亮度和透视差异来自同一素材在不同裁切位置下的呈现，不影响遮罩还原。

## Verification

- `npm run typecheck`: passed
- `git diff --check`: passed
- 微信开发者工具自动化重载 `pages/community/index`: passed
- 页面截图和同尺寸并排对比: passed
- 变更范围: 仅社区 Hero 遮罩与其内部照片、入口的变形校正

final result: passed
