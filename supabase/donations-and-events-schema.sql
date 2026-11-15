-- =====================================================================
-- Dhoom Vivekananda Samiti
-- Yearly event list, donations (office + online) and monthly subscriptions
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query →
-- paste this whole file → Run. It is safe to run more than once.
-- =====================================================================

-- Helper: is the logged-in user a temple admin? (uses the existing admin_profiles table)
create or replace function public.is_temple_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 1. Yearly event list (used by the Events form drop-down)
-- ---------------------------------------------------------------------
create table if not exists public.event_catalog (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null check (char_length(trim(name_en)) between 3 and 150),
  name_bn     text not null check (char_length(trim(name_bn)) between 2 and 150),
  usual_month smallint check (usual_month between 1 and 12),
  sort_order  integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists event_catalog_name_en_key on public.event_catalog (lower(trim(name_en)));

alter table public.event_catalog enable row level security;
drop policy if exists "event_catalog public read" on public.event_catalog;
create policy "event_catalog public read" on public.event_catalog
  for select using (is_active or public.is_temple_admin());
drop policy if exists "event_catalog admin write" on public.event_catalog;
create policy "event_catalog admin write" on public.event_catalog
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- Starting list (months are the usual Gregorian month; lunar dates move each year)
insert into public.event_catalog (name_en, name_bn, usual_month, sort_order) values
  ('Kalpataru Utsav', 'কল্পতরু উৎসব', 1, 10),
  ('Swami Vivekananda Janmatithi', 'স্বামী বিবেকানন্দের জন্মতিথি', 1, 20),
  ('Saraswati Puja', 'সরস্বতী পূজা', 2, 30),
  ('Sri Ramakrishna Janmatithi', 'শ্রীরামকৃষ্ণের জন্মতিথি', 2, 40),
  ('Maha Shivaratri', 'মহাশিবরাত্রি', 2, 50),
  ('Dol Purnima', 'দোলযাত্রা', 3, 60),
  ('Bengali New Year (Pohela Boishakh)', 'বাংলা নববর্ষ (পহেলা বৈশাখ)', 4, 70),
  ('Buddha Purnima', 'বুদ্ধ পূর্ণিমা', 5, 80),
  ('Rath Yatra', 'রথযাত্রা', 7, 90),
  ('Guru Purnima', 'গুরু পূর্ণিমা', 7, 100),
  ('Janmashtami', 'জন্মাষ্টমী', 8, 110),
  ('Durga Puja', 'দুর্গাপূজা', 10, 120),
  ('Lakshmi Puja', 'লক্ষ্মীপূজা', 10, 130),
  ('Shyama Puja (Kali Puja)', 'শ্যামাপূজা (কালীপূজা)', 11, 140),
  ('Holy Mother Sri Sarada Devi Janmatithi', 'শ্রীশ্রী মা সারদা দেবীর জন্মতিথি', 12, 150)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2. Donations (office entry by admin + online form by visitors)
-- ---------------------------------------------------------------------
create table if not exists public.donations (
  id               uuid primary key default gen_random_uuid(),
  channel          text not null check (channel in ('office', 'online')),
  donor_name       text not null check (char_length(trim(donor_name)) between 2 and 100),
  phone            text check (phone is null or char_length(phone) <= 20),
  email            text check (email is null or char_length(email) <= 254),
  address          text check (address is null or char_length(address) <= 300),
  amount           numeric(12,2) not null check (amount > 0 and amount <= 10000000),
  currency         text not null default 'BDT' check (currency in ('BDT', 'USD')),
  method           text not null check (method in ('cash','cheque','bkash','nagad','rocket','bank','card','other')),
  transaction_ref  text check (transaction_ref is null or char_length(transaction_ref) <= 60),
  receipt_no       text check (receipt_no is null or char_length(receipt_no) <= 40),
  purpose          text not null default 'General temple fund' check (char_length(purpose) <= 150),
  event_catalog_id uuid references public.event_catalog(id) on delete set null,
  donated_on       date not null default current_date,
  notes            text check (notes is null or char_length(notes) <= 500),
  status           text not null default 'pending' check (status in ('pending','verified','rejected')),
  recorded_by      uuid default auth.uid(),
  created_at       timestamptz not null default now()
);
create unique index if not exists donations_receipt_no_key on public.donations (receipt_no) where receipt_no is not null;

alter table public.donations enable row level security;
-- Visitors may only ADD an online donation that waits for verification. They cannot read the list.
drop policy if exists "donations public online insert" on public.donations;
create policy "donations public online insert" on public.donations
  for insert to anon, authenticated
  with check (channel = 'online' and status = 'pending' and receipt_no is null);
drop policy if exists "donations admin all" on public.donations;
create policy "donations admin all" on public.donations
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- ---------------------------------------------------------------------
-- 3. Monthly subscriptions and the payment of each month
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  donor_name      text not null check (char_length(trim(donor_name)) between 2 and 100),
  phone           text not null check (char_length(phone) between 7 and 20),
  email           text check (email is null or char_length(email) <= 254),
  address         text check (address is null or char_length(address) <= 300),
  monthly_amount  numeric(12,2) not null check (monthly_amount > 0 and monthly_amount <= 1000000),
  currency        text not null default 'BDT' check (currency in ('BDT', 'USD')),
  payment_method  text not null check (payment_method in ('cash','bkash','nagad','rocket','bank','card','other')),
  start_month     date not null,
  status          text not null default 'pending' check (status in ('pending','active','paused','cancelled')),
  source          text not null default 'online' check (source in ('office','online')),
  notes           text check (notes is null or char_length(notes) <= 500),
  created_at      timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions public signup" on public.subscriptions;
create policy "subscriptions public signup" on public.subscriptions
  for insert to anon, authenticated
  with check (status = 'pending' and source = 'online');
drop policy if exists "subscriptions admin all" on public.subscriptions;
create policy "subscriptions admin all" on public.subscriptions
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());

create table if not exists public.subscription_payments (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.subscriptions(id) on delete cascade,
  month            date not null,
  amount           numeric(12,2) not null check (amount > 0),
  currency         text not null check (currency in ('BDT', 'USD')),
  method           text not null check (method in ('cash','bkash','nagad','rocket','bank','card','other')),
  transaction_ref  text check (transaction_ref is null or char_length(transaction_ref) <= 60),
  paid_on          date not null default current_date,
  created_at       timestamptz not null default now(),
  unique (subscription_id, month)
);

alter table public.subscription_payments enable row level security;
drop policy if exists "subscription_payments admin all" on public.subscription_payments;
create policy "subscription_payments admin all" on public.subscription_payments
  for all using (public.is_temple_admin()) with check (public.is_temple_admin());
