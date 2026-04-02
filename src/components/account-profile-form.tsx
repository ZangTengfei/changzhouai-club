"use client";

import { useFormStatus } from "react-dom";

import { updateAccountProfile } from "@/app/account/actions";

type AccountProfileFormProps = {
  profile: {
    display_name: string | null;
    city: string | null;
    role_label: string | null;
    organization: string | null;
    bio: string | null;
    skills: string[] | null;
  } | null;
  member: {
    willing_to_share: boolean | null;
    willing_to_join_projects: boolean | null;
  } | null;
};

function AccountProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? "保存中..." : "保存资料"}
    </button>
  );
}

export function AccountProfileForm({
  profile,
  member,
}: AccountProfileFormProps) {
  return (
    <form action={updateAccountProfile} className="account-form surface">
      <div className="section-heading">
        <p className="eyebrow">Profile</p>
        <h2>完善成员资料</h2>
        <p>
          完善显示名、城市、技能与参与意愿，帮助社区在活动组织、成员连接与合作交流中更好地认识你。
        </p>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>显示名</span>
          <input
            className="input"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="比如：张三"
          />
        </label>

        <label className="form-field">
          <span>城市</span>
          <input
            className="input"
            name="city"
            defaultValue={profile?.city ?? "常州"}
            placeholder="常州"
          />
        </label>

        <label className="form-field">
          <span>身份 / 角色</span>
          <input
            className="input"
            name="role_label"
            defaultValue={profile?.role_label ?? ""}
            placeholder="例如：开发者 / 产品经理 / 创业者 / 学生"
          />
        </label>

        <label className="form-field">
          <span>公司 / 学校 / 团队</span>
          <input
            className="input"
            name="organization"
            defaultValue={profile?.organization ?? ""}
            placeholder="例如：SenseLeap.ai / 常州大学 / 独立开发"
          />
        </label>

        <label className="form-field form-field-wide">
          <span>技能标签</span>
          <input
            className="input"
            name="skills"
            defaultValue={profile?.skills?.join("，") ?? ""}
            placeholder="例如：Agent，RAG，前端工程，自动化工作流"
          />
        </label>

        <label className="form-field form-field-wide">
          <span>个人简介</span>
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
            name="willing_to_share"
            defaultChecked={member?.willing_to_share ?? false}
          />
          <span>我愿意在社区活动里做主题分享</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="willing_to_join_projects"
            defaultChecked={member?.willing_to_join_projects ?? false}
          />
          <span>如有合适的合作机会，我愿意参与协作</span>
        </label>
      </div>

      <div className="cta-row">
        <AccountProfileSubmitButton />
      </div>
    </form>
  );
}
