-- Supabase SQL: profiles RLS + defaults + signup trigger
-- Copy/paste this whole file into Supabase SQL Editor and run.

-- Fix profiles RLS so the signed-in user can insert/update their own profile
alter table public.profiles enable row level security;

drop policy if exists profiles_read_public on public.profiles;
drop policy if exists profiles_upsert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_read_public on public.profiles for select using (true);
create policy profiles_upsert_own on public.profiles for insert with check (auth.uid() = user_id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Default opt-in ON
alter table public.profiles alter column opt_in_global set default true;

-- Auto-create profile on signup using Google name (or email prefix fallback)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, opt_in_global)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      ''
    ),
    true
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

