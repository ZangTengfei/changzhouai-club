# 样式开发约定

本文件是常州 AI Club 站点样式的权威约定。当前代码以 **Tailwind CSS v4 为默认方案**，CSS 变量负责设计令牌，CSS Module 只保留给复杂排版和动画等明确例外。

## 一、默认选择

### Tailwind —— 页面和组件的首选

- 新增或修改普通页面时，布局、间距、颜色、圆角、阴影、响应式、状态样式都优先写 Tailwind utility。
- 动态组合使用 `cn()`，不要为几个条件类新建 CSS Module。
- 前台品牌值优先使用 `@theme inline` 已映射的语义值；尚未映射的设计值直接引用 CSS 变量，例如 `rounded-[var(--radius-md)]`。
- 后台继续使用 Ant Design 控件，外层布局和局部覆盖使用 Tailwind，不再单独维护后台布局 Module。

### 全局样式 —— 令牌和真正共享的基础能力

`src/app/globals.css` 只承载：

- `:root` 设计令牌及 Tailwind `@theme inline` 映射；
- `body`、链接、图片、容器等基础规则；
- 仍被多处复用的语义基础类，如 `.button`、`.input`、`.textarea`、`.surface`、`.home-kicker`；
- 少量无法由组件局部表达的跨页面兼容规则。

不要向 `globals.css` 添加单页类。准备新增全局类前，先确认至少有多个独立调用方；否则直接使用 Tailwind。

### CSS Module —— 有审核门槛的例外

只有以下情况可以新增或扩展 `*.module.css`：

- Markdown、富文本等不可控后代结构；
- 多阶段关键帧、复杂伪元素或需要精确降级的动画；
- 打印、截图、海报导出、演示稿等独立排版系统；
- 同一复杂报告模板被多个页面共享，utility 会明显降低可读性。

“页面比较大”或“className 比较长”本身不是使用 Module 的理由。普通品牌卡片、响应式网格、hover/focus 状态仍使用 Tailwind。

## 二、当前允许保留的 CSS Module

| 文件 | 保留原因 |
|---|---|
| `src/components/markdown-content.module.css` | 富文本后代选择器和内容排版 |
| `src/components/route-loading.module.css` | 路由加载关键帧和降级动画 |
| `src/app/(site)/news/ai-news-page.module.css` | 资讯流、日报、群日报海报及导出组件共用的复合排版 |
| `src/app/(site)/reports/ai-office-course-survey/survey-report-page.module.css` | 三个调研报告页面共享的图表/报告模板 |
| `src/app/(site)/reports/opc-community-funding/opc-community-funding-page.module.css` | 可翻页演示稿和 deck 控件排版 |

新增例外时应在本表补充原因；普通业务页面不应重新出现 CSS Module。

## 三、设计令牌和圆角

- 颜色：`var(--accent)`、`var(--accent-strong)`、`var(--accent-warm)`、`var(--ink)`、`var(--muted)`。
- 圆角：`var(--radius-pill)`、`var(--radius-sm)`、`var(--radius-md)`、`var(--radius-lg)`。
- 阴影：`var(--shadow-sm)`、`var(--shadow-md)`、`var(--shadow-lg)`。
- 前台需要设计系统的大圆角时，写 `rounded-[var(--radius-lg)]`，不要依赖一个名字相近但语义不明确的默认 utility。
- 不要为了单次使用新增 CSS 变量；只有跨组件复用的稳定视觉值才进入令牌层。

## 四、新增样式决策顺序

1. 现有 Tailwind utility 或语义 token 能表达：直接使用。
2. 多处复用且属于基础控件：复用或补充全局语义类。
3. 属于上文列出的复杂排版例外：使用局部 CSS Module，并写清边界。
4. 其余情况不要新建样式文件。

## 五、验证要求

- 至少运行 `npm run build`。
- 涉及公开页面时，抽查桌面与 390px 移动端，并确认 `scrollWidth === clientWidth`。
- 涉及交互状态时，验证 hover/focus、展开收起及 reduced-motion 分支。
- 清理全局规则前必须确认选择器没有调用方；组合选择器应人工拆分，避免误删仍在使用的共享规则。

相关视觉规范见 `design/design-system.md`，历史审计记录见 `docs/site-ui-content-audit.md`。
