-- =====================================================================
-- 1. Holy visits (পুণ্য আগমন): visits of senior monks of the Ramakrishna
--    Order to the Samiti and its institutions. Website page: /visits
-- 2. Memories of each visit, sent by disciples and devotees from the
--    website. They appear only after the main admin approves them.
-- 3. Ramakrishna-Vivekananda Bhavadhara organisations around the world.
--    Website page: /bhavadhara. Anyone can send an organisation from the
--    website; it appears only after approval. The admin can also add one.
-- 4. Contact details of the people who send a memory or an organisation:
--    kept in a separate table that only the admin can read.
-- Run once in Supabase → SQL Editor. Works with or without roles-and-approvals.sql.
-- Safe to run again.
-- =====================================================================

-- ---------- 1. Visits ----------
create table if not exists public.maharaj_visits (
  id             uuid primary key default gen_random_uuid(),
  monk_name_en   text not null check (char_length(trim(monk_name_en)) between 3 and 150),
  monk_name_bn   text check (monk_name_bn is null or char_length(monk_name_bn) <= 150),
  monk_title_en  text check (monk_title_en is null or char_length(monk_title_en) <= 200),  -- e.g. President, Ramakrishna Math and Ramakrishna Mission
  monk_title_bn  text check (monk_title_bn is null or char_length(monk_title_bn) <= 200),
  visit_date     date,                                                                  -- empty when the date is not known
  visit_date_end date check (visit_date_end is null or visit_date_end >= visit_date),
  occasion_en    text check (occasion_en is null or char_length(occasion_en) <= 200),     -- e.g. Consecration of the Durga Mandir
  occasion_bn    text check (occasion_bn is null or char_length(occasion_bn) <= 200),
  places         text[] not null default '{}'
                 check (places <@ array['dakshin-kalika','durga','clinic','shiv','ramakrishna','gourishankar']::text[]),
  summary_en     text check (summary_en is null or char_length(summary_en) <= 4000),
  summary_bn     text check (summary_bn is null or char_length(summary_bn) <= 4000),
  blessing_en    text check (blessing_en is null or char_length(blessing_en) <= 800),     -- words of blessing given during the visit
  blessing_bn    text check (blessing_bn is null or char_length(blessing_bn) <= 800),
  photo_url      text check (photo_url is null or char_length(photo_url) <= 500),
  photos         text[] not null default '{}' check (cardinality(photos) <= 24),
  sort_order     integer not null default 100,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now()
);
alter table public.maharaj_visits enable row level security;
drop policy if exists "maharaj_visits public read" on public.maharaj_visits;
create policy "maharaj_visits public read" on public.maharaj_visits
  for select using (is_published or public.is_temple_admin());
drop policy if exists "maharaj_visits admin write" on public.maharaj_visits;
create policy "maharaj_visits admin write" on public.maharaj_visits
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------- 2. Memories of a visit ----------
create table if not exists public.visit_memories (
  id           uuid primary key default gen_random_uuid(),
  visit_id     uuid not null references public.maharaj_visits(id) on delete cascade,
  author_name  text not null check (char_length(trim(author_name)) between 2 and 100),
  relation     text check (relation is null or char_length(relation) <= 100),    -- e.g. initiated disciple, devotee, volunteer
  place        text check (place is null or char_length(place) <= 100),          -- town / country of the writer
  memory       text not null check (char_length(trim(memory)) between 20 and 3000),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);
create index if not exists visit_memories_visit_idx on public.visit_memories (visit_id, status, created_at);
alter table public.visit_memories enable row level security;
-- Everyone reads approved memories; the admin reads all
drop policy if exists "visit_memories public read" on public.visit_memories;
create policy "visit_memories public read" on public.visit_memories
  for select using (status = 'approved' or public.is_temple_admin());
-- Anyone may send a memory, but only as "pending"
drop policy if exists "visit_memories public send" on public.visit_memories;
create policy "visit_memories public send" on public.visit_memories
  for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "visit_memories admin write" on public.visit_memories;
create policy "visit_memories admin write" on public.visit_memories
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------- 3. Bhavadhara organisations ----------
create table if not exists public.bhavadhara_orgs (
  id            uuid primary key default gen_random_uuid(),
  name_en       text not null check (char_length(trim(name_en)) between 3 and 200),
  name_bn       text check (name_bn is null or char_length(name_bn) <= 200),
  org_type      text not null default 'other'
                check (org_type in ('rkm_branch', 'vedanta_society', 'bhavaprachar', 'sarada_math', 'ashram', 'samiti', 'other')),
  country       text not null check (char_length(trim(country)) between 2 and 80),
  city          text check (city is null or char_length(city) <= 100),
  address       text check (address is null or char_length(address) <= 300),
  website       text check (website is null or (char_length(website) <= 300 and website ~* '^https?://')),
  email         text check (email is null or char_length(email) <= 254),
  phone         text check (phone is null or char_length(phone) <= 30),
  founded_year  integer check (founded_year is null or founded_year between 1850 and 2100),
  about_en      text check (about_en is null or char_length(about_en) <= 3000),
  about_bn      text check (about_bn is null or char_length(about_bn) <= 3000),
  photo_url     text check (photo_url is null or char_length(photo_url) <= 500),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  sort_order    integer not null default 100,
  created_at    timestamptz not null default now()
);
create index if not exists bhavadhara_orgs_status_idx on public.bhavadhara_orgs (status, country, name_en);
alter table public.bhavadhara_orgs enable row level security;
drop policy if exists "bhavadhara_orgs public read" on public.bhavadhara_orgs;
create policy "bhavadhara_orgs public read" on public.bhavadhara_orgs
  for select using (status = 'approved' or public.is_temple_admin());
drop policy if exists "bhavadhara_orgs public send" on public.bhavadhara_orgs;
create policy "bhavadhara_orgs public send" on public.bhavadhara_orgs
  for insert to anon, authenticated with check (status = 'pending' and photo_url is null);
drop policy if exists "bhavadhara_orgs admin write" on public.bhavadhara_orgs;
create policy "bhavadhara_orgs admin write" on public.bhavadhara_orgs
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------- 4. Private contact of the sender (admin only) ----------
create table if not exists public.submission_contacts (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('memory', 'bhavadhara')),
  ref_id      uuid not null,                        -- id of the memory or organisation
  name        text check (name is null or char_length(name) <= 100),
  email       text check (email is null or char_length(email) <= 254),
  phone       text check (phone is null or char_length(phone) <= 30),
  created_at  timestamptz not null default now()
);
alter table public.submission_contacts enable row level security;
drop policy if exists "submission_contacts public send" on public.submission_contacts;
create policy "submission_contacts public send" on public.submission_contacts
  for insert to anon, authenticated with check (true);
drop policy if exists "submission_contacts admin all" on public.submission_contacts;
create policy "submission_contacts admin all" on public.submission_contacts
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------- 5. Secretary (roles-and-approvals.sql) ----------
-- The secretary may read everything (also pending items) to prepare requests,
-- and the main admin approves the secretary's changes to these tables.
drop policy if exists "maharaj_visits staff read" on public.maharaj_visits;
drop policy if exists "visit_memories staff read" on public.visit_memories;
drop policy if exists "bhavadhara_orgs staff read" on public.bhavadhara_orgs;
drop policy if exists "submission_contacts staff read" on public.submission_contacts;
do $$
begin
  if to_regprocedure('public.is_staff()') is not null then
    create policy "maharaj_visits staff read" on public.maharaj_visits for select to authenticated using (public.is_staff());
    create policy "visit_memories staff read" on public.visit_memories for select to authenticated using (public.is_staff());
    create policy "bhavadhara_orgs staff read" on public.bhavadhara_orgs for select to authenticated using (public.is_staff());
    create policy "submission_contacts staff read" on public.submission_contacts for select to authenticated using (public.is_staff());
  end if;
end $$;

-- Same list as in roles-and-approvals.sql and smriti-stambha.sql, plus the three new tables
create or replace function public.change_approver(p_table text)
returns text language sql immutable as $$
  select case
    when p_table in ('events', 'gallery', 'announcements', 'worship_schedule',
                     'temple_highlights', 'temple_content', 'committee_contacts',
                     'site_settings', 'event_catalog', 'smriti_stambha',
                     'maharaj_visits', 'visit_memories', 'bhavadhara_orgs',
                     'donor_honours', 'samiti_officials')
      then 'admin'
    when p_table in ('donations', 'subscriptions', 'subscription_payments',
                     'income_entries', 'expense_entries', 'account_heads')
      then 'accounts_admin'
    else null
  end;
$$;
