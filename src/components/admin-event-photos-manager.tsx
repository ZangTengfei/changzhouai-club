import {
  deleteAdminEventPhoto,
  saveAdminEventPhoto,
  setAdminEventCoverImage,
} from "@/app/admin/actions";
import { StorageImageUrlField } from "@/components/storage-image-url-field";

type EventPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export function AdminEventPhotosManager({
  eventId,
  eventSlug,
  eventTitle,
  coverImageUrl,
  photos,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  coverImageUrl: string | null;
  photos: EventPhoto[];
}) {
  return (
    <section className="surface admin-card">
      <div className="section-heading">
        <p className="eyebrow">Gallery</p>
        <h2>{eventTitle} 的照片管理</h2>
        <p>
          第一版先支持维护照片 URL、说明和排序。现在活动图片已经迁到 Supabase Storage，后续也建议统一使用 Storage 公网地址。
        </p>
      </div>

      <div className="admin-cover-panel">
        <div>
          <h3>当前封面</h3>
          <p>
            封面图会优先用于活动列表展示。你也可以直接把某张活动照片设成封面，减少重复维护。
          </p>
        </div>

        {coverImageUrl ? (
          <div className="admin-image-preview">
            <img src={coverImageUrl} alt={`${eventTitle} 封面`} loading="lazy" />
            <p className="admin-image-url">{coverImageUrl}</p>
          </div>
        ) : (
          <div className="note-strip">当前还没有设置封面图。</div>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="admin-photo-list">
          {photos.map((photo) => {
            const isCover = coverImageUrl === photo.image_url;

            return (
              <article className="admin-photo-card" key={photo.id}>
                <div className="admin-image-preview">
                  <img src={photo.image_url} alt={photo.caption ?? eventTitle} loading="lazy" />
                  <p className="admin-image-url">{photo.image_url}</p>
                </div>

                <div className="admin-photo-body">
                  <div className="pill-row admin-photo-meta">
                    <span className="pill">排序 {photo.sort_order}</span>
                    {isCover ? <span className="pill">当前封面</span> : null}
                  </div>

                  <form action={saveAdminEventPhoto} className="account-form admin-photo-form">
                    <input type="hidden" name="event_id" value={eventId} />
                    <input type="hidden" name="event_slug" value={eventSlug} />
                    <input type="hidden" name="photo_id" value={photo.id} />

                    <div className="form-grid admin-photo-form-grid">
                      <label className="form-field form-field-wide">
                        <span>图片路径</span>
                        <StorageImageUrlField
                          name="image_url"
                          defaultValue={photo.image_url}
                          eventSlug={eventSlug}
                          placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                          uploadLabel="替换图片"
                          required
                        />
                      </label>

                      <label className="form-field">
                        <span>排序</span>
                        <input
                          className="input"
                          type="number"
                          name="sort_order"
                          defaultValue={photo.sort_order}
                        />
                      </label>

                      <label className="form-field form-field-wide">
                        <span>图片说明</span>
                        <input
                          className="input"
                          name="caption"
                          defaultValue={photo.caption ?? ""}
                          placeholder="例如：现场自由交流 / 成员分享环节"
                        />
                      </label>
                    </div>

                    <div className="cta-row admin-photo-actions">
                      <button type="submit" className="button">
                        保存照片
                      </button>
                    </div>
                  </form>

                  <div className="cta-row admin-photo-actions">
                    {!isCover ? (
                      <form action={setAdminEventCoverImage}>
                        <input type="hidden" name="event_id" value={eventId} />
                        <input type="hidden" name="event_slug" value={eventSlug} />
                        <input type="hidden" name="image_url" value={photo.image_url} />
                        <button type="submit" className="button button-secondary">
                          设为封面
                        </button>
                      </form>
                    ) : null}

                    <form action={deleteAdminEventPhoto}>
                      <input type="hidden" name="event_id" value={eventId} />
                      <input type="hidden" name="event_slug" value={eventSlug} />
                      <input type="hidden" name="photo_id" value={photo.id} />
                      <button type="submit" className="button button-secondary">
                        删除照片
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="note-strip">
          这场活动还没有相册照片。可以先添加一张主照片，后面再慢慢补现场图。
        </div>
      )}

      <article className="admin-photo-create">
        <div className="section-heading">
          <p className="eyebrow">New Photo</p>
          <h3>新增活动照片</h3>
          <p>推荐先把图片上传到 Supabase Storage，再把公开 URL 贴到这里。</p>
        </div>

        <form action={saveAdminEventPhoto} className="account-form admin-photo-form">
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="event_slug" value={eventSlug} />

          <div className="form-grid admin-photo-form-grid">
            <label className="form-field form-field-wide">
              <span>图片路径</span>
              <StorageImageUrlField
                name="image_url"
                eventSlug={eventSlug}
                placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                uploadLabel="上传新图片"
                required
              />
            </label>

            <label className="form-field">
              <span>排序</span>
              <input className="input" type="number" name="sort_order" defaultValue={0} />
            </label>

            <label className="form-field form-field-wide">
              <span>图片说明</span>
              <input
                className="input"
                name="caption"
                placeholder="例如：开场自我介绍 / 圆桌讨论 / 合影"
              />
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button">
              添加照片
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
