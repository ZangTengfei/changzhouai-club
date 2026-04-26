begin;

insert into public.events (
  slug,
  title,
  summary,
  description,
  event_at,
  city,
  cover_image_url,
  docs_url,
  status
)
values
  (
    'event-01-20260124',
    '第 1 场线下交流',
    '社区启动后的第一次线下见面，重点是认识彼此、交换近况，也让大家对这个社群的节奏有了更具体的感受。',
    '线下自由交流，启动期成员彼此认识，社区节奏开始形成。',
    '2026-01-24 14:00:00+08',
    '常州',
    'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-01-20260124.jpg',
    null,
    'completed'
  ),
  (
    'event-02-20260208',
    '第 2 场线下交流',
    '第二次线下活动延续了开放交流的氛围，开始有更多围绕 AI 工具、应用方向和个人实践的讨论。',
    '成员持续回流，AI 应用讨论逐步升温，社区氛围继续变强。',
    '2026-02-08 14:00:00+08',
    '常州',
    'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-02-20260208.jpg',
    null,
    'completed'
  ),
  (
    'event-03-20260308',
    '第 3 场线下交流',
    '进入 3 月后，活动开始更稳定地形成固定节奏，也逐步出现成员自发带来的主题和经验分享。',
    '固定节奏形成，主题交流开始出现，成员参与度继续提升。',
    '2026-03-08 14:00:00+08',
    '常州',
    'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-03-20260308.jpg',
    null,
    'completed'
  ),
  (
    'event-04-20260314',
    '第 4 场线下交流',
    '这一场的交流更偏向实践和工具视角，大家开始把具体的产品想法、技术路线和落地问题拿到线下讨论。',
    '讨论更偏实践导向，围绕工具、路线和落地问题展开。',
    '2026-03-14 14:00:00+08',
    '常州',
    'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-04-20260314.jpeg',
    null,
    'completed'
  ),
  (
    'event-05-20260321',
    '第 5 场线下交流',
    '开始出现社区成员分享自己正在研发中的项目与想法，活动不再只是交流，也开始承载轻量展示和反馈。',
    '成员自研分享开始出现，活动从交流走向轻量展示与反馈。',
    '2026-03-21 14:00:00+08',
    '常州',
    'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-05-20260321.jpeg',
    '/docs/events/2026-03-21-ai-salon',
    'completed'
  ),
  (
    'event-06-20260328',
    '第 6 场线下交流',
    '最近一次活动继续延续高频节奏，社区已经形成了稳定线下碰面的惯性，也为后续官网和更系统的运营打下了基础。',
    '高频活动节奏已经稳定，也为后续运营沉淀打下基础。',
    '2026-03-28 14:00:00+08',
    '常州',
    'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-06-20260328.jpg',
    null,
    'completed'
  )
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  description = excluded.description,
  event_at = excluded.event_at,
  city = excluded.city,
  cover_image_url = excluded.cover_image_url,
  docs_url = coalesce(excluded.docs_url, events.docs_url),
  status = excluded.status,
  updated_at = timezone('utc', now());

delete from public.event_photos
where event_id in (
  select id
  from public.events
  where slug in (
    'event-01-20260124',
    'event-02-20260208',
    'event-03-20260308',
    'event-04-20260314',
    'event-05-20260321',
    'event-06-20260328'
  )
);

insert into public.event_photos (
  event_id,
  image_url,
  caption,
  sort_order
)
select id, 'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-01-20260124.jpg', '第 1 场线下交流', 0
from public.events
where slug = 'event-01-20260124'
union all
select id, 'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-02-20260208.jpg', '第 2 场线下交流', 0
from public.events
where slug = 'event-02-20260208'
union all
select id, 'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-03-20260308.jpg', '第 3 场线下交流', 0
from public.events
where slug = 'event-03-20260308'
union all
select id, 'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-04-20260314.jpeg', '第 4 场线下交流', 0
from public.events
where slug = 'event-04-20260314'
union all
select id, 'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-05-20260321.jpeg', '第 5 场线下交流', 0
from public.events
where slug = 'event-05-20260321'
union all
select id, 'https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/events/historical/event-06-20260328.jpg', '第 6 场线下交流', 0
from public.events
where slug = 'event-06-20260328';

commit;
