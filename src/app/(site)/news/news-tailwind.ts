export const newsStyles = {
  aiNewsShell: "grid gap-[18px] max-[820px]:gap-3.5",
  feedHeader:
    "grid grid-cols-[minmax(0,1fr)_minmax(300px,420px)] items-end gap-[18px] pt-[18px] pb-1 max-lg:grid-cols-1 max-[820px]:gap-3.5 max-[820px]:pt-1 [&_h1]:mt-3 [&_h1]:mb-0 [&_h1]:text-[clamp(2.2rem,4vw,3.25rem)] [&_h1]:leading-[1.05] [&_h1]:font-black [&_h1]:tracking-[-0.055em] [&_h1]:text-[#111b1f] max-[820px]:[&_h1]:text-[clamp(2rem,12vw,2.8rem)] [&_div>p:not(.home-kicker)]:mt-2.5 [&_div>p:not(.home-kicker)]:mb-0 [&_div>p:not(.home-kicker)]:max-w-[42rem] [&_div>p:not(.home-kicker)]:text-base [&_div>p:not(.home-kicker)]:leading-[1.7] [&_div>p:not(.home-kicker)]:font-[650] [&_div>p:not(.home-kicker)]:text-[rgba(var(--ink-rgb),0.68)]",
  headerStatus:
    "grid grid-cols-3 overflow-hidden rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.82)] shadow-[var(--shadow-sm)] max-[820px]:grid-cols-2 max-[820px]:[&>div:nth-child(3)]:hidden [&>div]:grid [&>div]:min-w-0 [&>div]:gap-1 [&>div]:border-r [&>div]:border-[rgba(var(--ink-rgb),0.075)] [&>div]:p-[15px] max-[820px]:[&>div]:grid-cols-[22px_minmax(0,1fr)] max-[820px]:[&>div]:items-center max-[820px]:[&>div]:gap-x-2.5 max-[820px]:[&>div]:p-3 [&>div:last-child]:border-r-0 max-[820px]:[&>div:nth-child(2)]:border-r-0 [&_svg]:size-5 [&_svg]:text-primary [&_span]:text-[0.76rem] [&_span]:font-extrabold [&_span]:text-[rgba(var(--ink-rgb),0.58)] [&_strong]:overflow-hidden [&_strong]:text-[0.96rem] [&_strong]:leading-[1.2] [&_strong]:font-black [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#111b1f] max-[820px]:[&_strong]:col-start-2",
  controlPanel: "relative z-[1] grid gap-3",
  modeTabs:
    "grid grid-cols-4 items-center gap-2.5 max-[820px]:flex max-[820px]:snap-x max-[820px]:overflow-x-auto max-[820px]:pb-1 [&_a]:inline-flex [&_a]:min-h-[50px] [&_a]:items-center [&_a]:justify-center [&_a]:rounded-[var(--radius-md)] [&_a]:border [&_a]:border-[rgba(var(--ink-rgb),0.085)] [&_a]:bg-[rgba(255,252,247,0.9)] [&_a]:px-4 [&_a]:text-[0.94rem] [&_a]:leading-none [&_a]:font-black [&_a]:whitespace-nowrap [&_a]:text-[#111b1f] [&_a]:shadow-[var(--shadow-sm)] [&_a]:transition max-[820px]:[&_a]:min-h-11 max-[820px]:[&_a]:min-w-[118px] max-[820px]:[&_a]:snap-start max-[820px]:[&_a]:px-3 [&_a:hover]:border-[rgba(var(--accent-rgb),0.18)] [&_a:hover]:bg-[rgba(var(--accent-rgb),0.08)] [&_a:hover]:text-[var(--accent-strong)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary",
  modeTabActive:
    "!border-[rgba(var(--accent-rgb),0.2)] !bg-[var(--accent)] !text-white !shadow-[0_12px_24px_rgba(var(--accent-rgb),0.2)]",
  filterGroups: "grid gap-2.5 px-1",
  filterGroup:
    "grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2.5 max-[820px]:grid-cols-1 max-[820px]:gap-1.5 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:text-[0.8rem] [&>span]:font-black [&>span]:text-[rgba(var(--ink-rgb),0.58)] [&>span_svg]:size-[15px] [&>span_svg]:text-primary [&>div]:flex [&>div]:gap-2 [&>div]:overflow-x-auto [&>div]:pb-1 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:justify-center [&_a]:rounded-[var(--radius-pill)] [&_a]:border [&_a]:border-[rgba(var(--ink-rgb),0.1)] [&_a]:bg-white/75 [&_a]:px-3 [&_a]:text-[0.82rem] [&_a]:leading-none [&_a]:font-extrabold [&_a]:whitespace-nowrap [&_a]:text-[rgba(var(--ink-rgb),0.72)] [&_a]:transition [&_a:hover]:border-[rgba(var(--accent-rgb),0.18)] [&_a:hover]:bg-[rgba(var(--accent-rgb),0.1)] [&_a:hover]:text-[var(--accent-strong)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary",
  filterChipActive: "!border-[rgba(var(--accent-rgb),0.18)] !bg-[rgba(var(--accent-rgb),0.1)] !text-[var(--accent-strong)]",
  loadNotice:
    "rounded-[var(--radius-md)] border border-dashed border-[rgba(197,91,79,0.24)] bg-[rgba(197,91,79,0.07)] px-4 py-3.5 leading-[1.65] font-extrabold text-[#9f463f]",
  contentLayout:
    "grid grid-cols-[minmax(0,1fr)_minmax(280px,330px)] items-start gap-5 max-lg:grid-cols-1",
  feedColumn: "min-w-0",
  feedSummaryBar:
    "mb-3 flex min-w-0 items-end justify-between gap-4 px-0.5 pt-1 max-[820px]:grid max-[820px]:items-start [&_span]:text-[0.8rem] [&_span]:font-black [&_span]:text-primary [&_h2]:mt-[3px] [&_h2]:mb-0 [&_h2]:text-[clamp(1.28rem,2.4vw,1.7rem)] [&_h2]:leading-[1.18] [&_h2]:font-black [&_h2]:tracking-[-0.035em] [&_h2]:text-[#111b1f]",
  feedList: "grid gap-3",
  feedItem:
    "overflow-hidden rounded-[var(--radius-md)] bg-white shadow-[0_12px_30px_rgba(var(--ink-rgb),0.065)]",
  feedItemBody:
    "grid min-w-0 gap-3 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-white p-[18px] max-[820px]:p-4 [&_h3]:m-0 [&_h3_a]:text-[clamp(1.08rem,2vw,1.3rem)] [&_h3_a]:leading-[1.42] [&_h3_a]:font-black [&_h3_a]:tracking-[-0.02em] [&_h3_a]:text-[#111b1f] [&_h3_a]:[overflow-wrap:anywhere] [&_h3_a:hover]:text-[var(--accent-strong)] [&_h3_a:hover]:underline [&_h3_a:hover]:decoration-2 [&_h3_a:hover]:underline-offset-4 [&_h3_a:focus-visible]:outline-2 [&_h3_a:focus-visible]:outline-offset-2 [&_h3_a:focus-visible]:outline-primary",
  feedItemMeta:
    "flex flex-wrap items-center gap-2 [&_time]:text-[0.78rem] [&_time]:leading-[1.35] [&_time]:font-extrabold [&_time]:text-[rgba(var(--ink-rgb),0.58)] [&>span:not(:last-child)]:text-[0.78rem] [&>span:not(:last-child)]:leading-[1.35] [&>span:not(:last-child)]:font-extrabold [&>span:not(:last-child)]:text-[rgba(var(--ink-rgb),0.58)]",
  categoryPill:
    "inline-flex min-h-6 items-center rounded-[var(--radius-pill)] border border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(var(--accent-rgb),0.08)] px-[9px] text-[0.74rem] font-black text-[var(--accent-strong)]",
  categoryToneGreen: "!border-[rgba(15,122,106,0.16)] !bg-[rgba(15,122,106,0.09)] !text-[#0d5f53]",
  categoryToneOrange: "!border-[rgba(242,124,34,0.18)] !bg-[rgba(242,124,34,0.1)] !text-[#a45a1e]",
  categoryToneBlue: "!border-[rgba(47,130,237,0.16)] !bg-[rgba(47,130,237,0.1)] !text-[#2365b8]",
  categoryToneViolet: "!border-[rgba(125,99,241,0.16)] !bg-[rgba(125,99,241,0.1)] !text-[#604cb8]",
  categoryToneGold: "!border-[rgba(192,132,43,0.18)] !bg-[rgba(255,199,81,0.15)] !text-[#8a5a1d]",
  feedSummary:
    "m-0 line-clamp-3 text-[0.94rem] leading-[1.72] text-[rgba(var(--ink-rgb),0.7)] [overflow-wrap:anywhere] max-sm:line-clamp-4",
  recommendReason:
    "grid gap-1 rounded-[var(--radius-sm)] border border-[rgba(var(--accent-rgb),0.12)] bg-[rgba(var(--accent-rgb),0.055)] px-[13px] py-3 [&_strong]:m-0 [&_strong]:text-[0.78rem] [&_strong]:font-black [&_strong]:text-[var(--accent-strong)] [&_p]:m-0 [&_p]:line-clamp-2 [&_p]:text-[0.88rem] [&_p]:leading-[1.62] [&_p]:font-[650] [&_p]:text-[rgba(var(--ink-rgb),0.7)]",
  feedItemFooter:
    "flex flex-wrap items-center justify-between gap-2 [&>span]:text-[0.78rem] [&>span]:font-extrabold [&>span]:text-[rgba(var(--ink-rgb),0.58)] [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_a]:gap-1.5 [&_a]:font-black [&_a]:text-primary [&_a:hover]:text-[var(--accent-strong)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary [&_svg]:size-[15px]",
  sideRail: "sticky top-[168px] grid gap-3.5 max-lg:relative max-lg:top-auto max-lg:grid-cols-2 max-[820px]:grid-cols-1",
  sideCard:
    "grid gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.82)] p-[18px] shadow-[var(--shadow-sm)] max-[820px]:p-4",
  sideCardTitle:
    "news-side-title [&_span]:text-[0.8rem] [&_span]:font-black [&_span]:text-primary [&_h2]:mt-[3px] [&_h2]:mb-0 [&_h2]:text-[clamp(1.28rem,2.4vw,1.7rem)] [&_h2]:leading-[1.18] [&_h2]:font-black [&_h2]:tracking-[-0.035em] [&_h2]:text-[#111b1f]",
  dailyMeta: "inline-flex items-center gap-2 text-[0.84rem] font-black text-primary [&_svg]:size-4",
  sideMuted: "m-0 text-[0.9rem] leading-[1.68] font-[650] text-[rgba(var(--ink-rgb),0.68)]",
  dailySectionList: "grid gap-2 [&_span]:rounded-[var(--radius-sm)] [&_span]:bg-[rgba(var(--ink-rgb),0.045)] [&_span]:px-[11px] [&_span]:py-2.5 [&_span]:text-[0.82rem] [&_span]:font-extrabold [&_span]:text-[rgba(var(--ink-rgb),0.72)]",
  sourceList:
    "grid gap-2 [&_article]:grid [&_article]:gap-1.5 [&_article]:rounded-[var(--radius-sm)] [&_article]:border [&_article]:border-[rgba(var(--ink-rgb),0.08)] [&_article]:bg-white/65 [&_article]:p-3 [&_strong]:m-0 [&_strong]:text-[0.94rem] [&_strong]:text-[#111b1f] [&_p]:m-0 [&_p]:text-[0.82rem] [&_p]:leading-[1.55] [&_p]:font-[650] [&_p]:text-[rgba(var(--ink-rgb),0.64)]",
  sourceLink:
    "inline-flex min-h-10 w-fit items-center gap-1.5 rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.1)] bg-white/75 px-3 text-[0.86rem] font-black text-primary transition hover:border-[rgba(var(--accent-rgb),0.18)] hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-[var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:size-[15px]",
  sideActionLink:
    "inline-flex min-h-10 w-fit items-center gap-1.5 rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.1)] bg-white/75 px-3 text-[0.86rem] font-black text-primary transition hover:border-[rgba(var(--accent-rgb),0.18)] hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-[var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:size-[15px]",
  emptyState:
    "grid min-h-[220px] justify-items-start content-center gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.82)] p-[18px] shadow-[var(--shadow-sm)] max-[820px]:p-4 [&_strong]:m-0 [&_strong]:text-[1.15rem] [&_strong]:text-[#111b1f] [&_p]:m-0 [&_p]:max-w-[32rem] [&_p]:text-[rgba(var(--ink-rgb),0.68)] [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_a]:rounded-[var(--radius-sm)] [&_a]:border [&_a]:border-[rgba(var(--accent-rgb),0.18)] [&_a]:bg-[rgba(var(--accent-rgb),0.1)] [&_a]:px-3 [&_a]:text-[0.86rem] [&_a]:font-black [&_a]:text-[var(--accent-strong)]",
  dailyMobilePanel:
    "hidden gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.82)] p-[18px] shadow-[var(--shadow-sm)] max-lg:grid max-[820px]:p-4",
  mobileDailyGrid:
    "grid gap-2 [&_article]:grid [&_article]:grid-cols-[auto_minmax(0,1fr)_auto] [&_article]:items-center [&_article]:gap-2.5 [&_article]:rounded-[var(--radius-sm)] [&_article]:border [&_article]:border-[rgba(var(--ink-rgb),0.08)] [&_article]:bg-white/65 [&_article]:px-3 [&_article]:py-[11px] [&_span]:font-[var(--font-latin-rounded)] [&_span]:font-black [&_span]:text-primary [&_strong]:overflow-hidden [&_strong]:text-[0.9rem] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#111b1f] [&_small]:text-[0.78rem] [&_small]:font-extrabold [&_small]:text-[rgba(var(--ink-rgb),0.58)]",
  dailyReportView: "grid gap-[18px]",
  dailyHero:
    "grid gap-3 rounded-[var(--radius-lg)] bg-[#e9f9f0] p-7 max-[820px]:p-4 [&_h2]:m-0 [&_h2]:text-[clamp(2rem,4vw,3rem)] [&_h2]:leading-[1.05] [&_h2]:font-black [&_h2]:text-[#111b1f] max-[820px]:[&_h2]:text-[clamp(1.8rem,10vw,2.6rem)] [&>p]:m-0 [&>p]:text-[0.94rem] [&>p]:font-black [&>p]:text-[rgba(var(--ink-rgb),0.58)] [&>strong]:m-0 [&>strong]:max-w-[56rem] [&>strong]:text-base [&>strong]:leading-[1.78] [&>strong]:text-[rgba(var(--ink-rgb),0.74)]",
  dailyHeroTop:
    "flex items-center justify-between gap-3 max-[820px]:flex-col max-[820px]:items-start [&>span]:text-[0.78rem] [&>span]:font-black [&>span]:text-primary",
  dailyExportButton:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(var(--accent-rgb),0.18)] bg-white/80 px-[13px] text-[0.86rem] leading-none font-black whitespace-nowrap text-[var(--accent-strong)] shadow-none transition hover:-translate-y-px hover:border-[rgba(var(--accent-rgb),0.26)] hover:bg-[rgba(var(--accent-rgb),0.1)] hover:shadow-[0_10px_20px_rgba(var(--accent-rgb),0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-progress disabled:opacity-70 max-[820px]:min-h-11 max-[820px]:w-full [&_svg]:size-4 [&_svg[data-spin=true]]:animate-spin [&_small]:text-[0.76rem] [&_small]:font-black [&_small]:text-[#9f463f]",
  dailyHeroStats:
    "mt-1 flex flex-wrap gap-2.5 max-[820px]:grid max-[820px]:grid-cols-1 [&_span]:inline-grid [&_span]:min-h-10 [&_span]:grid-cols-[auto_auto] [&_span]:items-center [&_span]:gap-2 [&_span]:rounded-[var(--radius-pill)] [&_span]:border [&_span]:border-[rgba(var(--accent-rgb),0.12)] [&_span]:bg-white/65 [&_span]:px-[13px] [&_span]:text-[0.82rem] [&_span]:font-extrabold [&_span]:text-[rgba(var(--ink-rgb),0.66)] max-[820px]:[&_span]:justify-start [&_strong]:font-[var(--font-latin-rounded)] [&_strong]:text-[1.12rem] [&_strong]:text-[var(--accent-strong)]",
  dailyDigestLayout: "grid grid-cols-[minmax(220px,280px)_minmax(0,1fr)] items-start gap-[18px] max-lg:grid-cols-1",
  dailyToc:
    "sticky top-[168px] grid gap-3 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.84)] p-4 shadow-[var(--shadow-sm)] max-lg:relative max-lg:top-auto [&>span]:text-[0.78rem] [&>span]:font-black [&>span]:text-primary",
  dailyTocLinks:
    "grid gap-2 max-lg:grid-cols-2 max-[820px]:grid-cols-1 [&_a]:flex [&_a]:min-h-[42px] [&_a]:items-center [&_a]:justify-between [&_a]:gap-3 [&_a]:rounded-[var(--radius-sm)] [&_a]:border [&_a]:border-[rgba(var(--ink-rgb),0.075)] [&_a]:bg-white/65 [&_a]:px-3 [&_a]:transition [&_a:hover]:translate-x-0.5 [&_a:hover]:border-[rgba(var(--accent-rgb),0.18)] [&_a:hover]:bg-[rgba(var(--accent-rgb),0.075)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary [&_strong]:overflow-hidden [&_strong]:text-[0.84rem] [&_strong]:font-black [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#111b1f] [&_small]:shrink-0 [&_small]:text-[0.76rem] [&_small]:font-extrabold [&_small]:text-[rgba(var(--ink-rgb),0.56)]",
  dailyDigestSections: "grid gap-4",
  dailyDigestSection:
    "grid min-w-0 scroll-mt-[126px] gap-4 rounded-[var(--radius-md)] bg-white p-[22px] shadow-[0_12px_30px_rgba(var(--ink-rgb),0.065)] max-[820px]:p-4",
  dailyDigestSectionHeader:
    "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 max-[820px]:grid-cols-[auto_minmax(0,1fr)] [&>span]:font-[var(--font-latin-rounded)] [&>span]:text-[1.6rem] [&>span]:leading-none [&>span]:font-black [&>span]:text-primary [&_h3]:m-0 [&_h3]:text-[clamp(1.2rem,2.2vw,1.55rem)] [&_h3]:leading-[1.18] [&_h3]:font-black [&_h3]:text-[#111b1f] [&_p]:mt-[3px] [&_p]:mb-0 [&_p]:text-[0.78rem] [&_p]:font-black [&_p]:text-[rgba(var(--ink-rgb),0.54)] [&>strong]:inline-flex [&>strong]:min-h-[30px] [&>strong]:items-center [&>strong]:rounded-[var(--radius-pill)] [&>strong]:bg-[rgba(var(--accent-rgb),0.08)] [&>strong]:px-2.5 [&>strong]:text-[0.8rem] [&>strong]:font-black [&>strong]:whitespace-nowrap [&>strong]:text-[var(--accent-strong)] max-[820px]:[&>strong]:col-start-2 max-[820px]:[&>strong]:w-fit",
  dailyDigestItems: "grid min-w-0 border-t border-[rgba(var(--ink-rgb),0.075)]",
  dailyDigestItem:
    "grid min-w-0 gap-2 border-b border-[rgba(var(--ink-rgb),0.075)] py-4 last:border-b-0 last:pb-0 [&_a]:inline-flex [&_a]:min-w-0 [&_a]:items-start [&_a]:gap-1.5 [&_a]:text-base [&_a]:leading-[1.45] [&_a]:font-black [&_a]:text-[#111b1f] [&_a]:[overflow-wrap:anywhere] [&_a:hover]:text-[var(--accent-strong)] [&_a:hover]:underline [&_a:hover]:decoration-2 [&_a:hover]:underline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary [&_a_svg]:mt-[0.24em] [&_a_svg]:size-[15px] [&_a_svg]:shrink-0 [&_a_svg]:text-primary [&>span]:text-[0.78rem] [&>span]:font-extrabold [&>span]:text-[rgba(var(--ink-rgb),0.56)] [&>p]:m-0 [&>p]:text-[0.92rem] [&>p]:leading-[1.72] [&>p]:text-[rgba(var(--ink-rgb),0.7)] [&>p]:[overflow-wrap:anywhere]",
  groupDailyView: "grid grid-cols-[minmax(210px,260px)_minmax(0,1fr)] items-start gap-[18px] max-lg:grid-cols-1",
  groupReportNav:
    "sticky top-[168px] grid gap-3.5 rounded-[var(--radius-md)] border border-[rgba(205,176,137,0.34)] bg-[rgba(255,249,240,0.88)] p-4 shadow-[var(--shadow-sm)] max-lg:relative max-lg:top-auto max-[820px]:gap-2.5 max-[820px]:p-3 max-[820px]:[&_.news-side-title]:flex max-[820px]:[&_.news-side-title]:items-baseline max-[820px]:[&_.news-side-title]:justify-between",
  groupReportLinks:
    "grid max-h-[68vh] gap-2 overflow-auto pr-0.5 max-lg:grid-cols-4 max-lg:max-h-none max-lg:overflow-x-auto max-[820px]:flex max-[820px]:snap-x max-[820px]:gap-2 max-[820px]:overflow-x-auto max-[820px]:px-0.5 max-[820px]:pb-1 [&>a]:relative [&>a]:flex [&>a]:min-h-11 [&>a]:min-w-0 [&>a]:items-center [&>a]:justify-between [&>a]:gap-2.5 [&>a]:rounded-[var(--radius-sm)] [&>a]:border [&>a]:border-[rgba(146,101,58,0.12)] [&>a]:bg-white/70 [&>a]:px-3 [&>a]:transition hover:[&>a]:translate-x-0.5 hover:[&>a]:border-[rgba(205,126,50,0.28)] hover:[&>a]:bg-[rgba(205,126,50,0.1)] max-[820px]:[&>a]:min-h-[42px] max-[820px]:[&>a]:min-w-[92px] max-[820px]:[&>a]:snap-start max-[820px]:[&>a]:justify-center max-[820px]:[&>a]:px-2.5 [&_strong]:overflow-hidden [&_strong]:text-[0.9rem] [&_strong]:leading-[1.2] [&_strong]:font-black [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#2b221a] [&_small]:shrink-0 [&_small]:text-[0.76rem] [&_small]:font-extrabold [&_small]:whitespace-nowrap [&_small]:text-[rgba(var(--ink-rgb),0.56)] max-[820px]:[&_small]:hidden",
  groupReportLinkActive:
    "!border-[rgba(205,126,50,0.44)] !bg-[rgba(205,126,50,0.16)] !shadow-[inset_4px_0_0_#db8d43] [&_strong]:!text-[#7d3f12] [&_small]:!text-[rgba(125,63,18,0.74)]",
  groupReportPoster:
    "grid min-w-0 gap-[30px] rounded-[var(--radius-md)] border border-[rgba(197,151,91,0.22)] bg-[linear-gradient(180deg,rgba(253,245,234,0.96),rgba(249,239,225,0.96))] p-7 shadow-[0_18px_46px_rgba(79,48,20,0.1)] max-[820px]:gap-6 max-[820px]:p-4",
  groupPosterHeader:
    "grid min-w-0 gap-2 border-b border-[rgba(119,84,48,0.12)] pb-3 [&_h2]:m-0 [&_h2]:text-[2.35rem] [&_h2]:leading-[1.12] [&_h2]:font-black [&_h2]:text-[#1f2524] [&_h2]:[overflow-wrap:anywhere] max-[820px]:[&_h2]:text-[1.75rem] [&>p]:m-0 [&>p]:text-[0.9rem] [&>p]:leading-[1.5] [&>p]:font-extrabold [&>p]:text-[rgba(72,57,41,0.66)]",
  groupPosterHeaderTop: "flex min-w-0 items-start justify-between gap-3 max-[820px]:flex-col",
  groupPosterHeaderActions: "flex shrink-0 flex-wrap justify-end gap-2",
  groupPosterEyebrow:
    "flex min-w-0 items-center gap-3 max-[820px]:items-start [&_span]:font-[var(--font-latin-rounded)] [&_span]:text-[0.78rem] [&_span]:font-black [&_span]:uppercase [&_span]:text-[#bc6d2a] [&_strong]:grid [&_strong]:size-[42px] [&_strong]:place-items-center [&_strong]:rounded-[var(--radius-pill)] [&_strong]:border [&_strong]:border-[rgba(15,122,106,0.12)] [&_strong]:bg-white/70 [&_strong]:font-[var(--font-latin-rounded)] [&_strong]:font-black [&_strong]:text-primary",
  groupStatGrid:
    "grid grid-cols-4 gap-2.5 max-[820px]:grid-cols-1 [&_span]:grid [&_span]:min-w-0 [&_span]:gap-1 [&_span]:rounded-[var(--radius-sm)] [&_span]:border [&_span]:border-[rgba(146,101,58,0.12)] [&_span]:bg-white/60 [&_span]:p-3 [&_span]:text-[0.78rem] [&_span]:font-extrabold [&_span]:text-[rgba(72,57,41,0.62)] [&_strong]:font-[var(--font-latin-rounded)] [&_strong]:text-[1.18rem] [&_strong]:font-black [&_strong]:text-[#1f2524]",
  groupPosterSection:
    "grid min-w-0 gap-3 [&>span]:font-[var(--font-latin-rounded)] [&>span]:text-[0.78rem] [&>span]:font-black [&>span]:uppercase [&>span]:text-[#bc6d2a] [&>h3]:m-0 [&>h3]:text-[1.65rem] [&>h3]:leading-[1.18] [&>h3]:font-black [&>h3]:text-[#1f2524] max-[820px]:[&>h3]:text-[1.35rem]",
  groupSpeakerRanking:
    "m-0 grid list-none grid-cols-2 gap-2.5 p-0 max-[820px]:grid-cols-1 [&_li]:grid [&_li]:min-w-0 [&_li]:grid-cols-[auto_minmax(0,1fr)_auto] [&_li]:items-center [&_li]:gap-2.5 [&_li]:rounded-[var(--radius-sm)] [&_li]:border [&_li]:border-[rgba(146,101,58,0.12)] [&_li]:bg-white/70 [&_li]:p-3 [&_li>span]:grid [&_li>span]:size-7 [&_li>span]:place-items-center [&_li>span]:rounded-full [&_li>span]:bg-[rgba(188,109,42,0.1)] [&_li>span]:text-[0.78rem] [&_li>span]:font-black [&_li>span]:text-[#a95c1e] [&_strong]:overflow-hidden [&_strong]:text-[0.88rem] [&_strong]:font-black [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[#1f2524] [&_small]:text-[0.76rem] [&_small]:font-extrabold [&_small]:whitespace-nowrap [&_small]:text-[rgba(72,57,41,0.58)]",
  groupPosterQuote:
    "m-0 rounded-[var(--radius-sm)] border-l-4 border-[#db8d43] bg-white/70 px-[18px] py-4 leading-[1.8] font-bold text-[rgba(58,45,33,0.74)] shadow-[0_10px_24px_rgba(79,48,20,0.08)] [overflow-wrap:anywhere]",
  groupOverview:
    "m-0 rounded-[var(--radius-sm)] border border-[rgba(146,101,58,0.12)] bg-white/70 p-[18px] text-[0.98rem] leading-[1.82] font-bold text-[rgba(58,45,33,0.74)] [overflow-wrap:anywhere]",
  groupVibe:
    "m-0 rounded-[var(--radius-sm)] border border-[rgba(146,101,58,0.12)] bg-white/70 p-[18px] text-[0.98rem] leading-[1.82] font-bold text-[rgba(58,45,33,0.74)] [overflow-wrap:anywhere]",
  groupHighlightGrid: "grid grid-cols-2 gap-3 max-[820px]:grid-cols-1",
  groupHighlightCard:
    "grid min-w-0 gap-2 rounded-[var(--radius-sm)] bg-white p-[15px] shadow-[0_9px_18px_rgba(79,48,20,0.06)] [&:nth-child(2)]:bg-[#fff2e5] [&:nth-child(3)]:bg-[#edf5ff] [&_h3]:m-0 [&_h3]:text-base [&_h3]:leading-[1.38] [&_h3]:font-black [&_h3]:text-[#1f2524] [&>p]:m-0 [&>p]:text-[0.88rem] [&>p]:leading-[1.68] [&>p]:text-[rgba(58,45,33,0.68)]",
  groupCardMeta:
    "flex items-center justify-between gap-2.5 [&_span]:font-[var(--font-latin-rounded)] [&_span]:text-[0.9rem] [&_span]:font-black [&_span]:text-[#bc6d2a] [&_time]:text-[0.72rem] [&_time]:font-black [&_time]:text-[rgba(72,57,41,0.52)]",
  groupPeopleList:
    "flex flex-wrap gap-1.5 [&_span]:inline-flex [&_span]:min-h-6 [&_span]:items-center [&_span]:rounded-full [&_span]:border [&_span]:border-[rgba(15,122,106,0.12)] [&_span]:bg-[rgba(15,122,106,0.07)] [&_span]:px-2 [&_span]:text-[0.72rem] [&_span]:font-black [&_span]:text-[#0d5f53]",
  groupDiscussionList: "grid gap-3",
  groupDiscussionCard:
    "grid min-w-0 gap-2.5 rounded-[var(--radius-sm)] bg-white p-[18px] shadow-[0_9px_18px_rgba(79,48,20,0.06)] [&>span]:text-[0.76rem] [&>span]:font-black [&>span]:text-[#bc6d2a] [&_h3]:m-0 [&_h3]:flex [&_h3]:flex-wrap [&_h3]:items-baseline [&_h3]:gap-2 [&_h3]:text-[1.18rem] [&_h3]:leading-[1.38] [&_h3]:font-black [&_h3]:text-[#1f2524] [&_small]:text-[0.78rem] [&_small]:font-black [&_small]:text-[rgba(72,57,41,0.54)] [&>p]:m-0 [&>p]:text-[0.88rem] [&>p]:leading-[1.68] [&>p]:text-[rgba(58,45,33,0.68)] [&_blockquote]:m-0 [&_blockquote]:border-l-4 [&_blockquote]:border-[#db8d43] [&_blockquote]:bg-white/70 [&_blockquote]:px-3 [&_blockquote]:py-2.5 [&_blockquote]:text-[0.84rem] [&_blockquote]:leading-[1.8] [&_blockquote]:font-bold [&_blockquote]:text-[rgba(58,45,33,0.74)]",
  groupResourceList: "grid gap-3",
  groupResourceCard:
    "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-[var(--radius-sm)] bg-white p-[15px] shadow-[0_9px_18px_rgba(79,48,20,0.06)] [&>span]:grid [&>span]:size-7 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[rgba(219,141,67,0.14)] [&>span]:text-[0.78rem] [&>span]:font-black [&>span]:text-[#a65d22] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-1.5 [&_h3]:m-0 [&_h3]:text-[0.98rem] [&_h3]:leading-[1.38] [&_h3]:font-black [&_h3]:text-[#1f2524] [&_p]:m-0 [&_p]:text-[0.88rem] [&_p]:leading-[1.68] [&_p]:text-[rgba(58,45,33,0.68)] [&_a]:inline-flex [&_a]:min-h-10 [&_a]:w-fit [&_a]:items-center [&_a]:gap-1.5 [&_a]:text-[0.84rem] [&_a]:font-black [&_a]:text-primary [&_a:hover]:underline [&_a:hover]:decoration-2 [&_a:hover]:underline-offset-4 [&_svg]:size-3.5",
  groupTagList:
    "flex flex-wrap gap-2 [&_span]:inline-flex [&_span]:min-h-6 [&_span]:items-center [&_span]:rounded-full [&_span]:border [&_span]:border-[rgba(15,122,106,0.12)] [&_span]:bg-[rgba(15,122,106,0.07)] [&_span]:px-2 [&_span]:text-[0.72rem] [&_span]:font-black [&_span]:text-[#0d5f53]",
  groupLockedSection: "relative -mt-1",
  groupLockedPanel:
    "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[var(--radius-sm)] border border-[rgba(15,122,106,0.16)] bg-white/80 p-[18px] shadow-[0_14px_30px_rgba(79,48,20,0.08)] max-[820px]:grid-cols-1 max-[820px]:justify-items-start [&_strong]:m-0 [&_strong]:text-[1.02rem] [&_strong]:leading-[1.35] [&_strong]:font-black [&_strong]:text-[#1f2524] [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_a]:justify-center [&_a]:rounded-full [&_a]:bg-[var(--accent)] [&_a]:px-3.5 [&_a]:text-[0.88rem] [&_a]:font-black [&_a]:whitespace-nowrap [&_a]:text-white [&_a]:shadow-[0_10px_20px_rgba(var(--accent-rgb),0.16)] [&_a]:transition hover:[&_a]:-translate-y-px hover:[&_a]:bg-[var(--accent-strong)] max-[820px]:[&_a]:w-full",
  groupLockedIcon:
    "grid size-11 place-items-center rounded-full border border-[rgba(15,122,106,0.14)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent-strong)] [&_svg]:size-[19px]",
  dailyEmpty:
    "grid min-h-[260px] justify-items-start content-center gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.82)] p-[22px] shadow-[var(--shadow-sm)] max-[820px]:p-4 [&>span]:text-[0.78rem] [&>span]:font-black [&>span]:text-primary [&_h2]:m-0 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-[#111b1f] [&_p]:m-0 [&_p]:leading-[1.7] [&_p]:text-[rgba(var(--ink-rgb),0.68)] [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_a]:rounded-[var(--radius-sm)] [&_a]:border [&_a]:border-[rgba(var(--accent-rgb),0.18)] [&_a]:bg-[rgba(var(--accent-rgb),0.1)] [&_a]:px-3 [&_a]:text-[0.88rem] [&_a]:font-black [&_a]:text-[var(--accent-strong)]",
  futureSourcesBand:
    "grid gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.82)] p-[22px] shadow-[var(--shadow-sm)] max-[820px]:p-4",
} as const;
