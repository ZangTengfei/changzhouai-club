# 样式开发约定

本文件是常州 AI Club 站点样式的权威约定。站点前台以 **CSS Module 为主体**,Tailwind 作为**布局工具**配合使用,设计令牌(颜色/圆角/阴影)统一用 CSS 变量管理。目标是终结"这个样式该写在哪"的困惑。

## 一、四类样式的边界

### CSS Module —— 主体(保留)
- **位置**:与组件/页面同目录的 `*.module.css`。
- **用途**:组件视觉、复杂选择器、伪类/动画、品牌视觉(手账、便利贴、渐变、插画)。
- **引用**:`styles.xxx` 或经 `cssModuleCx` 绑定后 `cx("xxx")`。
- **原则**:高度定制化的品牌视觉优先写 Module,Tailwind utility 表达这些会很笨重。

### Tailwind —— 辅助(仅布局工具)
- **用途**:**仅布局类**——`flex / grid / gap-* / p-* / m-* / hidden`、响应式 `sm: / md: / lg:`。
- **范围**:新代码按需使用,**不要**把现有 CSS Module 批量迁移成 utility。
- **品牌色**:经 `@theme inline` 映射后可用 `bg-accent` / `text-muted-foreground` / `bg-primary` 等。

### 全局类(`src/app/globals.css`)
- **范围**:仅真正全局、高频复用的基础类:`.button` / `.input` / `.surface` / `.section` / `.card` / `.eyebrow` / `.pill` / `.textarea` 等。
- **原则**:低频或单页使用的类应放进对应 Module,**不要堆积在 globals**。globals 定期清理 0 使用的死代码(见 `scripts/prune-globals.mjs`)。

### 设计令牌(CSS 变量,`globals.css` `:root`)
- **颜色**:`var(--accent)` / `var(--accent-strong)` / `var(--accent-warm)` / `var(--ink)` / `var(--muted)` 等。
- **圆角**:`var(--radius-pill)` / `var(--radius-sm)` 12 / `var(--radius-md)` 18 / `var(--radius-lg)` 28。
- **阴影**:`var(--shadow-sm)` / `var(--shadow-md)` / `var(--shadow-lg)`。
- **桥接**:`@theme inline` 把这些变量映射给 Tailwind,使 utility 也能用品牌值。

## 二、重要:@theme radius 分轨(勿混用)

Tailwind 的 `rounded-*` 与设计的 `--radius-*` **有意保持两套不同值**:

| 体系 | 值 | 服务对象 |
|---|---|---|
| Tailwind `rounded-sm/md/lg` | 小(约 10/12/14px) | admin 后台 shadcn 组件的紧凑视觉 |
| 设计 `var(--radius-sm/md/lg)` | 12 / 18 / 28px | site 前台 CSS Module 的大圆角视觉 |

- **site 前台页面用 `var(--radius-*)`**,不要用 Tailwind 的 `rounded-lg`(会得到小值,与设计冲突)。
- admin 后台用 shadcn,自然用 Tailwind `rounded-*`。
- 这是 DS-06 的既定处理:**文档说明、不强改值**(强行统一会破坏 admin 视觉)。

## 三、子主题

| 子主题 | 位置 | 处理原则 |
|---|---|---|
| admin | `src/app/admin/admin-layout.module.css`(`--admin-*`) | token 尽量引用全局(已收敛 `--admin-border`/`--admin-radius-sm`);保留后台特有的紧凑圆角 `--admin-radius-lg: 22px` |
| docs | `src/app/docs/`(`--docs-*` + nextra) | **独立体系,勿收敛**——docs 用 nextra 的中性灰蓝调,与品牌暖绿正交 |
| deck | `reports/opc-community-funding/`(`--deck-*`) | `--deck-green`/`--deck-orange` 已引用全局 `--accent`/`--accent-warm`;`--deck-blue` 是演示稿独有色,保留 |

## 四、新增样式决策树

写新组件/页面时,按顺序判断:

1. **全局高频复用**?(如按钮、输入框)→ 写进 `globals.css` 的语义类。
2. **组件/页面局部视觉**?→ 写进对应 `*.module.css`。
3. **纯布局**(flex/grid/间距/显隐/响应式)?→ 用 Tailwind utility(仅新代码)。
4. **颜色/圆角/阴影**?→ 一律 `var(--token)`,不要硬编码。

## 五、相关脚本与文档

- `scripts/tokenize-design-tokens.mjs`:批量把圆角/阴影/断点裸值替换为令牌引用(幂等)。
- `docs/site-ui-content-audit.md`:整站样式/文案审查与优化追踪。

> **globals 死代码清理警示**:不要用脚本直接删组合选择器(`.a, .b {}`)里的类——会留下悬空选择器、破坏共享规则(曾导致 `card-grid` 丢失 3 列定义,活动卡片塌缩)。如需清理 globals 死代码,只删「独占规则块」(该类是规则的唯一选择器),且确认不波及其它仍在用的类。
