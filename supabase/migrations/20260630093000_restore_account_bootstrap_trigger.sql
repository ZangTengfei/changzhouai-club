create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.members (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, display_name, avatar_url, created_at, updated_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
  users.raw_user_meta_data ->> 'avatar_url',
  coalesce(users.created_at, timezone('utc', now())),
  timezone('utc', now())
from auth.users
left join public.profiles on profiles.id = users.id
where profiles.id is null;

insert into public.members (id, joined_at, created_at, updated_at)
select
  profiles.id,
  coalesce(users.created_at, timezone('utc', now())),
  coalesce(users.created_at, timezone('utc', now())),
  timezone('utc', now())
from auth.users
inner join public.profiles on profiles.id = users.id
left join public.members on members.id = users.id
where members.id is null;
