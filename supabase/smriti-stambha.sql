-- =====================================================================
-- Smriti Stambha (স্মৃতিস্তম্ভ): the people who gave their time and
-- dedication to build the Samiti. Shown on the website page /smriti-stambha.
-- Run once in Supabase → SQL Editor, AFTER roles-and-approvals.sql.
-- Safe to run again.
-- =====================================================================

create table if not exists public.smriti_stambha (
  id           uuid primary key default gen_random_uuid(),
  name_en      text not null check (char_length(trim(name_en)) between 2 and 120),
  name_bn      text check (name_bn is null or char_length(name_bn) <= 120),
  role_en      text check (role_en is null or char_length(role_en) <= 120),   -- e.g. Founder President
  role_bn      text check (role_bn is null or char_length(role_bn) <= 120),
  years        text check (years is null or char_length(years) <= 40),        -- e.g. 1985 – 2012
  tribute_en   text check (tribute_en is null or char_length(tribute_en) <= 800),
  tribute_bn   text check (tribute_bn is null or char_length(tribute_bn) <= 800),
  photo_url    text check (photo_url is null or char_length(photo_url) <= 500),
  is_late      boolean not null default false,                                 -- shows "Late / প্রয়াত"
  sort_order   integer not null default 100,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.smriti_stambha enable row level security;

-- Everyone sees published names; the main admin also sees hidden ones
drop policy if exists "smriti_stambha public read" on public.smriti_stambha;
create policy "smriti_stambha public read" on public.smriti_stambha
  for select using (is_published or public.is_temple_admin());

-- Secretary (and accounts admin) may read drafts to prepare a request
drop policy if exists "smriti_stambha staff read" on public.smriti_stambha;
create policy "smriti_stambha staff read" on public.smriti_stambha
  for select to authenticated using (public.is_staff());

-- Only the main admin writes directly; the secretary's changes go through Approvals
drop policy if exists "smriti_stambha admin write" on public.smriti_stambha;
create policy "smriti_stambha admin write" on public.smriti_stambha
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- Secretary requests for this table are approved by the main admin
create or replace function public.change_approver(p_table text)
returns text language sql immutable as $$
  select case
    when p_table in ('events', 'gallery', 'announcements', 'worship_schedule',
                     'temple_highlights', 'temple_content', 'committee_contacts',
                     'site_settings', 'event_catalog', 'smriti_stambha')
      then 'admin'
    when p_table in ('donations', 'subscriptions', 'subscription_payments',
                     'income_entries', 'expense_entries', 'account_heads')
      then 'accounts_admin'
    else null
  end;
$$;

-- Five sample names (replace or delete them from Admin → Smriti Stambha).
-- Their ids start with 5a3b1e00 so they are easy to find and remove.
insert into public.smriti_stambha (id, name_en, name_bn, role_en, role_bn, years, tribute_en, tribute_bn, is_late, sort_order) values
  ('5a3b1e00-0000-4000-8000-000000000001', 'Sri Haripada Chowdhury', 'শ্রী হরিপদ চৌধুরী', 'Founder President', 'প্রতিষ্ঠাতা সভাপতি', '1985 – 2004',
   'Gave the first land and gathered the villagers to start daily worship. (Sample entry)', 'প্রথম জমি দান করে গ্রামবাসীদের নিয়ে নিত্যপূজা শুরু করেন। (নমুনা)', true, 10),
  ('5a3b1e00-0000-4000-8000-000000000002', 'Smt. Sabitri Devi', 'শ্রীমতী সাবিত্রী দেবী', 'Founder Member', 'প্রতিষ্ঠাতা সদস্য', '1985 – 2010',
   'Looked after the bhog kitchen and the women''s prayer circle for twenty-five years. (Sample entry)', 'পঁচিশ বছর ভোগঘর আর মহিলাদের প্রার্থনাসভা দেখাশোনা করেছেন। (নমুনা)', true, 20),
  ('5a3b1e00-0000-4000-8000-000000000003', 'Sri Gopal Chandra Nath', 'শ্রী গোপাল চন্দ্র নাথ', 'First Secretary', 'প্রথম সম্পাদক', '1987 – 2015',
   'Kept the first accounts book and built the Durga Mandir with volunteers. (Sample entry)', 'প্রথম হিসাবের খাতা রাখেন এবং স্বেচ্ছাসেবকদের নিয়ে দুর্গা মন্দির গড়ে তোলেন। (নমুনা)', true, 30),
  ('5a3b1e00-0000-4000-8000-000000000004', 'Dr. Ashok Kumar Das', 'ডা. অশোক কুমার দাশ', 'Founder, Community Clinic', 'কমিউনিটি ক্লিনিকের প্রতিষ্ঠাতা', '1995 – present',
   'Started the free clinic and still sees patients every Sunday. (Sample entry)', 'বিনামূল্যের ক্লিনিক শুরু করেন, এখনও প্রতি রবিবার রোগী দেখেন। (নমুনা)', false, 40),
  ('5a3b1e00-0000-4000-8000-000000000005', 'Sri Nitai Mitra', 'শ্রী নিতাই মিত্র', 'Gita Teacher', 'গীতা শিক্ষক', '2001 – present',
   'Teaches the Gita to the children of the village every Friday evening. (Sample entry)', 'প্রতি শুক্রবার সন্ধ্যায় গ্রামের শিশুদের গীতা শেখান। (নমুনা)', false, 50)
on conflict (id) do nothing;
