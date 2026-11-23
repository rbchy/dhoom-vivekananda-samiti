-- =====================================================================
-- Dhoom Vivekananda Samiti — ACCOUNTS FOR AUDIT
--
-- 1. Verification of every transaction by an authorised official
--    (main admin or accounts admin, and never the person who entered it):
--    other income, expenditure / purchases and subscription payments get
--    "verified by / when"; donations record who verified them.
--    A verified transaction is locked — it cannot be changed or deleted
--    unless the main admin first takes the verification back (logged).
-- 2. Archive of prepared income & expenditure statements (fortnightly,
--    monthly, quarterly, yearly …) and the list of people who receive them.
-- 3. (At the end) the daily schedule that lets the system prepare and
--    e-mail the statements by itself.
-- RUN AFTER roles-and-approvals.sql. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Verification columns
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['donations', 'subscription_payments', 'income_entries', 'expense_entries']
  loop
    execute format('alter table public.%I add column if not exists verified_at timestamptz', t);
    execute format('alter table public.%I add column if not exists verified_by uuid', t);
    execute format('alter table public.%I add column if not exists verified_by_name text check (verified_by_name is null or char_length(verified_by_name) <= 254)', t);
    execute format('alter table public.%I add column if not exists verified_role text', t);
    execute format('alter table public.%I add column if not exists verify_note text check (verify_note is null or char_length(verify_note) <= 300)', t);
  end loop;
end $$;
alter table public.subscription_payments add column if not exists recorded_by uuid default auth.uid();

-- Log of every verification and every withdrawal of one (never edited, never deleted)
create table if not exists public.verification_log (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  row_id      uuid not null,
  action      text not null check (action in ('verified', 'unverified')),
  note        text,
  done_by     uuid,
  done_by_name text,
  done_role   text,
  created_at  timestamptz not null default now()
);
alter table public.verification_log enable row level security;
drop policy if exists "verification_log staff read" on public.verification_log;
create policy "verification_log staff read" on public.verification_log for select to authenticated using (public.is_staff());

create or replace function public.current_staff_name()
returns text language sql stable security definer set search_path = public, auth as $$
  select coalesce((select email from auth.users where id = auth.uid()), 'staff');
$$;

-- Verify one transaction: p_table = 'subscription_payments' | 'income_entries' | 'expense_entries'
create or replace function public.verify_transaction(p_table text, p_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_role text := public.staff_role(); v_recorded uuid; v_verified timestamptz; v_rows integer;
begin
  if v_role not in ('admin', 'accounts_admin') then raise exception 'Only the main admin or the accounts admin can verify transactions'; end if;
  if p_table not in ('subscription_payments', 'income_entries', 'expense_entries') then raise exception 'Unknown table'; end if;
  execute format('select recorded_by, verified_at from public.%I where id = $1', p_table) into v_recorded, v_verified using p_id;
  get diagnostics v_rows = row_count;  -- (EXECUTE does not set FOUND)
  if v_rows = 0 then raise exception 'Transaction not found'; end if;
  if v_verified is not null then raise exception 'Already verified'; end if;
  if v_recorded is not null and v_recorded = auth.uid() then raise exception 'A transaction must be verified by someone other than the person who entered it'; end if;
  perform set_config('dvs.verifying', 'on', true);
  execute format('update public.%I set verified_at = now(), verified_by = auth.uid(), verified_by_name = public.current_staff_name(), verified_role = $2, verify_note = $3 where id = $1', p_table)
    using p_id, v_role, nullif(trim(coalesce(p_note, '')), '');
  insert into public.verification_log (table_name, row_id, action, note, done_by, done_by_name, done_role)
    values (p_table, p_id, 'verified', p_note, auth.uid(), public.current_staff_name(), v_role);
end $$;

-- Take a verification back so a mistake can be corrected (main admin only, reason required)
create or replace function public.unverify_transaction(p_table text, p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_rows integer;
begin
  if public.staff_role() <> 'admin' then raise exception 'Only the main admin can take a verification back'; end if;
  if p_table not in ('subscription_payments', 'income_entries', 'expense_entries') then raise exception 'Unknown table'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'Give the reason (at least 5 letters)'; end if;
  perform set_config('dvs.verifying', 'on', true);
  execute format('update public.%I set verified_at = null, verified_by = null, verified_by_name = null, verified_role = null, verify_note = null where id = $1 and verified_at is not null', p_table) using p_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then raise exception 'This transaction is not verified'; end if;
  insert into public.verification_log (table_name, row_id, action, note, done_by, done_by_name, done_role)
    values (p_table, p_id, 'unverified', p_reason, auth.uid(), public.current_staff_name(), 'admin');
end $$;

revoke all on function public.verify_transaction(text, uuid, text) from public, anon;
revoke all on function public.unverify_transaction(text, uuid, text) from public, anon;
grant execute on function public.verify_transaction(text, uuid, text) to authenticated;
grant execute on function public.unverify_transaction(text, uuid, text) to authenticated;

-- Lock: verification fields change only through the two functions above, and a verified
-- transaction cannot be edited or deleted.
create or replace function public.lock_verified_transaction()
returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('dvs.verifying', true), '') = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' then
    if old.verified_at is not null then raise exception 'This transaction is verified and cannot be deleted. The main admin must first take the verification back.'; end if;
    return old;
  end if;
  if (new.verified_at, new.verified_by, new.verified_by_name, new.verified_role, new.verify_note)
     is distinct from (old.verified_at, old.verified_by, old.verified_by_name, old.verified_role, old.verify_note) then
    raise exception 'Verification can only be given with the Verify button';
  end if;
  if old.verified_at is not null then raise exception 'This transaction is verified and cannot be changed. The main admin must first take the verification back.'; end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['subscription_payments', 'income_entries', 'expense_entries']
  loop
    execute format('drop trigger if exists lock_verified on public.%I', t);
    execute format('create trigger lock_verified before update or delete on public.%I for each row execute function public.lock_verified_transaction()', t);
  end loop;
end $$;

-- New rows always start unverified, whatever the form sends
create or replace function public.start_unverified()
returns trigger language plpgsql as $$
begin
  new.verified_at := null; new.verified_by := null; new.verified_by_name := null; new.verified_role := null; new.verify_note := null;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['subscription_payments', 'income_entries', 'expense_entries']
  loop
    execute format('drop trigger if exists start_unverified on public.%I', t);
    execute format('create trigger start_unverified before insert on public.%I for each row execute function public.start_unverified()', t);
  end loop;
end $$;

-- Donations: record who verified them when the status turns to "verified"
create or replace function public.stamp_donation_verifier()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status is distinct from 'verified') then
    new.verified_at := now(); new.verified_by := auth.uid(); new.verified_by_name := public.current_staff_name(); new.verified_role := public.staff_role();
  elsif new.status <> 'verified' then
    new.verified_at := null; new.verified_by := null; new.verified_by_name := null; new.verified_role := null;
  end if;
  return new;
end $$;
drop trigger if exists stamp_verifier on public.donations;
create trigger stamp_verifier before insert or update of status on public.donations for each row execute function public.stamp_donation_verifier();

-- ---------------------------------------------------------------------
-- 2. Prepared statements (report archive) and who receives them
-- ---------------------------------------------------------------------
create table if not exists public.finance_reports (
  id                uuid primary key default gen_random_uuid(),
  report_no         text not null,
  kind              text not null,
  title             text not null,
  period_start      date not null,
  period_end        date not null,
  verified_only     boolean not null default true,
  automatic         boolean not null default false,
  totals            jsonb not null default '[]'::jsonb,
  transaction_count integer not null default 0,
  pending_count     integer not null default 0,
  html              text not null,
  csv               text not null,
  prepared_by       uuid,
  prepared_by_name  text,
  sent_to           text[] not null default '{}',
  sent_at           timestamptz,
  created_at        timestamptz not null default now()
);
create unique index if not exists finance_reports_auto_key on public.finance_reports (kind, period_start, period_end) where automatic;
create index if not exists finance_reports_period_idx on public.finance_reports (period_end desc);
alter table public.finance_reports enable row level security;
drop policy if exists "finance_reports staff read" on public.finance_reports;
create policy "finance_reports staff read" on public.finance_reports for select to authenticated using (public.is_staff());
-- Written only by the finance-report Edge Function (server key); never edited by hand.

create table if not exists public.finance_report_recipients (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  name       text check (name is null or char_length(name) <= 100),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.finance_report_recipients enable row level security;
drop policy if exists "finance_report_recipients staff read" on public.finance_report_recipients;
create policy "finance_report_recipients staff read" on public.finance_report_recipients for select to authenticated using (public.is_staff());
drop policy if exists "finance_report_recipients admin write" on public.finance_report_recipients;
create policy "finance_report_recipients admin write" on public.finance_report_recipients for all to authenticated
  using (public.staff_role() in ('admin', 'accounts_admin')) with check (public.staff_role() in ('admin', 'accounts_admin'));

-- ---------------------------------------------------------------------
-- 3. Automatic statements — run ONCE, after deploying the finance-report function
--    (docs/FINANCE-REPORTS.md, step 4). Replace <PROJECT-REF> and <CRON-SECRET>.
--    Every day at 07:00 Bangladesh time (01:00 UTC) the function checks what is due:
--    on the 16th the fortnight 1–15; on the 1st the fortnight 16–end and the month
--    (and the quarter / half-year / financial year when one has just ended).
-- ---------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('dvs-finance-reports', '0 1 * * *', $cron$
--   select net.http_post(
--     url := 'https://<PROJECT-REF>.supabase.co/functions/v1/finance-report',
--     headers := '{"Content-Type": "application/json", "x-cron-secret": "<CRON-SECRET>"}'::jsonb,
--     body := '{"action": "scheduled"}'::jsonb
--   );
-- $cron$);
