-- =====================================================================
-- CI ONLY — security and approval tests. Any failure stops the build.
-- Users: a = main admin, b = accounts admin, c = secretary, d = no role.
-- =====================================================================
\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned

create or replace function pg_temp.login(who text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub',
    case who when 'main' then '00000000-0000-0000-0000-00000000000a'
             when 'accounts' then '00000000-0000-0000-0000-00000000000b'
             when 'secretary' then '00000000-0000-0000-0000-00000000000c'
             when 'nobody' then '00000000-0000-0000-0000-00000000000d'
             else '' end, false);
  execute format('set role %I', case when who = 'anon' then 'anon' else 'authenticated' end);
end $$;

-- expect(sql, should_fail, label)
create or replace function pg_temp.expect(q text, should_fail boolean, label text) returns void language plpgsql as $$
declare failed boolean := false; msg text;
begin
  begin execute q; exception when others then failed := true; msg := sqlerrm; end;
  if failed <> should_fail then
    raise exception 'TEST FAILED: % (expected %, got %)', label,
      case when should_fail then 'an error' else 'success' end, coalesce(msg, 'success');
  end if;
  raise notice 'ok - %', label;
end $$;

create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'TEST FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;

-- Every public table has row level security
select pg_temp.check(not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), 'RLS on every public table');

-- Main admin assigns roles
select pg_temp.login('main');
select public.set_staff_role('accounts@example.com', 'accounts_admin');
select public.set_staff_role('secretary@example.com', 'secretary');
reset role;

-- Visitors
select pg_temp.login('anon');
select pg_temp.expect($$insert into public.events (title_en) values ('x')$$, true, 'visitor cannot add an event');
select pg_temp.expect($$insert into public.admin_profiles values ('00000000-0000-0000-0000-00000000000d', 'admin')$$, true, 'visitor cannot make an admin');
select pg_temp.expect($$insert into public.donations (channel, donor_name, amount, method, status) values ('online', 'Test Donor', 100, 'bkash', 'pending')$$, false, 'visitor can send an online donation');
select pg_temp.expect($$insert into public.donations (channel, donor_name, amount, method, status) values ('online', 'Test Donor', 100, 'cash', 'pending')$$, true, 'visitor cannot claim a cash donation');
select pg_temp.expect($$insert into public.donations (channel, donor_name, amount, method, status) values ('online', 'Test Donor', 100, 'bkash', 'verified')$$, true, 'visitor cannot send a verified donation');
select pg_temp.check((select count(*) from public.donations) = 0, 'visitor cannot read donations');
select pg_temp.check((select count(*) from public.pending_changes) = 0, 'visitor cannot read requests');
reset role;

-- Logged in but no role
select pg_temp.login('nobody');
select pg_temp.expect($$insert into public.admin_profiles values ('00000000-0000-0000-0000-00000000000d', 'admin')$$, true, 'user without role cannot make themselves admin');
select pg_temp.check((select count(*) from public.income_entries) = 0, 'user without role cannot read income');
select pg_temp.expect($$select public.set_staff_role('nobody@example.com', 'admin')$$, true, 'user without role cannot change roles');
reset role;

-- Main admin
select pg_temp.login('main');
select pg_temp.expect($$insert into public.events (id, title_en, is_published) values ('11111111-1111-1111-1111-111111111111', 'Kali Puja', true)$$, false, 'main admin adds an event');
select pg_temp.expect($$insert into public.income_entries (entry_date, category, description, amount, currency, method) values (current_date, 'donation', 'x', 1, 'BDT', 'cash')$$, true, 'main admin cannot write income');
reset role;

-- Accounts admin
select pg_temp.login('accounts');
select pg_temp.expect($$insert into public.income_entries (entry_date, category, description, amount, currency, method) values (current_date, 'donation', 'Puja box', 5000, 'BDT', 'cash')$$, false, 'accounts admin adds income directly');
select pg_temp.expect($$insert into public.events (title_en) values ('x')$$, true, 'accounts admin cannot add an event');
select pg_temp.expect($$select public.set_staff_role('secretary@example.com', 'admin')$$, true, 'accounts admin cannot change roles');
reset role;

-- Secretary
select pg_temp.login('secretary');
select pg_temp.expect($$insert into public.events (title_en) values ('x')$$, true, 'secretary cannot add an event directly');
select pg_temp.expect($$insert into public.income_entries (entry_date, category, description, amount, currency, method) values (current_date, 'donation', 'x', 1, 'BDT', 'cash')$$, true, 'secretary cannot add income directly');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, new_data) values ('events', 'insert', '{"title_en": "Durga Puja", "is_published": true, "not_a_column": 1}')$$, false, 'secretary requests a new event');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, row_id, new_data) values ('events', 'update', '11111111-1111-1111-1111-111111111111', '{"title_en": "Kali Puja 2026", "id": "00000000-0000-0000-0000-000000000000"}')$$, false, 'secretary requests an event edit');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, new_data) values ('income_entries', 'insert', '{"entry_date": "2026-11-15", "category": "donation", "description": "Box", "amount": 750, "currency": "BDT", "method": "cash"}')$$, false, 'secretary requests an income entry');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, new_data) values ('admin_profiles', 'insert', '{"role": "admin"}')$$, true, 'secretary cannot request admin_profiles changes');
select pg_temp.expect($$update public.pending_changes set status = 'approved'$$, true, 'secretary cannot approve by editing');
select pg_temp.expect($$select public.approve_change(id) from public.pending_changes where table_name = 'events' limit 1$$, true, 'secretary cannot approve');
reset role;

-- Approvals go to the right admin
select pg_temp.login('accounts');
select pg_temp.check((select count(*) from public.pending_changes) = 1, 'accounts admin sees only the accounts request');
select pg_temp.expect($$select public.approve_change(id, 'ok') from public.pending_changes where table_name = 'income_entries'$$, false, 'accounts admin approves income');
reset role;
select pg_temp.check((select count(*) from public.income_entries where description = 'Box') = 1, 'approved income is in the ledger');

select pg_temp.login('accounts');
select pg_temp.expect(format('select public.approve_change(%L)', (select id from public.pending_changes where table_name = 'events' and action = 'insert')), true, 'accounts admin cannot approve content');
reset role;

select pg_temp.login('main');
select pg_temp.expect($$select public.approve_change(id) from public.pending_changes where table_name = 'events' and status = 'pending'$$, false, 'main admin approves event requests');
reset role;
select pg_temp.check((select count(*) from public.events where title_en = 'Durga Puja') = 1, 'approved new event exists');
select pg_temp.check((select title_en from public.events where id = '11111111-1111-1111-1111-111111111111') = 'Kali Puja 2026', 'approved edit applied, id unchanged');

-- Reject needs a reason; requester can withdraw
select pg_temp.login('secretary');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, row_id) values ('events', 'delete', '11111111-1111-1111-1111-111111111111')$$, false, 'secretary requests a delete');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, row_key, new_data) values ('site_settings', 'upsert', 'key', '{"key": "temple_phone", "value_en": "+880 1700 000000"}')$$, false, 'secretary requests a settings change');
reset role;
select pg_temp.login('main');
select pg_temp.expect($$select public.reject_change(id, '') from public.pending_changes where action = 'delete'$$, true, 'reject without a reason fails');
select pg_temp.expect($$select public.reject_change(id, 'Keep this event') from public.pending_changes where action = 'delete'$$, false, 'reject with a reason');
select pg_temp.expect($$select public.approve_change(id) from public.pending_changes where table_name = 'site_settings'$$, false, 'main admin approves settings change');
reset role;
select pg_temp.check((select value_en from public.site_settings where key = 'temple_phone') = '+880 1700 000000', 'settings upsert applied');
select pg_temp.check(exists (select 1 from public.events where id = '11111111-1111-1111-1111-111111111111'), 'rejected delete did not delete');

-- Nobody approves their own request (main admin acting as requester is impossible: only secretaries send)
select pg_temp.login('main');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, new_data) values ('events', 'insert', '{"title_en": "x"}')$$, true, 'admins do not send requests');
select pg_temp.expect($$select public.set_staff_role('main@example.com', 'secretary')$$, true, 'main admin cannot remove own admin role');
reset role;

-- Social media post log: written only by the server (Edge Function), read only by the main admin
insert into public.social_posts (kind, item_id, target, status, remote_id)
values ('event', '11111111-1111-1111-1111-111111111111', 'facebook', 'posted', 'page_post1');
select pg_temp.login('anon');
select pg_temp.check((select count(*) from public.social_posts) = 0, 'visitor cannot read the social post log');
reset role;
select pg_temp.login('secretary');
select pg_temp.check((select count(*) from public.social_posts) = 0, 'secretary cannot read the social post log');
select pg_temp.expect($$insert into public.social_posts (kind, item_id, target, status) values ('event', gen_random_uuid(), 'facebook', 'posted')$$, true, 'secretary cannot fake a social post');
reset role;
select pg_temp.login('accounts');
select pg_temp.check((select count(*) from public.social_posts) = 0, 'accounts admin cannot read the social post log');
reset role;
select pg_temp.login('main');
select pg_temp.check((select count(*) from public.social_posts) = 1, 'main admin reads the social post log');
select pg_temp.expect($$insert into public.social_posts (kind, item_id, target, status) values ('event', gen_random_uuid(), 'facebook', 'posted')$$, true, 'main admin cannot write the log directly');
select pg_temp.expect($$delete from public.social_posts$$, true, 'main admin cannot delete the log');
reset role;

\echo 'ALL SECURITY TESTS PASSED'

-- Smriti Stambha: everyone reads published names, only the main admin writes,
-- the secretary's additions wait for the main admin's approval
update public.smriti_stambha set is_published = false where id = '5a3b1e00-0000-4000-8000-000000000005';
select pg_temp.login('anon');
select pg_temp.check((select count(*) from public.smriti_stambha) = 4, 'visitor sees only published Smriti Stambha names');
select pg_temp.expect($$insert into public.smriti_stambha (name_en) values ('Someone')$$, true, 'visitor cannot add a Smriti Stambha name');
reset role;
select pg_temp.login('secretary');
select pg_temp.check((select count(*) from public.smriti_stambha) = 5, 'secretary sees hidden Smriti Stambha names');
select pg_temp.expect($$insert into public.smriti_stambha (name_en) values ('Someone')$$, true, 'secretary cannot add a name directly');
select pg_temp.expect($$insert into public.pending_changes (table_name, action, new_data) values ('smriti_stambha', 'insert', '{"name_en": "Sri Test Member", "role_en": "Volunteer"}')$$, false, 'secretary requests a new Smriti Stambha name');
reset role;
select pg_temp.check((select approver_role from public.pending_changes where table_name = 'smriti_stambha') = 'admin', 'Smriti Stambha requests go to the main admin');
select set_config('test.smriti_request', (select id::text from public.pending_changes where table_name = 'smriti_stambha'), false);
select pg_temp.login('accounts');
select pg_temp.expect($$select public.approve_change(current_setting('test.smriti_request')::uuid)$$, true, 'accounts admin cannot approve a Smriti Stambha name');
reset role;
select pg_temp.login('main');
select pg_temp.expect($$select public.approve_change(id) from public.pending_changes where table_name = 'smriti_stambha'$$, false, 'main admin approves the Smriti Stambha name');
select pg_temp.expect($$update public.smriti_stambha set is_published = true where id = '5a3b1e00-0000-4000-8000-000000000005'$$, false, 'main admin edits a name directly');
reset role;
select pg_temp.check((select count(*) from public.smriti_stambha where name_en = 'Sri Test Member') = 1, 'approved Smriti Stambha name exists');

-- Pranam mantra: filled for each deity by name, never over an existing mantra, readable by visitors
reset role;
insert into public.temple_highlights (kind, title_en, sort_order) values
  ('deity', 'Sri Ramakrishna', 1), ('deity', 'Holy Mother Sri Sarada Devi', 2), ('deity', 'Swami Vivekananda', 3),
  ('deity', 'Ma Kali', 4), ('deity', 'Goddess Durga', 5), ('deity', 'Lord Shiva', 6), ('mission', 'Service', 7),
  ('deity', 'Ma Ganga', 3), ('deity', 'Ma Saraswati', 3);
insert into public.temple_highlights (kind, title_en, pranam_bn, sort_order) values ('deity', 'Kali (own mantra)', 'নিজের মন্ত্র', 8);
\ir ../pranam-mantra.sql
select pg_temp.check((select pranam_bn like 'ওঁ স্থাপকায়%' from public.temple_highlights where title_en = 'Sri Ramakrishna'), 'Sri Ramakrishna gets his pranam mantra');
select pg_temp.check((select pranam_bn like 'ওঁ জননীং সারদাং%' from public.temple_highlights where title_en = 'Holy Mother Sri Sarada Devi'), 'Holy Mother gets her own mantra, not Thakur''s');
select pg_temp.check((select count(*) from public.temple_highlights where kind = 'deity' and title_en in ('Swami Vivekananda', 'Ma Kali', 'Goddess Durga', 'Lord Shiva') and pranam_bn is not null and pranam_en is not null) = 4, 'Swamiji, Kali, Durga and Shiva get mantras in Bangla and Roman script');
select pg_temp.check((select pranam_bn from public.temple_highlights where title_en = 'Kali (own mantra)') = 'নিজের মন্ত্র', 'a mantra the admin wrote is never overwritten');
select pg_temp.check((select pranam_bn is null from public.temple_highlights where kind = 'mission'), 'mission cards get no mantra');
select pg_temp.check((select pranam_bn like 'ওঁ সদ্যঃ%' from public.temple_highlights where title_en = 'Ma Ganga') and (select pranam_bn like 'ওঁ সরস্বতী%' from public.temple_highlights where title_en = 'Ma Saraswati'), 'Ma Ganga and Ma Saraswati get their mantras');
select pg_temp.login('anon');
select pg_temp.check((select count(*) from public.temple_highlights where pranam_bn is not null) >= 6, 'visitors can read the pranam mantras');
reset role;
delete from public.temple_highlights where sort_order between 1 and 8 and title_en in ('Sri Ramakrishna', 'Holy Mother Sri Sarada Devi', 'Swami Vivekananda', 'Ma Kali', 'Goddess Durga', 'Lord Shiva', 'Service', 'Kali (own mantra)', 'Ma Ganga', 'Ma Saraswati');

-- Sri Surya Dev card: added once even when the file is run twice, with picture and mantra
select pg_temp.check((select count(*) from public.temple_highlights where title_en = 'Sri Surya Dev') = 1, 'Sri Surya Dev is added once');
select pg_temp.check((select image_url like '%/images/deities/surya-dev.webp' and pranam_bn like 'ওঁ জবাকুসুম%' and body_bn is not null from public.temple_highlights where title_en = 'Sri Surya Dev'), 'Sri Surya Dev has picture, mantra and description');

-- Yearly festivals: Saraswati Puja and Gita Jayanti added once each, with subtitle, mantra and picture; visitors see them
select pg_temp.check((select count(*) from public.events where title_en in ('Sri Sri Saraswati Puja', 'Sri Sri Gita Jayanti')) = 2, 'Saraswati Puja and Gita Jayanti are added once each');
select pg_temp.check((select bool_and(mantra_bn is not null and subtitle_bn is not null and image_url like '%/images/events/%') from public.events where title_en in ('Sri Sri Saraswati Puja', 'Sri Sri Gita Jayanti')), 'both festivals have subtitle, mantra and picture');
select pg_temp.login('anon');
select pg_temp.check((select count(*) from public.events where title_en in ('Sri Sri Saraswati Puja', 'Sri Sri Gita Jayanti')) = 2, 'visitors can see both festivals');
reset role;
