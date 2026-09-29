-- Run this entire script in Supabase > SQL Editor.
create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('loadout','setting','feature')),
  title text not null,
  category text,
  code text,
  description text,
  data jsonb not null default '{}'::jsonb,
  media_url text,
  media_type text check (media_type is null or media_type in ('image','video')),
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.content enable row level security;
-- Public can read published content only.
drop policy if exists "Public read published content" on public.content;
create policy "Public read published content" on public.content for select using (published = true);
-- Only authenticated users with an admin profile can add/change/delete.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "Admins can read own admin row" on public.admins;
create policy "Admins can read own admin row" on public.admins for select to authenticated using (user_id = auth.uid());
create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;
drop policy if exists "Admins insert content" on public.content;
create policy "Admins insert content" on public.content for insert to authenticated with check (public.is_site_admin());
drop policy if exists "Admins update content" on public.content;
create policy "Admins update content" on public.content for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "Admins delete content" on public.content;
create policy "Admins delete content" on public.content for delete to authenticated using (public.is_site_admin());
-- SETUP: create an auth user in Supabase Authentication > Users, then copy that user's UUID.
-- Replace the UUID below, uncomment, and run:
-- insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
