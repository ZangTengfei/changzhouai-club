"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { Send, Trash2 } from "lucide-react";

import { saveAccountMemberWork } from "@/app/(site)/account/actions";
import { ImageUploadField } from "@/components/image-upload-field";
import { workStatusLabels, workTypeLabels } from "@/lib/community-works";

import styles from "../../account-page.module.css";

const ACCOUNT_WORK_DRAFT_KEY = "changzhouai.account.member-work.new.v1";
const ACCOUNT_WORK_NEW_PATH = "/account/works/new";

type WorkDraft = {
  title: string;
  work_type: keyof typeof workTypeLabels;
  status: keyof typeof workStatusLabels;
  role_label: string;
  summary: string;
  description: string;
  cover_image_url: string;
  qr_code_image_url: string;
  website_url: string;
  demo_url: string;
  repo_url: string;
  tags: string;
};

const initialDraft: WorkDraft = {
  title: "",
  work_type: "product",
  status: "building",
  role_label: "",
  summary: "",
  description: "",
  cover_image_url: "",
  qr_code_image_url: "",
  website_url: "",
  demo_url: "",
  repo_url: "",
  tags: "",
};

const draftFieldNames = new Set<keyof WorkDraft>(Object.keys(initialDraft) as Array<keyof WorkDraft>);

function isDraftFieldName(value: string): value is keyof WorkDraft {
  return draftFieldNames.has(value as keyof WorkDraft);
}

function isWorkType(value: string): value is keyof typeof workTypeLabels {
  return value in workTypeLabels;
}

function isWorkStatus(value: string): value is keyof typeof workStatusLabels {
  return value in workStatusLabels;
}

function getStoredDraft(): WorkDraft | null {
  try {
    const raw = window.localStorage.getItem(ACCOUNT_WORK_DRAFT_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Record<keyof WorkDraft, unknown>>;
    const draft: WorkDraft = { ...initialDraft };

    Object.keys(initialDraft).forEach((field) => {
      const key = field as keyof WorkDraft;
      const value = parsed[key];

      if (typeof value !== "string") {
        return;
      }

      if (key === "work_type") {
        draft.work_type = isWorkType(value) ? value : initialDraft.work_type;
        return;
      }

      if (key === "status") {
        draft.status = isWorkStatus(value) ? value : initialDraft.status;
        return;
      }

      draft[key] = value as never;
    });

    return draft;
  } catch {
    return null;
  }
}

function hasDraftContent(draft: WorkDraft) {
  return Object.entries(draft).some(([field, value]) => {
    const key = field as keyof WorkDraft;
    return value.trim() && value !== initialDraft[key];
  });
}

function formatSavedTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function AccountWorkSubmitForm({ userId }: { userId: string }) {
  const [values, setValues] = useState<WorkDraft>(initialDraft);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => {
    const storedDraft = getStoredDraft();

    if (storedDraft) {
      setValues(storedDraft);
      setDraftMessage("已恢复本地草稿");
    }

    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) {
      return;
    }

    try {
      if (hasDraftContent(values)) {
        window.localStorage.setItem(ACCOUNT_WORK_DRAFT_KEY, JSON.stringify(values));
        setDraftMessage(`草稿已保存 ${formatSavedTime()}`);
      } else {
        window.localStorage.removeItem(ACCOUNT_WORK_DRAFT_KEY);
      }
    } catch {
      setDraftMessage("草稿暂时无法保存");
    }
  }, [draftLoaded, values]);

  function updateField<Field extends keyof WorkDraft>(
    field: Field,
    value: WorkDraft[Field],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    if (!isDraftFieldName(name)) {
      return;
    }

    updateField(name, value as never);
  }

  function clearDraft() {
    setValues(initialDraft);
    setDraftMessage("草稿已清空");

    try {
      window.localStorage.removeItem(ACCOUNT_WORK_DRAFT_KEY);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }

  return (
    <form
      action={saveAccountMemberWork}
      className={`${styles.accountWorkForm} ${styles.accountWorkSubmitForm}`}
      onSubmit={() => setDraftMessage("正在提交审核...")}
    >
      <input type="hidden" name="redirect_to" value={ACCOUNT_WORK_NEW_PATH} />

      <label>
        <span>作品名称</span>
        <input
          className="input"
          name="title"
          value={values.title}
          onChange={handleFieldChange}
          required
        />
      </label>

      <label>
        <span>作品类型</span>
        <select
          className="input"
          name="work_type"
          value={values.work_type}
          onChange={handleFieldChange}
        >
          {Object.entries(workTypeLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>当前状态</span>
        <select
          className="input"
          name="status"
          value={values.status}
          onChange={handleFieldChange}
        >
          {Object.entries(workStatusLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>我在其中的角色</span>
        <input
          className="input"
          name="role_label"
          value={values.role_label}
          onChange={handleFieldChange}
          placeholder="例如：发起人 / 开发者 / 产品负责人"
        />
      </label>

      <label className={styles.accountWorkWideField}>
        <span>一句话介绍</span>
        <textarea
          className="input textarea"
          name="summary"
          value={values.summary}
          onChange={handleFieldChange}
          rows={2}
          required
        />
      </label>

      <label className={styles.accountWorkWideField}>
        <span>详细说明</span>
        <textarea
          className="input textarea"
          name="description"
          value={values.description}
          onChange={handleFieldChange}
          rows={5}
        />
      </label>

      <div className={`${styles.accountWorkWideField} ${styles.accountWorkFieldGroup}`}>
        <span className={styles.accountWorkFieldLabel}>封面 / 产品图片</span>
        <ImageUploadField
          name="cover_image_url"
          value={values.cover_image_url}
          onValueChange={(value) => updateField("cover_image_url", value)}
          uploadTarget={{
            kind: "member-work-asset",
            userId,
          }}
          mode="upload-or-url"
          appearance="site"
          placeholder="可上传图片，也可填写 https://..."
          uploadLabel="上传图片"
          clearLabel="清空图片"
          panelTitle="上传案例封面或产品截图"
          panelDescription="用于案例库卡片展示。建议上传产品界面、项目截图或品牌视觉图。"
          filledStatusText="已设置图片"
          emptyStatusText="当前未设置图片"
        />
      </div>

      <div className={`${styles.accountWorkWideField} ${styles.accountWorkFieldGroup}`}>
        <span className={styles.accountWorkFieldLabel}>小程序码 / 二维码</span>
        <ImageUploadField
          name="qr_code_image_url"
          value={values.qr_code_image_url}
          onValueChange={(value) => updateField("qr_code_image_url", value)}
          uploadTarget={{
            kind: "member-work-asset",
            userId,
          }}
          mode="upload-or-url"
          appearance="site"
          placeholder="可上传图片，也可填写 https://..."
          uploadLabel="上传二维码"
          clearLabel="清空二维码"
          panelTitle="上传小程序码或二维码"
          panelDescription="用于公开案例卡片的扫码入口，点击后会展示完整图片，避免封面裁切影响扫码。"
          filledStatusText="已设置二维码"
          emptyStatusText="当前未设置二维码"
        />
      </div>

      <label>
        <span>官网 / 产品链接</span>
        <input
          className="input"
          name="website_url"
          value={values.website_url}
          onChange={handleFieldChange}
          placeholder="https://... 或 #小程序://名称/路径"
        />
      </label>

      <label>
        <span>Demo 链接</span>
        <input
          className="input"
          name="demo_url"
          value={values.demo_url}
          onChange={handleFieldChange}
          placeholder="https://... 或 #小程序://名称/路径"
        />
      </label>

      <label>
        <span>代码仓库</span>
        <input
          className="input"
          name="repo_url"
          value={values.repo_url}
          onChange={handleFieldChange}
          placeholder="https://..."
        />
      </label>

      <label className={styles.accountWorkWideField}>
        <span>标签</span>
        <input
          className="input"
          name="tags"
          value={values.tags}
          onChange={handleFieldChange}
          placeholder="例如：AI 工具、OPC、自动化"
        />
      </label>

      <div className={styles.accountWorkFormFooter}>
        <button type="submit" className="button home-primary-button">
          <Send aria-hidden="true" strokeWidth={2} />
          提交审核
        </button>
        <button
          type="button"
          className="button home-ghost-button"
          onClick={clearDraft}
          disabled={!hasDraftContent(values)}
        >
          <Trash2 aria-hidden="true" strokeWidth={2} />
          清空草稿
        </button>
        <span>{draftMessage || "提交后会暂时隐藏，审核通过后才会公开展示。"}</span>
      </div>
    </form>
  );
}
