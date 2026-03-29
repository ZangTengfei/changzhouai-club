import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "成员管理",
  description: "查看和管理社区成员。",
};

export default function AdminMembersPage() {
  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Members</p>
            <h2>成员管理</h2>
            <p>这里后面会承接成员资料、城市、技能标签、分享意愿和活动参与情况的管理。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>Coming Soon</strong>
              <span>下一阶段</span>
            </div>
          </div>
        </div>

        <div className="note-strip">
          这部分还在下一阶段。现在后台结构已经给成员管理预留了稳定入口，后面可以直接往这里继续扩。
        </div>
      </section>
    </div>
  );
}
