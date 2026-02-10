-- Users handled by Supabase auth

-- ---------------------------------------------------------------------------
-- Profiles / Opt-in (Global Leaderboard)
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  opt_in_global boolean not null default true,
  onboarding_11x11_prompt_dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Automatically create a profile row when a new auth user signs up.
-- (You still need RLS policies on profiles for reads/updates.)
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
      new.email,
      ''
    ),
    true
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Track daily practice logs per user (used for Daily Streak mode + sync).
create table if not exists daily_practice_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- Cached leaderboard rows (updated by the client; enforce via RLS).
create table if not exists leaderboard_daily (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  opt_in_global boolean not null default true,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 11x11 Challenge Tables (cohort by start_date for fair comparison)
-- ---------------------------------------------------------------------------

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  start_date date not null,
  end_date date not null,
  target_per_day int not null default 11,
  timezone text not null,
  created_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  log_date date not null,
  count int not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (challenge_id, log_date)
);

create table if not exists leaderboard_11x11 (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_start_date date not null,
  display_name text not null default '',
  completed_days int not null default 0,
  current_streak int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_start_date)
);

-- ---------------------------------------------------------------------------
-- Leaderboard RPCs (server-truth aggregation)
-- ---------------------------------------------------------------------------

-- Aggregates 11×11 leaderboard directly from challenges + daily_logs so the UI
-- doesn't depend on client-maintained snapshot rows.
create or replace function public.get_11x11_leaderboard(cohort_start date, lim int default 50)
returns table (
  display_name text,
  completed_days int,
  current_streak int,
  updated_at timestamptz,
  challenge_start_date date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with cohort as (
    select ch.id as challenge_id, ch.user_id, ch.start_date, ch.end_date
    from public.challenges ch
    join public.profiles p on p.user_id = ch.user_id
    where ch.start_date = cohort_start
      and p.opt_in_global = true
  ),
  days as (
    select
      c.user_id,
      c.challenge_id,
      gs::date as day,
      coalesce(dl.completed, false) as completed,
      dl.updated_at as log_updated_at,
      least(current_date, c.end_date) as end_day
    from cohort c
    cross join generate_series(c.start_date, least(current_date, c.end_date), interval '1 day') gs
    left join public.daily_logs dl
      on dl.challenge_id = c.challenge_id
     and dl.log_date = gs::date
  ),
  agg as (
    select
      d.user_id,
      max(d.end_day) as end_day,
      sum(case when d.completed then 1 else 0 end)::int as completed_days,
      max(d.log_updated_at) as updated_at,
      max(case when d.completed = false then d.day else null end) as last_miss
    from days d
    group by d.user_id
  ),
  streaks as (
    select
      a.user_id,
      a.completed_days,
      (case
        when a.last_miss is null then (a.end_day - cohort_start + 1)
        else greatest(0, (a.end_day - a.last_miss))
      end)::int as current_streak,
      coalesce(a.updated_at, now()) as updated_at
    from agg a
  )
  select
    p.display_name,
    s.completed_days,
    s.current_streak,
    s.updated_at,
    cohort_start as challenge_start_date
  from streaks s
  join public.profiles p on p.user_id = s.user_id
  order by s.completed_days desc, s.current_streak desc, s.updated_at desc
  limit lim;
end;
$$;

grant execute on function public.get_11x11_leaderboard(date, int) to anon, authenticated;

-- Global Daily leaderboard from server-truth (daily_practice_logs).
-- Uses profiles.opt_in_global=true for eligibility.
create or replace function public.get_daily_leaderboard(lim int default 50)
returns table (
  display_name text,
  current_streak int,
  longest_streak int,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  return query
  with eligible as (
    select p.user_id, p.display_name
    from public.profiles p
    where p.opt_in_global = true
  ),
  done_days as (
    -- One row per completed day (count>=1) per user.
    select
      d.user_id,
      d.log_date,
      max(d.updated_at) as updated_at
    from public.daily_practice_logs d
    join eligible e on e.user_id = d.user_id
    where d.count >= 1
      and d.log_date >= (current_date - interval '365 days')
    group by d.user_id, d.log_date
  ),
  series as (
    select
      e.user_id,
      e.display_name,
      gs.day::date as day
    from eligible e
    cross join generate_series(current_date - interval '365 days', current_date, interval '1 day') gs(day)
  ),
  marked as (
    select
      s.user_id,
      s.display_name,
      s.day,
      (dd.log_date is not null) as done,
      dd.updated_at as day_updated_at
    from series s
    left join done_days dd
      on dd.user_id = s.user_id
     and dd.log_date = s.day
  ),
  per_user_updated as (
    select
      m.user_id,
      max(m.day_updated_at) as updated_at
    from marked m
    group by m.user_id
  ),
  marked_desc as (
    select
      m.*,
      sum(case when m.done then 0 else 1 end) over (
        partition by m.user_id
        order by m.day desc
        rows between unbounded preceding and current row
      ) as misses_so_far
    from marked m
  ),
  current_streaks as (
    select
      md.user_id,
      count(*) filter (where md.misses_so_far = 0 and md.done) as current_streak
    from marked_desc md
    group by md.user_id
  ),
  done_only as (
    select
      m.user_id,
      m.day,
      (m.day - (row_number() over (partition by m.user_id order by m.day))::int) as grp
    from marked m
    where m.done = true
  ),
  longest_streaks as (
    select
      d.user_id,
      max(cnt)::int as longest_streak
    from (
      select user_id, grp, count(*)::int as cnt
      from done_only
      group by user_id, grp
    ) d
    group by d.user_id
  )
  select
    e.display_name,
    coalesce(cs.current_streak, 0)::int as current_streak,
    coalesce(ls.longest_streak, 0)::int as longest_streak,
    coalesce(u.updated_at, now()) as updated_at
  from eligible e
  left join current_streaks cs on cs.user_id = e.user_id
  left join longest_streaks ls on ls.user_id = e.user_id
  left join per_user_updated u on u.user_id = e.user_id
  order by current_streak desc, longest_streak desc, updated_at desc
  limit lim;
end;
$fn$;

grant execute on function public.get_daily_leaderboard(int) to anon, authenticated;

-- Optional Phase 2: groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Notes: add RLS policies in Supabase dashboard

-- ---------------------------------------------------------------------------
-- RLS (Minimum Viable)
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table daily_practice_logs enable row level security;
alter table leaderboard_daily enable row level security;
alter table challenges enable row level security;
alter table daily_logs enable row level security;
alter table leaderboard_11x11 enable row level security;

-- profiles
create policy "profiles_read_public" on profiles for select
  using (true);
create policy "profiles_upsert_own" on profiles for insert
  with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_practice_logs
create policy "daily_practice_read_own" on daily_practice_logs for select
  using (auth.uid() = user_id);
create policy "daily_practice_upsert_own" on daily_practice_logs for insert
  with check (auth.uid() = user_id);
create policy "daily_practice_update_own" on daily_practice_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- leaderboard_daily
create policy "leaderboard_daily_read_optin" on leaderboard_daily for select
  using (opt_in_global = true);
create policy "leaderboard_daily_upsert_own" on leaderboard_daily for insert
  with check (auth.uid() = user_id);
create policy "leaderboard_daily_update_own" on leaderboard_daily for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- challenges (11x11)
create policy "challenges_read_own" on challenges for select
  using (auth.uid() = user_id);
create policy "challenges_upsert_own" on challenges for insert
  with check (auth.uid() = user_id);
create policy "challenges_update_own" on challenges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_logs (11x11)
create policy "daily_logs_read_own" on daily_logs for select
  using (
    exists (
      select 1 from challenges c
      where c.id = daily_logs.challenge_id
        and c.user_id = auth.uid()
    )
  );
create policy "daily_logs_upsert_own" on daily_logs for insert
  with check (
    exists (
      select 1 from challenges c
      where c.id = daily_logs.challenge_id
        and c.user_id = auth.uid()
    )
  );
create policy "daily_logs_update_own" on daily_logs for update
  using (
    exists (
      select 1 from challenges c
      where c.id = daily_logs.challenge_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from challenges c
      where c.id = daily_logs.challenge_id
        and c.user_id = auth.uid()
    )
  );

-- leaderboard_11x11 (cohort by start_date)
create policy "leaderboard_11x11_read_same_cohort" on leaderboard_11x11 for select
  using (true);
create policy "leaderboard_11x11_upsert_own" on leaderboard_11x11 for insert
  with check (auth.uid() = user_id);
create policy "leaderboard_11x11_update_own" on leaderboard_11x11 for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
