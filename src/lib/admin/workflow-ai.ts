type WorkflowAiInput = {
  jobType: string;
  runTitle: string;
  runSummary?: string | null;
  stepTitle: string;
  stepDescription?: string | null;
  context?: Record<string, unknown>;
};

export type WorkflowAiOutput = {
  title: string;
  summary: string;
  checklist: string[];
  drafts: Array<{
    channel: string;
    title: string;
    body: string;
  }>;
  next_actions: string[];
};

const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

function getDeepSeekConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;

  if (!apiKey) {
    throw new Error("missing_deepseek_api_key");
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    model,
  };
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];
}

function normalizeDrafts(value: unknown): WorkflowAiOutput["drafts"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const draft = item as Record<string, unknown>;

      return {
        channel: String(draft.channel ?? "内部草稿").trim(),
        title: String(draft.title ?? "").trim(),
        body: String(draft.body ?? "").trim(),
      };
    })
    .filter((draft) => draft.title || draft.body)
    .slice(0, 6);
}

function normalizeAiOutput(value: unknown): WorkflowAiOutput {
  const object = (value ?? {}) as Record<string, unknown>;

  return {
    title: String(object.title ?? "AI 工作流草稿").trim(),
    summary: String(object.summary ?? "").trim(),
    checklist: normalizeStringArray(object.checklist),
    drafts: normalizeDrafts(object.drafts),
    next_actions: normalizeStringArray(object.next_actions),
  };
}

function buildSystemPrompt() {
  return [
    "你是常州 AI Club 的社区运营工作流助手。",
    "你的任务是帮助运营者把活动、内容、资料和后续合作动作整理成可执行草稿。",
    "必须输出严格 JSON，不要输出 Markdown，不要输出解释。",
    "JSON schema: {\"title\": string, \"summary\": string, \"checklist\": string[], \"drafts\": [{\"channel\": string, \"title\": string, \"body\": string}], \"next_actions\": string[]}",
    "不要虚构已确认的嘉宾、场地、价格、报名人数或外部承诺；不确定的内容写成待确认动作。",
  ].join("\n");
}

function buildUserPrompt(input: WorkflowAiInput) {
  return JSON.stringify(
    {
      instruction: "请基于以下活动工作流节点，生成可审核的社区运营草稿，输出严格 json。",
      job_type: input.jobType,
      workflow: {
        title: input.runTitle,
        summary: input.runSummary,
      },
      step: {
        title: input.stepTitle,
        description: input.stepDescription,
      },
      context: input.context ?? {},
      output_requirements: {
        title: "一句话说明本次 AI 产物",
        summary: "80 到 160 字，说明可直接给运营者看的结论",
        checklist: "3 到 6 个可执行检查项",
        drafts: "按需要生成官网/社群/朋友圈/小红书/复盘等草稿，不需要每个平台都生成",
        next_actions: "3 到 6 个下一步动作",
      },
    },
    null,
    2,
  );
}

export async function runWorkflowDeepSeekJob(input: WorkflowAiInput) {
  const { apiKey, baseUrl, model } = getDeepSeekConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(input),
        },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0.4,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`deepseek_request_failed:${response.status}:${errorText.slice(0, 180)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("deepseek_empty_response");
  }

  try {
    return {
      model,
      output: normalizeAiOutput(JSON.parse(content)),
      rawContent: content,
    };
  } catch (error) {
    throw new Error(
      `deepseek_invalid_json:${error instanceof Error ? error.message : "unknown"}`,
    );
  }
}
