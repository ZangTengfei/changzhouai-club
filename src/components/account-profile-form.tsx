import { updateAccountProfile } from "@/app/account/actions";

type AccountProfileFormProps = {
  profile: {
    display_name: string | null;
    city: string | null;
    bio: string | null;
    skills: string[] | null;
  } | null;
  member: {
    willing_to_share: boolean | null;
    willing_to_join_projects: boolean | null;
  } | null;
};

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
          先把最基础的显示名、城市、技能和参与意愿补齐，后面活动报名和成员匹配就能直接复用这些信息。
        </p>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>显示名</span>
          <input
            className="input"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="比如：张腾飞 / Nobug"
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
          <span>后续如果有合适项目，我愿意参与协作</span>
        </label>
      </div>

      <div className="cta-row">
        <button type="submit" className="button">
          保存资料
        </button>
      </div>
    </form>
  );
}
