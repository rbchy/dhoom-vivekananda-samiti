-- =====================================================================
-- Setup status: which setup files have been run and what is still sample data.
-- Run any time in Supabase → SQL Editor. It only reads; it changes nothing.
-- Each row shows ✅ done, ❌ not done yet, or ⚠️ needs attention, with what to do.
-- =====================================================================

create temp table if not exists setup_status (n int, item text, status text, detail text);
truncate setup_status;

do $$
declare
  c int; c2 int; t text;
  has_table boolean;
  tbl text;
begin
  -- 1. Roles and approvals (accounts admin, secretary)
  if to_regprocedure('public.is_staff()') is not null and to_regclass('public.pending_changes') is not null then
    select count(*) into c from public.admin_profiles where role in ('accounts_admin', 'secretary');
    insert into setup_status values (1, 'Roles & approvals / ভূমিকা ও অনুমোদন', '✅',
      case when c = 0 then 'Installed. No accounts admin or secretary yet — add them in Admin → Staff.' else c || ' staff member(s) besides the main admin.' end);
  else
    insert into setup_status values (1, 'Roles & approvals / ভূমিকা ও অনুমোদন', '❌', 'Run security-hardening.sql, then roles-and-approvals.sql.');
  end if;

  -- 2. Temple hours
  if to_regclass('public.worship_schedule') is not null then
    select count(*) into c from public.worship_schedule where is_active;
    insert into setup_status values (2, 'Temple hours / মন্দির খোলার সময়', case when c >= 10 then '✅' when c > 0 then '⚠️' else '❌' end,
      c || ' active time slot(s). Expected 10 (seed-temple-hours.sql).');
  end if;

  -- 3. Smriti Stambha (founders)
  if to_regclass('public.smriti_stambha') is not null then
    select count(*) into c from public.smriti_stambha;
    select count(*) into c2 from public.smriti_stambha where id::text like '5a3b1e00-%';
    insert into setup_status values (3, 'Smriti Stambha / স্মৃতিস্তম্ভ', case when c2 > 0 then '⚠️' else '✅' end,
      c || ' name(s); ' || c2 || ' are the sample names — replace them with the real founders.');
  else
    insert into setup_status values (3, 'Smriti Stambha / স্মৃতিস্তম্ভ', '❌', 'Run smriti-stambha.sql.');
  end if;

  -- 4. Pranam mantras on deity cards
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'temple_highlights' and column_name = 'pranam_bn') into has_table;
  if has_table then
    execute $q$select count(*) filter (where pranam_bn is not null or pranam_en is not null), count(*) from public.temple_highlights where kind = 'deity'$q$ into c, c2;
    execute $q$select string_agg(title_en, ', ') from public.temple_highlights where kind = 'deity' and pranam_bn is null and pranam_en is null$q$ into t;
    insert into setup_status values (4, 'Pranam mantras / প্রণাম মন্ত্র', case when c = c2 then '✅' else '⚠️' end,
      c || ' of ' || c2 || ' deities have a mantra.' || coalesce(' Missing: ' || t || ' — add in Admin → Mission & Deities.', ''));
  else
    insert into setup_status values (4, 'Pranam mantras / প্রণাম মন্ত্র', '❌', 'Run pranam-mantra.sql.');
  end if;

  -- 5. Sri Surya Dev card
  if to_regclass('public.temple_highlights') is not null then
    select count(*) into c from public.temple_highlights where kind = 'deity' and (title_en ilike '%surya%' or title_en ilike '%surjya%');
    insert into setup_status values (5, 'Sri Surya Dev card / সূর্যদেব', case when c > 0 then '✅' else '❌' end,
      case when c > 0 then 'Present.' else 'Run add-surya-dev.sql (after pranam-mantra.sql).' end);
    select count(*) into c from public.temple_highlights where kind = 'deity' and title_en ilike '%ganga%';
    insert into setup_status values (6, 'Ma Ganga card / গঙ্গা দেবী', case when c > 0 then '✅' else '❌' end,
      case when c > 0 then 'Present.' else 'Run add-ganga-devi.sql (after pranam-mantra.sql).' end);
    select count(*) into c from public.temple_highlights where kind = 'deity' and (title_en ilike '%sarada%' or title_bn like '%সারদা%');
    insert into setup_status values (6, 'Ma Sarada Devi card / মা সারদা দেবী', case when c > 0 then '✅' else '❌' end,
      case when c > 0 then 'Present.' else 'Run add-sarada-devi.sql (after pranam-mantra.sql).' end);
    select count(*) into c from public.temple_highlights where kind = 'deity' and (title_en ilike '%vivekananda%' or title_bn like '%বিবেকানন্দ%');
    insert into setup_status values (6, 'Swami Vivekananda card / স্বামী বিবেকানন্দ', case when c > 0 then '✅' else '❌' end,
      case when c > 0 then 'Present.' else 'Run add-swami-vivekananda.sql (after pranam-mantra.sql).' end);
  end if;

  -- 7. Event subtitle/mantra and the two yearly festivals
  select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'events' and column_name = 'mantra_bn') into has_table;
  if has_table then
    select count(*) into c from public.events where title_en ilike '%saraswati%' or title_en ilike '%gita jayanti%';
    insert into setup_status values (7, 'Saraswati Puja & Gita Jayanti / উৎসব', case when c = 2 then '✅' else '⚠️' end, c || ' festival event(s) found (expected 2).' || case when c > 2 then ' More than 2 — check for duplicates.' else '' end);
  else
    insert into setup_status values (7, 'Saraswati Puja & Gita Jayanti / উৎসব', '❌', 'Run event-extras.sql.');
  end if;

  -- 8. Temple information (address, phone, email, map)
  if to_regclass('public.site_settings') is not null then
    select string_agg(k, ', ') into t from unnest(array['address', 'temple_phone', 'email', 'map_url']) k
      where not exists (select 1 from public.site_settings s where s.key = k and coalesce(s.value_en, s.value_bn, '') <> '');
    insert into setup_status values (8, 'Temple information / মন্দিরের তথ্য', case when t is null then '✅' else '⚠️' end,
      coalesce('Empty: ' || t || ' — fill in Admin → Temple info.', 'Address, phone, email and map are filled.'));
    select count(*) into c from public.site_settings where key = 'bhajan_autoplay' and value_en = 'on';
    select count(*) into c2 from public.site_settings where key = 'ticker_audio_url' and coalesce(value_en, '') <> '';
    insert into setup_status values (9, 'Welcome bhajan / ভজন', case when c > 0 and c2 > 0 then '✅' else '⚠️' end,
      case when c2 = 0 then 'No recording yet — add a song link in Admin → Temple info.' when c = 0 then 'Recording set, autoplay is off.' else 'Plays when the site opens.' end);
  end if;

  -- 10. Committee contacts
  if to_regclass('public.committee_contacts') is not null then
    select count(*) into c from public.committee_contacts;
    insert into setup_status values (10, 'Committee contacts / কমিটির যোগাযোগ', case when c > 0 then '✅' else '⚠️' end, c || ' contact(s).');
  end if;

  -- 11. Test data left from development (ids 7e570000-… or created on 1 Jan 2000), table by table
  t := null;
  for tbl in select unnest(array['subscription_payments', 'subscriptions', 'donations', 'income_entries', 'expense_entries', 'contact_messages',
                                 'committee_contacts', 'worship_schedule', 'temple_highlights', 'account_heads', 'event_catalog']) loop
    if to_regclass('public.' || tbl) is not null then
      execute format('select count(*) from public.%I where id::text like %L', tbl, '7e570000-0000-4000-8000-%') into c;
      if c > 0 then t := coalesce(t || ', ', '') || tbl || ' ' || c; end if;
    end if;
  end loop;
  for tbl in select unnest(array['events', 'gallery', 'announcements']) loop
    if to_regclass('public.' || tbl) is not null then
      execute format('select count(*) from public.%I where created_at >= %L and created_at < %L', tbl, '2000-01-01', '2000-01-02') into c;
      if c > 0 then t := coalesce(t || ', ', '') || tbl || ' ' || c; end if;
    end if;
  end loop;
  insert into setup_status values (11, 'Test data / পরীক্ষার তথ্য', case when t is null then '✅' else '⚠️' end,
    coalesce('Test rows: ' || t || ' — run remove-test-data.sql, then run this report again.', 'No test data.'));

  -- 12. Upload buckets: size and type limits
  for t in select id from storage.buckets order by id loop
    select count(*) into c from storage.buckets where id = t and file_size_limit is not null and allowed_mime_types is not null;
    insert into setup_status values (12, 'Storage bucket: ' || t, case when c > 0 then '✅' else '⚠️' end,
      case when c > 0 then 'Has size and file-type limits.' else 'No size or file-type limit.' end);
  end loop;

  -- 14. Holy visits and the Bhavadhara directory (visits-and-bhavadhara.sql)
  if to_regclass('public.maharaj_visits') is not null and to_regclass('public.bhavadhara_orgs') is not null then
    select count(*) into c from public.visit_memories where status = 'pending';
    select count(*) into c2 from public.bhavadhara_orgs where status = 'pending';
    insert into setup_status values (14, 'Holy visits & Bhavadhara / পুণ্য আগমন ও ভাবধারা', case when c + c2 > 0 then '⚠️' else '✅' end,
      case when c + c2 > 0 then c || ' memory(ies) and ' || c2 || ' organisation(s) wait for approval in Admin.' else 'Installed. Nothing waiting for approval.' end);
  else
    insert into setup_status values (14, 'Holy visits & Bhavadhara / পুণ্য আগমন ও ভাবধারা', '❌', 'Run visits-and-bhavadhara.sql.');
  end if;

  -- 15. Honoured donors and Samiti officials (donors-and-officials.sql)
  if to_regclass('public.donor_honours') is not null and to_regclass('public.samiti_officials') is not null then
    select count(*) into c from public.donor_honours where is_published and not consent;
    select count(*) into c2 from public.samiti_officials where is_current and is_published;
    insert into setup_status values (15, 'Donors & officials / দাতা ও কর্মকর্তা', case when c > 0 or c2 = 0 then '⚠️' else '✅' end,
      c2 || ' current official(s).' || case when c > 0 then ' ' || c || ' donor(s) are hidden because "donor agreed" is not ticked.' else '' end);
  else
    insert into setup_status values (15, 'Donors & officials / দাতা ও কর্মকর্তা', '❌', 'Run donors-and-officials.sql.');
  end if;

  -- 13. Two-step login (MFA) for staff
  if to_regclass('auth.mfa_factors') is not null then
    execute $q$select count(distinct user_id) from auth.mfa_factors where status = 'verified'$q$ into c;
    insert into setup_status values (13, 'Two-step login (MFA) / দুই-ধাপের লগইন', case when c > 0 then '✅' else '⚠️' end,
      c || ' user(s) have two-step login turned on.');
  end if;
end $$;

select item, status, detail from setup_status order by n, item;
