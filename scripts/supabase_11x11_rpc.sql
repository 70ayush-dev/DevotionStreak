-- 11×11 server-truth leaderboard RPC
-- Run this in Supabase SQL editor OR via psql.

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
as $fn$
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
$fn$;

grant execute on function public.get_11x11_leaderboard(date, int) to anon, authenticated;

