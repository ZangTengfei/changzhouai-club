"use client";

import { useFormStatus } from "react-dom";

import { updateAccountProfile } from "@/app/(site)/account/actions";
import { AccountAvatarField } from "@/components/account-avatar-field";

type AccountProfileFormProps = {
  userId: string;
  profile: {
    display_name: string | null;
    public_slug: string | null;
    avatar_url: string | null;
    wechat: string | null;
    city: string | null;
    role_label: string | null;
    organization: string | null;
    monthly_time: string | null;
    bio: string | null;
    skills: string[] | null;
    interests: string[] | null;
  } | null;
  member: {
    willing_to_attend: boolean | null;
    willing_to_share: boolean | null;
    willing_to_join_projects: boolean | null;
  } | null;
};

function FieldTag({ required }: { required: boolean }) {
  return (
    <span
      className={`field-meta-tag ${
        required ? "field-meta-tag-required" : "field-meta-tag-optional"
      }`}
    >
      {required ? "必填" : "选填"}
    </span>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <span className="form-label-row">
      <span>{label}</span>
      <FieldTag required={required} />
    </span>
  );
}

function AccountProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? "保存中..." : "保存资料"}
    </button>
  );
}

export function AccountProfileForm({
  userId,
  profile,
  member,
}: AccountProfileFormProps) {
  return (
    <form action={updateAccountProfile} className="account-form surface">
      <div className="section-heading">
        <p className="eyebrow">Profile</p>
        <h2>完善加入资料</h2>
        <p>
          标记为必填的项目用于完成社区加入；其余内容都可以稍后再回来补充或更新。
        </p>
      </div>

      <div className="form-grid">
        <AccountAvatarField
          name="avatar_url"
          defaultValue={profile?.avatar_url ?? ""}
          userId={userId}
          displayName={profile?.display_name ?? "我的头像"}
        />

        <label className="form-field">
          <FieldLabel label="显示名" required />
          <input
            className="input"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="比如：张三"
            required
          />
        </label>

        <label className="form-field">
          <FieldLabel label="微信号" required />
          <input
            className="input"
            name="wechat"
            defaultValue={profile?.wechat ?? ""}
            placeholder="用于社区联系"
            required
          />
        </label>

        <label className="form-field">
          <FieldLabel label="个人主页链接" required={false} />
          <span className="input-group">
            <span className="input-prefix">/members/</span>
            <input
              className="input input-group-field"
              name="public_slug"
              defaultValue={profile?.public_slug ?? ""}
              placeholder="zhangsan-ai"
              pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]"
            />
          </span>
          <p className="form-field-help">
            3-32 位小写英文、数字或短横线；公开展示后会优先使用这个链接。
          </p>
        </label>

        <label className="form-field">
          <FieldLabel label="城市" required={false} />
          <input
            className="input"
            name="city"
            defaultValue={profile?.city ?? ""}
            placeholder="例如：常州·新北区 / 常州·天宁区 / 无锡"
          />
          <p className="form-field-help">
            如果你在常州，建议填写到区，方便大家更准确地建立线下连接。
          </p>
        </label>

        <label className="form-field">
          <FieldLabel label="身份 / 角色" required={false} />
          <input
            className="input"
            name="role_label"
            defaultValue={profile?.role_label ?? ""}
            placeholder="例如：开发者 / 产品经理 / 创业者 / 学生"
          />
        </label>

        <label className="form-field">
          <FieldLabel label="公司 / 学校 / 团队" required={false} />
          <input
            className="input"
            name="organization"
            defaultValue={profile?.organization ?? ""}
            placeholder="例如：SenseLeap.ai / 常州大学 / 独立开发"
          />
        </label>

        <label className="form-field">
          <FieldLabel label="每月可投入时间" required={false} />
          <input
            className="input"
            name="monthly_time"
            defaultValue={profile?.monthly_time ?? ""}
            placeholder="例如：每周 2 小时 / 每月参加 1 次线下活动"
          />
        </label>

        <label className="form-field form-field-wide">
          <FieldLabel label="技能标签" required={false} />
          <input
            className="input"
            name="skills"
            defaultValue={profile?.skills?.join("，") ?? ""}
            placeholder="例如：Agent，RAG，前端工程，自动化工作流"
          />
        </label>

        <label className="form-field form-field-wide">
          <FieldLabel label="感兴趣的主题" required={false} />
          <input
            className="input"
            name="interests"
            defaultValue={profile?.interests?.join("，") ?? ""}
            placeholder="例如：LLM 应用，自动化工作流，项目交付"
          />
        </label>

        <label className="form-field form-field-wide">
          <FieldLabel label="个人简介" required={false} />
          <textarea
            className="input textarea"
            name="bio"
            defaultValue={profile?.bio ?? ""}
            placeholder="简单介绍一下你的方向、当前关注的话题，或者你希望在社区里参与什么。"
            rows={5}
          />
        </label>
      </div>

      <div className="checkbox-list">
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="willing_to_attend"
            defaultChecked={member?.willing_to_attend ?? true}
          />
          <span className="checkbox-label-copy">
            <span>我愿意参加线下活动</span>
            <FieldTag required={false} />
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="willing_to_share"
            defaultChecked={member?.willing_to_share ?? false}
          />
          <span className="checkbox-label-copy">
            <span>我愿意在社区活动里做主题分享</span>
            <FieldTag required={false} />
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="willing_to_join_projects"
            defaultChecked={member?.willing_to_join_projects ?? false}
          />
          <span className="checkbox-label-copy">
            <span>如有合适的合作机会，我愿意参与协作</span>
            <FieldTag required={false} />
          </span>
        </label>
      </div>

      <div className="cta-row">
        <AccountProfileSubmitButton />
      </div>
    </form>
  );
}
