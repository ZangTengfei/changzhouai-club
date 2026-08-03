alter table public.community_space_resources
  drop constraint if exists community_space_resources_status_check;

alter table public.community_space_resources
  add constraint community_space_resources_status_check
  check (status in ('active', 'disabled', 'retired'));

update public.community_space_resources
set
  status = 'retired',
  updated_at = timezone('utc', now())
where code = 'MR-01';

with desk_layout as (
  select
    desk_number,
    floor((desk_number - 1) / 6.0)::integer as group_index,
    mod(desk_number - 1, 6) as seat_index
  from generate_series(1, 24) as desks(desk_number)
)
update public.community_space_resources as resource
set
  area_label = '办公大厅 · ' || chr(65 + desk_layout.group_index) || ' 组联排桌',
  x_percent = 8 + mod(desk_layout.seat_index, 3) * 11.2,
  y_percent = 17 + desk_layout.group_index * 15 + floor(desk_layout.seat_index / 3.0) * 6.3,
  width_percent = 10.4,
  height_percent = 6,
  rotation_degrees = 0,
  updated_at = timezone('utc', now())
from desk_layout
where resource.code = 'D' || lpad(desk_layout.desk_number::text, 2, '0');

insert into public.community_space_resources (
  code, name, resource_type, desk_mode, capacity, area_label,
  x_percent, y_percent, width_percent, height_percent,
  rotation_degrees, status, sort_order
)
select
  'F' || lpad(fixed_desk_number::text, 2, '0'),
  '固定工位 ' || lpad(fixed_desk_number::text, 2, '0'),
  'desk',
  'fixed',
  1,
  '集中办公室',
  70.2 + mod(fixed_desk_number - 1, 3) * 7.1,
  52.5 + floor((fixed_desk_number - 1) / 3.0) * 7.4,
  6.4,
  5.8,
  0,
  'active',
  200 + fixed_desk_number
from generate_series(1, 6) as fixed_desks(fixed_desk_number)
on conflict (code) do update set
  name = excluded.name,
  resource_type = excluded.resource_type,
  desk_mode = excluded.desk_mode,
  capacity = excluded.capacity,
  area_label = excluded.area_label,
  x_percent = excluded.x_percent,
  y_percent = excluded.y_percent,
  width_percent = excluded.width_percent,
  height_percent = excluded.height_percent,
  rotation_degrees = excluded.rotation_degrees,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

update public.community_space_resources
set
  name = '会议室',
  area_label = '办公大厅南侧',
  x_percent = 10,
  y_percent = 79,
  width_percent = 34,
  height_percent = 14,
  rotation_degrees = 0,
  sort_order = 102,
  updated_at = timezone('utc', now())
where code = 'MR-02';
