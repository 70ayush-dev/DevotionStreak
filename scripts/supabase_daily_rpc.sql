-- Global Daily leaderboard (server-truth)
-- Run this in Supabase SQL editor OR via psql.

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

