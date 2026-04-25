create extension if not exists pgcrypto;

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
