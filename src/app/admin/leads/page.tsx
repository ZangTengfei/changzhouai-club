import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "合作线索",
  description: "查看和管理合作需求线索。",
};

export default function AdminLeadsPage() {
  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Leads</p>
            <h2>合作线索</h2>
            <p>这里后面会承接企业需求、联系记录、负责人分配和跟进状态，适合做成轻量 CRM。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>CRM</strong>
              <span>预留模块</span>
            </div>
          </div>
        </div>

        <div className="note-strip">
          先把入口和版式留好，等你开始系统化承接外部需求时，再把这部分补成正式管理页。
        </div>
      </section>
    </div>
  );
}
