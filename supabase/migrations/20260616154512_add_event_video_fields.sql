alter table public.events
  add column if not exists video_url text,
  add column if not exists video_provider text,
  add column if not exists video_file_id text,
  add column if not exists video_title text,
  add column if not exists video_cover_url text;

update public.events
set
  video_url = 'https://1440187301.vod-qcloud.com/82f61107vodtranscq1440187301/0efeec885001834806918842754/v.f100040.mp4',
  video_provider = 'tencent_vod',
  video_file_id = '5001834806918842754',
  video_title = 'AI + 外贸主题沙龙活动视频',
  status = 'completed'
where slug = '2026-06-16-ai-foreign-trade-salon';

notify pgrst, 'reload schema';
