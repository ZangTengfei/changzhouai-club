import { deleteAdminEvent, saveAdminEvent } from "@/app/admin/actions";
import { StorageImageUrlField } from "@/components/storage-image-url-field";

type AdminEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  status: string;
};

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function AdminEventForm({
  event,
}: {
  event?: AdminEvent;
}) {
  const isEditing = Boolean(event);

  return (
    <article className="surface admin-card">
      <div className="section-heading">
        <p className="eyebrow">{isEditing ? "Edit Event" : "New Event"}</p>
        <h2>{isEditing ? `编辑：${event?.title}` : "新建活动"}</h2>
        <p>
          这里维护的是数据库里的正式活动数据。只要状态是 `scheduled`，活动页就会自动显示报名入口。
        </p>
      </div>

      <form action={saveAdminEvent} className="account-form">
        {isEditing ? <input type="hidden" name="event_id" value={event?.id} /> : null}

        <div className="form-grid">
          <label className="form-field">
            <span>活动标题</span>
            <input
              className="input"
              name="title"
              defaultValue={event?.title ?? ""}
              placeholder="例如：第 7 场线下交流"
              required
            />
          </label>

          <label className="form-field">
            <span>活动 slug</span>
            <input
              className="input"
              name="slug"
              defaultValue={event?.slug ?? ""}
              placeholder="例如：event-07-20260405"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>活动简介</span>
            <input
              className="input"
              name="summary"
              defaultValue={event?.summary ?? ""}
              placeholder="一句话说明这场活动的主题和形式"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>详细说明</span>
            <textarea
              className="input textarea"
              name="description"
              defaultValue={event?.description ?? ""}
              rows={4}
              placeholder="可选：写更详细的活动内容、议题安排和适合人群。"
            />
          </label>

          <label className="form-field">
            <span>活动时间</span>
            <input
              className="input"
              type="datetime-local"
              name="event_at"
              defaultValue={toDatetimeLocal(event?.event_at ?? null)}
            />
          </label>

          <label className="form-field">
            <span>活动状态</span>
            <select className="input" name="status" defaultValue={event?.status ?? "draft"}>
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="form-field">
            <span>地点</span>
            <input
              className="input"
              name="venue"
              defaultValue={event?.venue ?? ""}
              placeholder="例如：常州某咖啡馆 / 共享空间"
            />
          </label>

          <label className="form-field">
            <span>城市</span>
            <input
              className="input"
              name="city"
              defaultValue={event?.city ?? "常州"}
              placeholder="常州"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>封面图路径</span>
            <StorageImageUrlField
              name="cover_image_url"
              defaultValue={event?.cover_image_url ?? ""}
              eventSlug={event?.slug ?? ""}
              placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
              uploadLabel="上传封面"
            />
          </label>
        </div>

        <div className="cta-row">
          <button type="submit" className="button">
            {isEditing ? "保存活动" : "创建活动"}
          </button>
        </div>
      </form>

      {isEditing ? (
        <form action={deleteAdminEvent} className="admin-delete-form">
          <input type="hidden" name="event_id" value={event?.id} />
          <button type="submit" className="button button-secondary">
            删除这场活动
          </button>
        </form>
      ) : null}
    </article>
  );
}
