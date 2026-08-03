insert into public.community_space_resources (
  code, name, resource_type, desk_mode, capacity, area_label,
  x_percent, y_percent, width_percent, height_percent,
  rotation_degrees, status, sort_order
)
values
  (
    'O01', '独立办公室工位 1', 'desk', 'flexible', 1, '独立办公室 1',
    54, 8.4, 8, 4.3,
    0, 'active', 301
  ),
  (
    'O02', '独立办公室工位 2', 'desk', 'flexible', 1, '独立办公室 2',
    76, 8.4, 8, 4.3,
    0, 'active', 302
  )
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

with focused_office_layout as (
  select
    focused_desk_number,
    36.5 + floor((focused_desk_number - 1) / 3.0) * 7.4 as y_percent
  from generate_series(1, 6) as focused_desks(focused_desk_number)
)
update public.community_space_resources as resource
set
  y_percent = focused_office_layout.y_percent,
  updated_at = timezone('utc', now())
from focused_office_layout
where resource.code = 'F' || lpad(focused_office_layout.focused_desk_number::text, 2, '0');

update public.community_space_resources
set
  x_percent = 8,
  updated_at = timezone('utc', now())
where code = 'MR-02';
