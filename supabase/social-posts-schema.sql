-- =====================================================================
-- Dhoom Vivekananda Samiti — SOCIAL MEDIA POST LOG (level 3 auto-posting)
--
-- One row per attempt to post an event / announcement to the Facebook Page
-- or Instagram. Written only by the social-post Edge Function (server key);
-- the main admin can read it in the dashboard.
-- RUN AFTER roles-and-approvals.sql. Safe to re-run.
-- =====================================================================

create table if not exists public.social_posts (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('event', 'notice')),
  item_id    uuid not null,
  target     text not null check (target in ('facebook', 'instagram')),
  status     text not null check (status in ('posted', 'failed')),
  remote_id  text,
  error      text check (error is null or char_length(error) <= 500),
  posted_by  uuid,
  created_at timestamptz not null default now()
);
create index if not exists social_posts_item_idx on public.social_posts (kind, item_id, target, status);

alter table public.social_posts enable row level security;

drop policy if exists "social_posts main admin read" on public.social_posts;
create policy "social_posts main admin read" on public.social_posts
  for select to authenticated
  using (public.is_temple_admin());

-- No insert / update / delete from the website: only the Edge Function (service role) writes.
revoke insert, update, delete on public.social_posts from anon, authenticated;
