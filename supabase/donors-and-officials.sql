-- =====================================================================
-- 1. Honoured donors (দাতা সম্মাননা): the Samiti's major donors, shown at /donors
--    with photo, name, address, amount and date. A separate list from
--    Admin → Donations: the admin adds a donor here only with their consent,
--    and can hide the amount or the address of each donor.
-- 2. Samiti officials (সমিতির কর্মকর্তা): the current (and earlier) committee,
--    shown at /committee with photo, position and term.
-- Run once in Supabase → SQL Editor. Works with or without roles-and-approvals.sql.
-- Safe to run again. No sample data is added.
-- =====================================================================

-- ---------- 1. Honoured donors ----------
create table if not exists public.donor_honours (
  id            uuid primary key default gen_random_uuid(),
  name_en       text not null check (char_length(trim(name_en)) between 2 and 150),
  name_bn       text check (name_bn is null or char_length(name_bn) <= 150),
  address_en    text check (address_en is null or char_length(address_en) <= 300),
  address_bn    text check (address_bn is null or char_length(address_bn) <= 300),
  amount        numeric(14, 2) check (amount is null or amount > 0),
  currency      text not null default 'BDT' check (currency in ('BDT', 'USD')),
  gift_en       text check (gift_en is null or char_length(gift_en) <= 200),   -- e.g. Land for the Durga Mandir (for gifts other than money)
  gift_bn       text check (gift_bn is null or char_length(gift_bn) <= 200),
  purpose_en    text check (purpose_en is null or char_length(purpose_en) <= 300),  -- what the donation was for
  purpose_bn    text check (purpose_bn is null or char_length(purpose_bn) <= 300),
  donated_on    date,
  in_memory_of  text check (in_memory_of is null or char_length(in_memory_of) <= 150),
  photo_url     text check (photo_url is null or char_length(photo_url) <= 500),
  show_amount   boolean not null default true,
  show_address  boolean not null default true,
  consent       boolean not null default false,          -- the donor agreed to be shown on the website
  sort_order    integer not null default 100,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint donor_honours_amount_or_gift check (amount is not null or gift_en is not null or gift_bn is not null)
);
alter table public.donor_honours enable row level security;
-- The table itself: main admin only. The public reads the view below, which hides
-- the amount or address when the admin chose to, and shows only donors who agreed.
drop policy if exists "donor_honours admin all" on public.donor_honours;
create policy "donor_honours admin all" on public.donor_honours
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

create or replace view public.donor_honours_public as
  select id, name_en, name_bn,
         case when show_address then address_en end as address_en,
         case when show_address then address_bn end as address_bn,
         case when show_amount then amount end as amount,
         currency, gift_en, gift_bn, purpose_en, purpose_bn, donated_on, in_memory_of, photo_url, sort_order
  from public.donor_honours
  where is_published and consent;
revoke all on public.donor_honours_public from anon, authenticated;
grant select on public.donor_honours_public to anon, authenticated;

-- ---------- 2. Samiti officials ----------
create table if not exists public.samiti_officials (
  id            uuid primary key default gen_random_uuid(),
  name_en       text not null check (char_length(trim(name_en)) between 2 and 150),
  name_bn       text check (name_bn is null or char_length(name_bn) <= 150),
  position      text not null default 'member'
                check (position in ('patron', 'advisor', 'president', 'vice_president', 'general_secretary', 'joint_secretary',
                                    'assistant_secretary', 'organising_secretary', 'treasurer', 'office_secretary', 'cultural_secretary',
                                    'publicity_secretary', 'member', 'other')),
  role_en       text check (role_en is null or char_length(role_en) <= 120),   -- the title to show (filled from the position)
  role_bn       text check (role_bn is null or char_length(role_bn) <= 120),
  term          text check (term is null or char_length(term) <= 40),         -- e.g. 2025 – 2027
  is_current    boolean not null default true,                                 -- current committee, or an earlier one
  phone         text check (phone is null or char_length(phone) <= 30),        -- shown on the website: leave empty to keep private
  email         text check (email is null or char_length(email) <= 254),       -- shown on the website: leave empty to keep private
  about_en      text check (about_en is null or char_length(about_en) <= 600),
  about_bn      text check (about_bn is null or char_length(about_bn) <= 600),
  photo_url     text check (photo_url is null or char_length(photo_url) <= 500),
  sort_order    integer not null default 100,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table public.samiti_officials enable row level security;
drop policy if exists "samiti_officials public read" on public.samiti_officials;
create policy "samiti_officials public read" on public.samiti_officials
  for select using (is_published or public.is_temple_admin());
drop policy if exists "samiti_officials admin write" on public.samiti_officials;
create policy "samiti_officials admin write" on public.samiti_officials
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------- 3. Secretary (roles-and-approvals.sql) ----------
drop policy if exists "donor_honours staff read" on public.donor_honours;
drop policy if exists "samiti_officials staff read" on public.samiti_officials;
do $$
begin
  if to_regprocedure('public.is_staff()') is not null then
    create policy "donor_honours staff read" on public.donor_honours for select to authenticated using (public.is_staff());
    create policy "samiti_officials staff read" on public.samiti_officials for select to authenticated using (public.is_staff());
  end if;
end $$;

-- Same list as in roles-and-approvals.sql, smriti-stambha.sql and visits-and-bhavadhara.sql, plus the two new tables
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
