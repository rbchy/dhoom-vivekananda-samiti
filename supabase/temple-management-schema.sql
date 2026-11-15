-- =====================================================================
-- Temple management: worship schedule, event timings, temple info,
-- committee contacts, contact messages, other income and expenditure.
--
-- RUN AFTER donations-and-events-schema.sql (it creates is_temple_admin()).
-- Supabase Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Weekly / daily worship schedule (temple hours)
-- ---------------------------------------------------------------------
create table if not exists public.worship_schedule (
  id           uuid primary key default gen_random_uuid(),
  day_of_week  smallint check (day_of_week between 0 and 6),   -- 0 = Sunday … 6 = Saturday, NULL = every day
  title_en     text not null check (char_length(trim(title_en)) between 2 and 120),
  title_bn     text check (title_bn is null or char_length(title_bn) <= 120),
  is_closed    boolean not null default false,
  start_time   time,
  end_time     time,
  note_en      text check (note_en is null or char_length(note_en) <= 300),
  note_bn      text check (note_bn is null or char_length(note_bn) <= 300),
  sort_order   integer not null default 100,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  check (is_closed or start_time is not null)
);
alter table public.worship_schedule enable row level security;
drop policy if exists "worship_schedule public read" on public.worship_schedule;
create policy "worship_schedule public read" on public.worship_schedule for select using (is_active or public.is_temple_admin());
drop policy if exists "worship_schedule admin write" on public.worship_schedule;
create policy "worship_schedule admin write" on public.worship_schedule for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------------------------------------------------------------------
-- 2. Event timings (adds columns to the existing events table)
-- ---------------------------------------------------------------------
alter table public.events add column if not exists opens_at       time;
alter table public.events add column if not exists puja_starts_at time;
alter table public.events add column if not exists closes_at      time;
alter table public.events add column if not exists location       text;

-- ---------------------------------------------------------------------
-- 3. Temple information shown on the website (address, phone, links …)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  key         text primary key,
  value_en    text check (value_en is null or char_length(value_en) <= 1000),
  value_bn    text check (value_bn is null or char_length(value_bn) <= 1000),
  updated_at  timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "site_settings public read" on public.site_settings;
create policy "site_settings public read" on public.site_settings for select using (true);
drop policy if exists "site_settings admin write" on public.site_settings;
create policy "site_settings admin write" on public.site_settings for all using (public.is_temple_admin()) with check (public.is_temple_admin());

insert into public.site_settings (key, value_en) values
  ('address', null), ('map_url', null), ('temple_phone', null), ('email', null),
  ('panjika_url', 'https://www.drikpanchang.com/bengali/bengali-month-panjika.html'),
  ('festival_hours_note', null)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 4. Committee contacts (shown in the Contact section when public)
-- ---------------------------------------------------------------------
create table if not exists public.committee_contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 100),
  role_en     text check (role_en is null or char_length(role_en) <= 80),
  role_bn     text check (role_bn is null or char_length(role_bn) <= 80),
  phone       text check (phone is null or char_length(phone) <= 20),
  email       text check (email is null or char_length(email) <= 254),
  sort_order  integer not null default 100,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.committee_contacts enable row level security;
drop policy if exists "committee_contacts public read" on public.committee_contacts;
create policy "committee_contacts public read" on public.committee_contacts for select using (is_public or public.is_temple_admin());
drop policy if exists "committee_contacts admin write" on public.committee_contacts;
create policy "committee_contacts admin write" on public.committee_contacts for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------------------------------------------------------------------
-- 5. Messages from the website contact form
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 100),
  email       text not null check (char_length(email) between 5 and 254),
  phone       text check (phone is null or char_length(phone) <= 20),
  subject     text check (subject is null or char_length(subject) <= 150),
  message     text not null check (char_length(trim(message)) between 10 and 2000),
  status      text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at  timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "contact_messages public send" on public.contact_messages;
create policy "contact_messages public send" on public.contact_messages for insert to anon, authenticated with check (status = 'new');
drop policy if exists "contact_messages admin all" on public.contact_messages;
create policy "contact_messages admin all" on public.contact_messages for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------------------------------------------------------------------
-- 6. Other income (donations and monthly subscriptions are already recorded separately)
-- ---------------------------------------------------------------------
create table if not exists public.income_entries (
  id               uuid primary key default gen_random_uuid(),
  entry_date       date not null default current_date,
  category         text not null check (category in ('pranami','puja_sponsorship','membership','event_contribution','prasad','fundraising','grant','interest','other')),
  description      text not null check (char_length(trim(description)) between 3 and 200),
  received_from    text check (received_from is null or char_length(received_from) <= 100),
  amount           numeric(12,2) not null check (amount > 0 and amount <= 10000000),
  currency         text not null default 'BDT' check (currency in ('BDT', 'USD')),
  method           text not null check (method in ('cash','cheque','bkash','nagad','rocket','bank','card','other')),
  reference        text check (reference is null or char_length(reference) <= 60),
  receipt_no       text check (receipt_no is null or char_length(receipt_no) <= 40),
  event_catalog_id uuid references public.event_catalog(id) on delete set null,
  notes            text check (notes is null or char_length(notes) <= 500),
  recorded_by      uuid default auth.uid(),
  created_at       timestamptz not null default now()
);
create unique index if not exists income_entries_receipt_no_key on public.income_entries (receipt_no) where receipt_no is not null;
alter table public.income_entries enable row level security;
drop policy if exists "income_entries admin all" on public.income_entries;
create policy "income_entries admin all" on public.income_entries for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------------------------------------------------------------------
-- 7. Expenditure
-- ---------------------------------------------------------------------
create table if not exists public.expense_entries (
  id               uuid primary key default gen_random_uuid(),
  expense_date     date not null default current_date,
  category         text not null check (category in ('puja_materials','prasad_bhog','priest','decoration','rent','utilities','maintenance','insurance','printing','sound_av','community_food','charity','office_admin','transport','other')),
  description      text not null check (char_length(trim(description)) between 3 and 200),
  paid_to          text check (paid_to is null or char_length(paid_to) <= 100),
  amount           numeric(12,2) not null check (amount > 0 and amount <= 10000000),
  currency         text not null default 'BDT' check (currency in ('BDT', 'USD')),
  method           text not null check (method in ('cash','cheque','bkash','nagad','rocket','bank','card','other')),
  reference        text check (reference is null or char_length(reference) <= 60),
  voucher_no       text check (voucher_no is null or char_length(voucher_no) <= 40),
  approved_by      text check (approved_by is null or char_length(approved_by) <= 100),
  event_catalog_id uuid references public.event_catalog(id) on delete set null,
  notes            text check (notes is null or char_length(notes) <= 500),
  recorded_by      uuid default auth.uid(),
  created_at       timestamptz not null default now()
);
create unique index if not exists expense_entries_voucher_no_key on public.expense_entries (voucher_no) where voucher_no is not null;
alter table public.expense_entries enable row level security;
drop policy if exists "expense_entries admin all" on public.expense_entries;
create policy "expense_entries admin all" on public.expense_entries for all using (public.is_temple_admin()) with check (public.is_temple_admin());
