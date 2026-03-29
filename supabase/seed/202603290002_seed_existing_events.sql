insert into public.events (
  slug,
  title,
  summary,
  event_at,
  city,
  cover_image_url,
  status
)
values
  (
    'event-01-20260124',
    '第 1 场线下交流',
    '社区启动后的第一次线下见面，重点是认识彼此、交换近况。',
    '2026-01-24 14:00:00+08',
    '常州',
    '/events/event-01-20260124.jpg',
    'completed'
  ),
  (
    'event-02-20260208',
    '第 2 场线下交流',
    '延续开放交流氛围，开始出现更多围绕 AI 工具和应用方向的讨论。',
    '2026-02-08 14:00:00+08',
    '常州',
    '/events/event-02-20260208.jpg',
    'completed'
  ),
  (
    'event-03-20260308',
    '第 3 场线下交流',
    '活动节奏逐步稳定，也开始出现成员自发带来的主题交流。',
    '2026-03-08 14:00:00+08',
    '常州',
    '/events/event-03-20260308.jpg',
    'completed'
  ),
  (
    'event-04-20260314',
    '第 4 场线下交流',
    '交流更偏实践和工具视角，大家开始讨论具体产品想法和技术路线。',
    '2026-03-14 14:00:00+08',
    '常州',
    '/events/event-04-20260314.jpeg',
    'completed'
  ),
  (
    'event-05-20260321',
    '第 5 场线下交流',
    '开始出现社区成员分享自研中的项目与想法。',
    '2026-03-21 14:00:00+08',
    '常州',
    '/events/event-05-20260321.jpeg',
    'completed'
  ),
  (
    'event-06-20260328',
    '第 6 场线下交流',
    '最近一次活动继续延续高频节奏，也为后续官网和更系统的运营打下基础。',
    '2026-03-28 14:00:00+08',
    '常州',
    '/events/event-06-20260328.jpg',
    'completed'
  )
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  event_at = excluded.event_at,
  city = excluded.city,
  cover_image_url = excluded.cover_image_url,
  status = excluded.status,
  updated_at = timezone('utc', now());
