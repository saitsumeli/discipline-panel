-- Discipline Panel production-safe Supabase setup
-- Safe to run multiple times. Avoids destructive schema changes.

create extension if not exists pgcrypto;

-- 1) Profiles hardening ------------------------------------------------------

alter table if exists public.profiles
  add column if not exists display_name text,
  add column if not exists is_active boolean default true,
  add column if not exists joined_at timestamptz default timezone('utc', now()),
  add column if not exists bio text,
  add column if not exists status_line text,
  add column if not exists shareable_habit_count integer default 0,
  add column if not exists active_series_count integer default 0;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'username'
  ) and not exists (
    select 1
    from (
      select lower(username) as normalized_username
      from public.profiles
      where username is not null and btrim(username) <> ''
      group by lower(username)
      having count(*) > 1
    ) duplicates
  ) then
    create unique index if not exists profiles_username_lower_unique_idx
      on public.profiles (lower(username));
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'email'
  ) and not exists (
    select 1
    from (
      select lower(email) as normalized_email
      from public.profiles
      where email is not null and btrim(email) <> ''
      group by lower(email)
      having count(*) > 1
    ) duplicates
  ) then
    create unique index if not exists profiles_email_lower_unique_idx
      on public.profiles (lower(email));
  end if;
end
$$;

drop function if exists public.resolve_login_identifier(text);
drop function if exists public.list_discoverable_profiles();

create function public.resolve_login_identifier(input_identifier text)
returns table (
  user_id uuid,
  email text,
  username text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.email,
    p.username,
    p.display_name
  from public.profiles p
  where lower(coalesce(p.email, '')) = lower(trim(input_identifier))
     or lower(coalesce(p.username, '')) = lower(trim(input_identifier))
  order by
    case
      when lower(coalesce(p.email, '')) = lower(trim(input_identifier)) then 0
      else 1
    end,
    p.created_at asc nulls last
  limit 1;
$$;

grant execute on function public.resolve_login_identifier(text) to anon, authenticated;

create function public.list_discoverable_profiles()
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  joined_at timestamptz,
  bio text,
  status_line text,
  shareable_habit_count integer,
  active_series_count integer
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.username,
    p.display_name,
    coalesce(p.is_active, true) as is_active,
    p.created_at,
    p.joined_at,
    p.bio,
    p.status_line,
    coalesce(p.shareable_habit_count, 0) as shareable_habit_count,
    coalesce(p.active_series_count, 0) as active_series_count
  from public.profiles p
  where coalesce(p.is_active, true) = true
  order by coalesce(p.display_name, p.username, p.email);
$$;

grant execute on function public.list_discoverable_profiles() to authenticated;

-- 2) Partnerships delete policy ---------------------------------------------

alter table if exists public.partnerships enable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'partnerships'
  ) and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'partnerships'
      and policyname = 'partnerships_involved_delete'
  ) then
    create policy partnerships_involved_delete
      on public.partnerships
      for delete
      using (auth.uid() = first_user_id or auth.uid() = second_user_id);
  end if;
end
$$;

-- 3) Weight persistence ------------------------------------------------------

create table if not exists public.weight_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  start_weight numeric(5, 1) not null check (start_weight > 0),
  current_weight numeric(5, 1) not null check (current_weight > 0),
  target_weight numeric(5, 1) not null check (target_weight > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  value numeric(5, 1) not null check (value > 0),
  recorded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.weight_entries
  add column if not exists value numeric(5, 1),
  add column if not exists weight_value numeric(5, 1),
  add column if not exists recorded_at timestamptz default timezone('utc', now()),
  add column if not exists created_at timestamptz default timezone('utc', now());

update public.weight_entries
set value = weight_value
where value is null
  and weight_value is not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'weight_entries'
      and column_name = 'weight_value'
  ) then
    alter table public.weight_entries alter column weight_value drop not null;
  end if;
end
$$;

create index if not exists weight_entries_user_recorded_at_idx
  on public.weight_entries (user_id, recorded_at desc);

alter table public.weight_profiles enable row level security;
alter table public.weight_entries enable row level security;

create or replace function public.set_weight_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_weight_profile_updated_at on public.weight_profiles;

create trigger set_weight_profile_updated_at
before update on public.weight_profiles
for each row
execute function public.set_weight_profile_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_profiles'
      and policyname = 'weight_profiles_select_own'
  ) then
    create policy weight_profiles_select_own
      on public.weight_profiles
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_profiles'
      and policyname = 'weight_profiles_insert_own'
  ) then
    create policy weight_profiles_insert_own
      on public.weight_profiles
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_profiles'
      and policyname = 'weight_profiles_update_own'
  ) then
    create policy weight_profiles_update_own
      on public.weight_profiles
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_profiles'
      and policyname = 'weight_profiles_delete_own'
  ) then
    create policy weight_profiles_delete_own
      on public.weight_profiles
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_entries'
      and policyname = 'weight_entries_select_own'
  ) then
    create policy weight_entries_select_own
      on public.weight_entries
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_entries'
      and policyname = 'weight_entries_insert_own'
  ) then
    create policy weight_entries_insert_own
      on public.weight_entries
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_entries'
      and policyname = 'weight_entries_delete_own'
  ) then
    create policy weight_entries_delete_own
      on public.weight_entries
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;
