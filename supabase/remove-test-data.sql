-- =====================================================================
-- Removes ONLY the rows added by test-data-seed.sql. Your real data stays.
-- Supabase → SQL Editor → paste → Run.
-- =====================================================================
delete from public.subscription_payments where id::text like '7e570000-0000-4000-8000-%';
delete from public.subscriptions        where id::text like '7e570000-0000-4000-8000-%';
delete from public.donations            where id::text like '7e570000-0000-4000-8000-%';
delete from public.income_entries       where id::text like '7e570000-0000-4000-8000-%';
delete from public.expense_entries      where id::text like '7e570000-0000-4000-8000-%';
delete from public.contact_messages     where id::text like '7e570000-0000-4000-8000-%';
delete from public.committee_contacts   where id::text like '7e570000-0000-4000-8000-%';
delete from public.worship_schedule     where id::text like '7e570000-0000-4000-8000-%';
delete from public.temple_highlights    where id::text like '7e570000-0000-4000-8000-%';
delete from public.account_heads        where id::text like '7e570000-0000-4000-8000-%';
delete from public.event_catalog        where id::text like '7e570000-0000-4000-8000-%';
delete from public.events        where created_at >= '2000-01-01 00:00:00+00' and created_at < '2000-01-02 00:00:00+00';
delete from public.gallery       where created_at >= '2000-01-01 00:00:00+00' and created_at < '2000-01-02 00:00:00+00';
delete from public.announcements where created_at >= '2000-01-01 00:00:00+00' and created_at < '2000-01-02 00:00:00+00';
delete from public.temple_content where slug = 'about-temple' and updated_at = '2000-01-01 00:00:00+00';
update public.site_settings set value_en = null, value_bn = null where key = 'address' and value_en = 'Ramakrishna Temple, Dhoom, Mirsharai, Chattogram, Bangladesh';
update public.site_settings set value_en = null where key = 'temple_phone' and value_en = '+1 (215) 555-0100';
update public.site_settings set value_en = null where key = 'email' and value_en = 'temple-test@example.com';
update public.site_settings set value_en = null, value_bn = null where key = 'festival_hours_note' and value_en = 'Hours may change on festival days — please check the Events section.';
