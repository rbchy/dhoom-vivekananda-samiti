-- =====================================================================
-- Website extras: banner ticker message, About (mission & deities),
-- gallery categories, and editable income / expenditure heads.
--
-- RUN THIRD, after donations-and-events-schema.sql and temple-management-schema.sql.
-- Supabase Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
-- =====================================================================

-- 1. Banner ticker message (edit it in Admin → Temple Info & Contacts)
insert into public.site_settings (key, value_en, value_bn) values
  ('ticker_message', 'Ramakrishna Sharanam', 'রামকৃষ্ণ শরণম্'),
  ('ticker_audio_url', null, null)
on conflict (key) do nothing;

-- 2. About section: mission values and presiding deities
create table if not exists public.temple_highlights (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('mission', 'deity')),
  title_en    text not null check (char_length(trim(title_en)) between 2 and 120),
  title_bn    text check (title_bn is null or char_length(title_bn) <= 120),
  subtitle_en text check (subtitle_en is null or char_length(subtitle_en) <= 120),
  subtitle_bn text check (subtitle_bn is null or char_length(subtitle_bn) <= 120),
  body_en     text check (body_en is null or char_length(body_en) <= 800),
  body_bn     text check (body_bn is null or char_length(body_bn) <= 800),
  image_url   text check (image_url is null or char_length(image_url) <= 500),
  sort_order  integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.temple_highlights enable row level security;
drop policy if exists "temple_highlights public read" on public.temple_highlights;
create policy "temple_highlights public read" on public.temple_highlights for select using (is_active or public.is_temple_admin());
drop policy if exists "temple_highlights admin write" on public.temple_highlights;
create policy "temple_highlights admin write" on public.temple_highlights for all using (public.is_temple_admin()) with check (public.is_temple_admin());

-- 3. Gallery categories (for the filter buttons on the website)
alter table public.gallery add column if not exists category text not null default 'temple';
alter table public.gallery drop constraint if exists gallery_category_check;
alter table public.gallery add constraint gallery_category_check check (category in ('festivals', 'worship', 'community', 'temple'));

-- 4. Editable income / expenditure heads
create table if not exists public.account_heads (
  id          uuid primary key default gen_random_uuid(),
  head_type   text not null check (head_type in ('income', 'expense')),
  code        text not null check (code ~ '^[a-z0-9_]{2,40}$'),
  name_en     text not null check (char_length(trim(name_en)) between 2 and 80),
  name_bn     text check (name_bn is null or char_length(name_bn) <= 80),
  sort_order  integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (head_type, code)
);
alter table public.account_heads enable row level security;
drop policy if exists "account_heads admin all" on public.account_heads;
create policy "account_heads admin all" on public.account_heads for all using (public.is_temple_admin()) with check (public.is_temple_admin());

insert into public.account_heads (head_type, code, name_en, name_bn, sort_order) values
  ('income', 'pranami', 'Pranami / donation box', 'প্রণামী বাক্স', 10),
  ('income', 'puja_sponsorship', 'Puja sponsorship', 'পূজা স্পনসর', 20),
  ('income', 'membership', 'Membership fee', 'সদস্য ফি', 30),
  ('income', 'event_contribution', 'Event contribution', 'অনুষ্ঠানের চাঁদা', 40),
  ('income', 'prasad', 'Prasad / bhog contribution', 'প্রসাদ', 50),
  ('income', 'fundraising', 'Fundraising', 'তহবিল সংগ্রহ', 60),
  ('income', 'grant', 'Grant / aid', 'অনুদান', 70),
  ('income', 'interest', 'Bank interest', 'ব্যাংক সুদ', 80),
  ('income', 'other', 'Other income', 'অন্যান্য আয়', 999),
  ('expense', 'puja_materials', 'Puja materials', 'পূজার সামগ্রী', 10),
  ('expense', 'prasad_bhog', 'Prasad & bhog', 'প্রসাদ ও ভোগ', 20),
  ('expense', 'priest', 'Priest dakshina', 'পুরোহিত দক্ষিণা', 30),
  ('expense', 'decoration', 'Decoration & lighting', 'সাজসজ্জা ও আলো', 40),
  ('expense', 'rent', 'Rent / venue', 'ভাড়া', 50),
  ('expense', 'utilities', 'Utilities', 'বিদ্যুৎ, গ্যাস, পানি', 60),
  ('expense', 'maintenance', 'Maintenance & repair', 'রক্ষণাবেক্ষণ', 70),
  ('expense', 'insurance', 'Insurance', 'বিমা', 80),
  ('expense', 'printing', 'Printing & publicity', 'ছাপা ও প্রচার', 90),
  ('expense', 'sound_av', 'Sound & AV', 'সাউন্ড ও মাইক', 100),
  ('expense', 'community_food', 'Community meal / picnic', 'সম্মিলিত খাবার', 110),
  ('expense', 'charity', 'Humanitarian aid', 'মানবিক সহায়তা', 120),
  ('expense', 'office_admin', 'Office & admin', 'অফিস ও প্রশাসন', 130),
  ('expense', 'transport', 'Transport', 'যাতায়াত', 140),
  ('expense', 'other', 'Other expenditure', 'অন্যান্য ব্যয়', 999)
on conflict (head_type, code) do nothing;

-- Heads are now managed in account_heads, so allow any head code in entries
alter table public.income_entries drop constraint if exists income_entries_category_check;
alter table public.income_entries add constraint income_entries_category_check check (category ~ '^[a-z0-9_]{2,40}$');
alter table public.expense_entries drop constraint if exists expense_entries_category_check;
alter table public.expense_entries add constraint expense_entries_category_check check (category ~ '^[a-z0-9_]{2,40}$');
