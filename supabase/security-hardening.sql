-- =====================================================================
-- Dhoom Vivekananda Samiti — SECURITY HARDENING (Step 3)
--
-- RUN AFTER security-audit.sql, and after the other schema files.
-- Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once. Does not delete any data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. admin_profiles — the "who is admin" list.
--    If a visitor could add a row here, they would become an admin and see
--    every donation, phone number and account. Lock it down:
--    a logged-in user may only READ their own row; nobody may add, change
--    or remove rows from the website. Admins are added only here in the
--    SQL Editor (see the example at the bottom).
-- ---------------------------------------------------------------------
alter table public.admin_profiles enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'admin_profiles'
  loop
    execute format('drop policy %I on public.admin_profiles', p.policyname);
  end loop;
end $$;

create policy "admin_profiles read own row" on public.admin_profiles
  for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.admin_profiles from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Online donations — visitors may only send a pending online request,
--    dated today, by a non-cash method, and may not pretend another person
--    recorded it.
-- ---------------------------------------------------------------------
drop policy if exists "donations public online insert" on public.donations;
create policy "donations public online insert" on public.donations
  for insert to anon, authenticated
  with check (
    channel = 'online'
    and status = 'pending'
    and receipt_no is null
    and method in ('bkash', 'nagad', 'rocket', 'bank', 'card', 'other')
    and donated_on between current_date - 1 and current_date + 1
    and (recorded_by is null or recorded_by = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 3. Photo bucket — only real images, at most 5 MB each
--    (the website already refuses bigger files; this enforces it on the server).
-- ---------------------------------------------------------------------
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'event-photos';

-- ---------------------------------------------------------------------
-- 4. Check: list any public table that still has RLS turned OFF.
--    The result should be EMPTY.
-- ---------------------------------------------------------------------
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- ---------------------------------------------------------------------
-- HOW TO ADD A NEW ADMIN (run separately, change the e-mail):
--   insert into public.admin_profiles (user_id, role)
--   select id, 'admin' from auth.users where email = 'name@example.com';
-- HOW TO REMOVE AN ADMIN:
--   delete from public.admin_profiles
--   where user_id = (select id from auth.users where email = 'name@example.com');
-- ---------------------------------------------------------------------
