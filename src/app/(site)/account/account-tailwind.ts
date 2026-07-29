export const accountPageClassName = "grid gap-[22px] max-sm:gap-[18px]";

export const accountPanelClassName =
  "grid min-w-0 gap-5 rounded-[var(--radius-lg)] border border-[rgba(208,214,207,0.7)] bg-[linear-gradient(180deg,rgba(245,244,238,0.92),rgba(240,239,232,0.9))] p-6 shadow-[var(--shadow-sm)] max-sm:p-5";

export const disabledPanelClassName = `${accountPanelClassName} justify-items-start [&_h1]:m-0 [&_h1]:text-[clamp(2rem,4vw,3rem)] [&_h1]:leading-[1.08] [&_h1]:font-black [&_h1]:text-[#111b1f] [&_p]:m-0 [&_p]:leading-[1.75] [&_p]:text-[rgba(var(--ink-rgb),0.68)]`;

export const accountWorkSubmitSectionClassName = `${accountPanelClassName} gap-[18px]`;

export const accountWorkSubmitHeaderClassName =
  "flex min-w-0 items-start justify-between gap-[18px] max-[820px]:grid [&>.button]:max-[820px]:w-fit [&>div]:grid [&>div]:min-w-0 [&>div]:max-w-[720px] [&>div]:gap-2.5 [&_h1]:m-0 [&_h1]:text-[clamp(2rem,3vw,2.55rem)] [&_h1]:leading-[1.08] [&_h1]:font-black [&_h1]:tracking-normal [&_h1]:text-[#111a1d] [&>div>p:not(.home-kicker)]:m-0 [&>div>p:not(.home-kicker)]:text-[0.98rem] [&>div>p:not(.home-kicker)]:leading-[1.7] [&>div>p:not(.home-kicker)]:font-[650] [&>div>p:not(.home-kicker)]:text-[rgba(var(--ink-rgb),0.66)]";

export const statusNoteClassName =
  "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.08)] px-[18px] py-4 font-extrabold text-[var(--accent-strong)] [&_svg]:size-5";

export const statusNoteErrorClassName =
  "border-[rgba(197,91,79,0.28)] bg-[rgba(197,91,79,0.08)] text-[var(--destructive)]";

export const accountWorkFormClassName =
  "grid grid-cols-2 gap-3.5 max-sm:grid-cols-1 [&_.input]:rounded-[var(--radius-sm)] [&_.input]:border-[rgba(var(--ink-rgb),0.12)] [&_.input]:bg-white/75 [&_.textarea]:rounded-[var(--radius-sm)] [&_.textarea]:border-[rgba(var(--ink-rgb),0.12)] [&_.textarea]:bg-white/75 [&_label]:grid [&_label]:min-w-0 [&_label]:gap-2 [&_label>span]:text-[0.86rem] [&_label>span]:font-[850] [&_label>span]:text-[#132321]";

export const accountWorkWideFieldClassName = "col-span-full max-sm:col-auto";
export const accountWorkFieldGroupClassName = "grid min-w-0 gap-2";
export const accountWorkFieldLabelClassName =
  "text-[0.86rem] font-[850] text-[#132321]";
export const accountWorkFormFooterClassName =
  "col-span-full flex flex-wrap items-center gap-3 max-sm:col-auto max-sm:[&_.button]:w-full [&_span]:text-[0.88rem] [&_span]:font-bold [&_span]:text-[rgba(var(--ink-rgb),0.58)] [&_svg]:size-[17px]";
