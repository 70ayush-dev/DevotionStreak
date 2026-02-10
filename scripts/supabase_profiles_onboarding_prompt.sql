-- Adds a profile field to persist dismissing the 11×11 start prompt on Home.
-- Copy/paste into Supabase SQL Editor and run.

alter table public.profiles
  add column if not exists onboarding_11x11_prompt_dismissed_at timestamptz;

