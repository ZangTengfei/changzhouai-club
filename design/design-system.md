# 常州 AI Club 网站设计系统（以 `design2.png` 为主参考）

## 1. 设计定位（Design DNA）

- 本地 AI 社区官网，不是通用 SaaS 后台，也不是极简企业站
- 气质关键词：温暖、年轻、轻松、可信、真实活动感
- 核心表达：真实的人 + 真实活动 + 社区连接 + 项目共创
- 视觉语言：暖米白背景 + 青绿色品牌主色 + 贴纸式装饰 + 卡片化信息组织
- 重点不是“科技感炫酷”，而是“让人想加入的社区感”

---

## 2. 视觉基调（Visual Mood）

页面整体应该给人这样的感受：

- 背景温暖，不冷白
- 绿色有生命力，但不荧光、不互联网模板化
- 信息清晰，但不过度理性
- 有手作感：便签、箭头、小星星、笑脸、漂浮卡片
- 有活动现场感：照片、缩略图、人物插画、成员头像

不应出现的倾向：

- 冷灰蓝 SaaS 风
- 纯 Tailwind 默认绿
- 过强玻璃拟态
- 过暗、过科技蓝、过未来感
- 过多统一大圆角导致页面“幼态化”

---

## 3. 颜色系统（Color Tokens）

### 3.1 品牌主色

这是 `design2` 的主品牌色方向，偏青绿，不是标准 Tailwind green。

```css
--brand-green: #14866d;
--brand-green-strong: #0f6f5e;
--brand-green-soft: #dff1e4;
```

用途：

- Logo 绿色部分
- Hero 标题中 `AI Club`
- 主按钮
- 重点数字
- 强调线与手绘箭头

### 3.2 页面底色

页面不是纯白，也不是灰白，是偏暖的浅米色。

```css
--bg-page: #f7f2ea;
--bg-page-soft: #fbf8f2;
--bg-card: #ffffff;
--bg-card-soft: #fffdfa;
```

用途：

- 整页背景
- Hero 区的大面积暖底
- 白色内容卡片

### 3.3 文本色

```css
--text-primary: #172126;
--text-secondary: #66757b;
--text-muted: #95a2a7;
```

规则：

- 大标题用 `--text-primary`
- 正文用 `--text-secondary`
- 辅助说明和弱标签用 `--text-muted`

### 3.4 强调辅助色

这些颜色只做点缀，不作为主系统底色。

```css
--accent-yellow: #f4c85a;
--accent-orange: #f29a38;
--accent-blue: #59a9ea;
--accent-purple: #7d63f1;
```

用途：

- 手绘下划线
- 贴纸和小图标
- 统计模块图标
- 装饰元素

### 3.5 贴纸色板

```css
--sticky-green: #e4f5af;
--sticky-yellow: #ffe497;
--sticky-blue: #cbe7ff;
```

规则：

- 贴纸必须有轻微旋转
- 贴纸颜色明亮但不饱和刺眼
- 贴纸文案使用深灰黑，不用纯黑

---

## 4. 字体系统（Typography）

## 4.1 字体气质

设计稿不是纯产品后台风，所以不建议默认使用 `Inter` 作为唯一核心风格。

推荐中文/英文字体顺序：

```css
font-family:
  "Avenir Next",
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  sans-serif;
```

说明：

- 英文和数字尽量干净、现代
- 中文要有亲和力，不要太机械
- 不使用高对比衬线做主标题

## 4.2 字号层级

### Hero 标题

```css
font-size: 72px ~ 88px desktop;
line-height: 1.04 ~ 1.08;
font-weight: 900;
letter-spacing: -0.06em ~ -0.08em;
```

规则：

- 标题允许大面积占据左半屏
- 必须有强烈视觉重心
- `AI Club` 允许单独用品牌绿色

### Hero 正文

```css
font-size: 16px ~ 18px;
line-height: 1.8 ~ 1.9;
font-weight: 400;
max-width: 480px ~ 520px;
```

### 区块标题

```css
font-size: 32px ~ 40px;
line-height: 1.15;
font-weight: 800;
letter-spacing: -0.04em;
```

### 卡片标题

```css
font-size: 18px ~ 22px;
line-height: 1.3;
font-weight: 700;
```

### 正文

```css
font-size: 15px ~ 16px;
line-height: 1.7 ~ 1.8;
font-weight: 400;
```

### 小标签 / 导航 / 辅助信息

```css
font-size: 12px ~ 14px;
line-height: 1.4;
font-weight: 600 ~ 700;
```

---

## 5. 间距系统（Spacing）

以 `8px` 为基础，但页面不能机械化套 8px Grid，要兼顾设计稿的呼吸感。

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-14: 56px;
--space-16: 64px;
```

规则：

- 页面主区块之间常用 `32 ~ 48`
- Hero 内部使用更紧凑但有层次的 `16 / 20 / 24`
- 卡片内边距以 `20 / 24 / 28` 为主

---

## 6. 圆角与阴影（Radius & Shadow）

### 圆角

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-pill: 999px;
```

规则：

- 主图和大卡片圆角偏大
- 普通功能卡片使用 `14 ~ 18`
- 贴纸不使用很大的圆角，一般 `4 ~ 8`

### 阴影

```css
--shadow-sm: 0 6px 18px rgba(23, 33, 38, 0.05);
--shadow-md: 0 12px 28px rgba(23, 33, 38, 0.08);
--shadow-lg: 0 20px 46px rgba(23, 33, 38, 0.12);
```

规则：

- 阴影要柔，不要黑重压
- 大图、Hero 主卡、漂浮贴纸用 `shadow-lg`
- 普通信息卡用 `shadow-sm` 或 `shadow-md`

---

## 7. 布局系统（Layout）

### 页面容器

```css
max-width: 1180px ~ 1200px;
margin: 0 auto;
padding: 0 24px;
```

### Hero

```css
left column: 44% ~ 46%;
right column: 54% ~ 56%;
```

规则：

- 左侧是强视觉文字块
- 右侧是主图 + 白牌 + 便签 + 缩略图
- 左右不是完全均分

### 内容区块

- 以大卡片拼接为主
- 避免无边界纯信息流
- 区块之间需要明确视觉分层

---

## 8. 组件规范（Core Components）

## 8.1 Navbar

目标：

- 像社区官网头部，不像后台导航
- 轻、白、扁平
- 不固定吸顶

参数：

```css
height: 72px ~ 78px;
nav-font-size: 14px ~ 15px;
cta-height: 40px ~ 42px;
```

结构：

```txt
Logo | Nav Links | GitHub Button | Join Button | Avatar
```

规则：

- Logo 左侧，英文副标题较小
- 导航项居中，当前项用细绿色下划线
- GitHub 是白底胶囊按钮
- 加入社区是绿色实心按钮

## 8.2 Hero

Hero 是全站最重要的情绪模块。

必须包含：

- 品牌型超大标题
- 一段温和、可信的社区介绍
- 主按钮 + 次按钮
- 成员头像组 + 成员数量
- 主活动照片
- 主图上的白色标题牌
- 2~3 张便签
- 底部 3 张活动缩略图

标题规则：

- 中文与英文混排允许分色
- 标题行数偏大，允许 3~4 行堆叠
- 有手绘下划线或手势箭头辅助

图片区规则：

- 主图必须是真实活动照片
- 右上/中部叠加白色牌子，写“常州 AI Club / 连接・分享・共创”
- 缩略图尺寸统一，横向排布

贴纸规则：

- 至少 3 张
- 角度不同
- 每张 2~3 行文案
- 必须有一个小图标或对勾

## 8.3 数据统计条（Stats Bar）

视觉特征：

- 横向一整条大卡片
- 四列信息
- 每列有彩色线性图标

参数：

```css
padding: 24px 28px;
border-radius: 24px;
background: #fff;
```

数字：

```css
font-size: 24px ~ 36px;
font-weight: 800;
```

## 8.4 社区动态卡（Feed Card）

这是 `design2` 的新增重点，不是普通列表。

必须体现：

- 用户头像
- 用户名
- 动态文案
- 小图预览
- 点赞/评论等轻互动痕迹

气质：

- 像社区正在发生真实事情
- 不是冷冰冰的公告列表

## 8.5 下一场活动卡（Featured Event Card）

视觉特征：

- 浅绿色/浅青色渐变底
- 左侧信息，右侧插画或活动海报
- 顶部小标签 `下一场活动`
- 主按钮清晰

参数：

```css
border-radius: 20px ~ 24px;
padding: 24px;
```

## 8.6 理由卡 / Feature Grid

视觉特征：

- 2x2 小卡
- 每张卡一个小图标 + 标题 + 简短说明
- 背景偏白，边界柔和

规则：

- 不要过度营销语
- 强调“真实连接 / 本地资源 / 项目导向 / 社区氛围”

## 8.7 成员故事卡（Story Cards）

视觉特征：

- 横向一组成员故事
- 头像、角色标签、短故事、话题标签

规则：

- 卡片高度统一
- 文案真实、有个体感，不写模板式成功学

## 8.8 活动回顾卡（Gallery Cards）

视觉特征：

- 宽卡横排
- 上图下文
- 时间、标题、地点三段式

参数：

```css
card-width: 260px ~ 300px;
image-height: 150px ~ 170px;
border-radius: 14px;
```

## 8.9 加入我们（Join Banner）

视觉特征：

- 横向大 Banner
- 左侧人物插画
- 中间文案
- 右侧二维码 + 微信群信息 + 按钮

这是“社区归属感”模块，不只是二维码容器。

## 8.10 社交平台卡（Social Cards）

视觉特征：

- 小红书、抖音、B站、GitHub 四张横向小卡
- 平台图标清晰
- 标题 + 一行副说明

---

## 9. 装饰语言（Decorative Language）

这是本设计系统最重要、也最容易缺失的一层。

必须允许存在：

- 便签（Sticky Notes）
- 手绘箭头
- 笑脸
- 小星星 / 闪光
- 对勾 / 小心形
- 轻漂浮的小牌子

规则：

- 只做点缀，不能影响信息阅读
- 分布在 Hero、活动卡、加入我们等高情绪区
- 风格要统一：线条偏圆润，颜色偏明快

---

## 10. 插画系统（Illustration System）

插画风格必须统一：

- 扁平人物插画
- 轻描边或无描边
- 颜色与主站色板一致
- 表情友好、动作自然

建议优先做的插画资产：

1. Hero 相关人物插画或活动海报式白牌
2. 活动流程三张小插画
3. Featured Event 右侧插画
4. Join Banner 左侧人物插画

建议格式：

- 最优：SVG
- 次优：透明 PNG

---

## 11. 响应式原则（Responsive Rules）

- 手机端优先保留气质，不是简单堆叠
- Hero 便签数量可减少，但不能全部消失
- 主图白牌和缩略图需要缩小重排
- 标题字号明显下降，但仍需保持强视觉焦点
- 横向卡片在手机上变单列，但圆角、留白和插画感不能丢

---

## 12. 实现建议（Implementation Guidance）

如果要在代码里落地，这份设计系统应优先拆成：

- `color tokens`
- `type scale`
- `radius / shadow`
- `layout container`
- `hero tokens`
- `decorative tokens`
- `card families`

不要把它实现成“一套通用白卡 + 绿色按钮”的系统。

正确方向是：

- 用统一 token 支撑
- 但允许 Hero、贴纸、活动卡、加入 Banner 有更强的个性化样式

---

## 13. 最终判断标准（Acceptance Criteria）

一个页面如果符合这个设计系统，应该满足：

- 一眼看上去像“常州 AI 社区官网”，而不是任意创业网站
- 页面有温度，有真实活动感
- 绿色是品牌主角，但不会压迫
- 卡片清晰，阅读轻松
- 有贴纸和手绘元素，但不杂乱
- 插画和照片能共同组成统一视觉叙事

如果页面看起来像：

- 通用 SaaS 官网
- Tailwind 模板
- 后台管理面板
- 极简科技蓝白落地页

那就说明它没有真正符合这份设计系统。
