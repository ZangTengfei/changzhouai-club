export const navItems = [
  { href: "/", label: "首页" },
  { href: "/events", label: "活动" },
  { href: "/projects", label: "项目共建" },
  { href: "/members", label: "成员地图" },
  { href: "/join", label: "加入我们" },
  { href: "/cooperate", label: "合作联系" },
];

export const communityStats = [
  { value: "200+", label: "现有群成员" },
  { value: "6 场", label: "已举办线下活动" },
  { value: "2026.03.28", label: "最近一次活动日期" },
];

export const homeHighlights = [
  {
    title: "线下交流",
    description:
      "围绕常州本地的 AI 讨论、实操分享和自由交流，持续建立真实连接。",
  },
  {
    title: "成员分享",
    description:
      "活动里已经有社区成员分享自己正在研发的项目、工具和实践，氛围正在慢慢形成。",
  },
  {
    title: "企业合作",
    description:
      "承接主题分享、培训、PoC 验证和项目协作，把社区能力对接到真实场景。",
  },
];

export const eventRecaps = [
  {
    title: "第 1 场线下交流",
    date: "2026 年 1 月 24 日",
    isoDate: "2026-01-24",
    image: "/events/event-01-20260124.jpg",
    width: 1440,
    height: 1080,
    summary:
      "社区启动后的第一次线下见面，重点是认识彼此、交换近况，也让大家对这个社群的节奏有了更具体的感受。",
    highlights: ["线下自由交流", "启动期成员认识", "社区节奏初步形成"],
  },
  {
    title: "第 2 场线下交流",
    date: "2026 年 2 月 8 日",
    isoDate: "2026-02-08",
    image: "/events/event-02-20260208.jpg",
    width: 1440,
    height: 1075,
    summary:
      "第二次线下活动延续了开放交流的氛围，开始有更多围绕 AI 工具、应用方向和个人实践的讨论。",
    highlights: ["成员持续回流", "AI 应用讨论", "社区氛围升温"],
  },
  {
    title: "第 3 场线下交流",
    date: "2026 年 3 月 8 日",
    isoDate: "2026-03-08",
    image: "/events/event-03-20260308.jpg",
    width: 1440,
    height: 1080,
    summary:
      "进入 3 月后，活动开始更稳定地形成固定节奏，也逐步出现成员自发带来的主题和经验分享。",
    highlights: ["固定节奏形成", "主题交流", "成员参与度提升"],
  },
  {
    title: "第 4 场线下交流",
    date: "2026 年 3 月 14 日",
    isoDate: "2026-03-14",
    image: "/events/event-04-20260314.jpeg",
    width: 1200,
    height: 896,
    summary:
      "这一场的交流更偏向实践和工具视角，大家开始把具体的产品想法、技术路线和落地问题拿到线下讨论。",
    highlights: ["实践导向更强", "工具与路线讨论", "问题带到现场解决"],
  },
  {
    title: "第 5 场线下交流",
    date: "2026 年 3 月 21 日",
    isoDate: "2026-03-21",
    image: "/events/event-05-20260321.jpeg",
    width: 1280,
    height: 960,
    summary:
      "开始出现社区成员分享自己正在研发中的项目与想法，活动不再只是交流，也开始承载轻量展示和反馈。",
    highlights: ["成员自研分享", "项目想法交流", "从交流走向展示"],
  },
  {
    title: "第 6 场线下交流",
    date: "2026 年 3 月 28 日",
    isoDate: "2026-03-28",
    image: "/events/event-06-20260328.jpg",
    width: 1706,
    height: 1279,
    summary:
      "最近一次活动继续延续高频节奏，社区已经形成了稳定线下碰面的惯性，也为后续官网和更系统的运营打下了基础。",
    highlights: ["高频活动节奏", "稳定社区连接", "为后续运营做准备"],
  },
];

export const latestEventRecaps = [...eventRecaps]
  .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
  .slice(0, 3);

export const activityMoments = [
  {
    title: "持续线下碰面",
    description:
      "从 2026 年 1 月 24 日到 2026 年 3 月 28 日，社区已经累计举办 6 场线下交流，节奏非常明确。",
  },
  {
    title: "成员开始主动分享",
    description:
      "在最近几场活动中，已经有成员带着自己研发中的项目和想法来到现场做分享与交流。",
  },
  {
    title: "官网开始承接沉淀",
    description:
      "这版网站会先把活动沉淀下来，让新朋友一眼看到社区是真实发生、持续发生的。",
  },
];

export const projectStatus = [
  {
    title: "社区项目仍在萌芽期",
    description:
      "目前社区还没有正式立项、公开招募的共建项目，网站不会把项目包装成已经成熟存在的板块。",
  },
  {
    title: "活动里已经出现项目分享",
    description:
      "社区成员已经开始在线下活动里分享自研中的项目、工具和产品想法，这是后续项目孵化的自然前置阶段。",
  },
  {
    title: "后续可以再升级为项目页",
    description:
      "等出现明确目标、负责人和招募角色之后，再把这部分升级成真正的项目共建模块会更自然。",
  },
];

export const memberTags = [
  "LLM 应用",
  "Agent",
  "RAG / 知识库",
  "前端工程",
  "后端服务",
  "自动化工作流",
  "产品设计",
  "运营增长",
  "企业信息化",
  "高校交流",
  "本地创业",
  "项目交付",
];

export const joinSteps = [
  "了解社区定位与当前活动方向",
  "填写你的技能、兴趣与可参与方式",
  "根据活动或后续共建机会加入协作",
];

export const cooperationAreas = [
  "AI 主题分享",
  "企业内训",
  "需求讨论",
  "PoC 验证",
  "项目协作",
  "人才连接",
];

export const archiveItems = [
  {
    title: "活动照片与回顾",
    description:
      "先把每一场线下活动的时间、照片和现场氛围沉淀下来，让外部访客快速建立信任感。",
  },
  {
    title: "成员分享线索",
    description:
      "把活动中出现过的分享主题、自研项目和讨论方向整理出来，方便新成员理解社区关注点。",
  },
  {
    title: "后续内容资产",
    description:
      "等活动记录稳定后，再逐步补充资料链接、嘉宾介绍和更完整的活动总结。",
  },
];

export const faqItems = [
  {
    question: "这个社区只面向开发者吗？",
    answer:
      "不是。开发者会是重要群体，但产品、设计、运营、高校同学、创业者和企业数字化从业者都适合加入。",
  },
  {
    question: "活动一定是技术分享吗？",
    answer:
      "不一定。活动可以是主题分享、圆桌讨论、自由交流、需求沟通会，也可以是项目想法交流。",
  },
  {
    question: "社区已经有正式项目了吗？",
    answer:
      "截至 2026 年 3 月 29 日，社区还没有正式公开招募的共建项目，但已经有成员在线下活动中分享自研中的项目与想法。",
  },
  {
    question: "第一版网站会马上接在线表单吗？",
    answer:
      "当前版本先把结构、文案和活动内容建好，下一轮再接入飞书、腾讯文档或站内表单接口。",
  },
];
