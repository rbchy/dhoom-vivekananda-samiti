-- =====================================================================
-- Dhoom Vivekananda Samiti — STAFF ROLES AND APPROVALS
--
-- Roles (column admin_profiles.role):
--   admin           Main admin. Edits website content directly, approves the
--                   secretary's CONTENT requests, manages staff roles.
--                   Can VIEW accounts but not change them.
--   accounts_admin  Accounts admin. Edits donations, subscriptions, income,
--                   expenses and account heads directly (no approval needed),
--                   and approves the secretary's ACCOUNTS requests.
--   secretary       Sends add / edit / delete requests for content and
--                   accounts. Nothing changes until the right admin approves.
--
-- RUN AFTER security-hardening.sql.
-- Supabase Dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
-- Does not delete any data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Allowed roles
-- ---------------------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
    where con.conrelid = 'public.admin_profiles'::regclass
      and con.contype = 'c' and a.attname = 'role'
  loop
    execute format('alter table public.admin_profiles drop constraint %I', c.conname);
  end loop;
end $$;

-- one row per person (needed for role changes)
create unique index if not exists admin_profiles_user_id_key on public.admin_profiles (user_id);

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('admin', 'accounts_admin', 'secretary'));

-- ---------------------------------------------------------------------
-- 2. Role helper functions (used by the rules below)
-- ---------------------------------------------------------------------
create or replace function public.staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.admin_profiles where user_id = auth.uid();
$$;

create or replace function public.is_accounts_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() = 'accounts_admin', false);
$$;

create or replace function public.is_secretary()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() = 'secretary', false);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.staff_role() is not null;
$$;

-- is_temple_admin() (main admin only) stays exactly as before.

-- events, gallery, announcements and temple_content were set up in the dashboard
-- with rules that call is_admin(). Make it mean exactly "main admin", so the new
-- accounts admin and secretary roles can never write to those tables directly.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_temple_admin();
$$;

-- Which admin approves requests for a table? null = table not allowed.
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

-- ---------------------------------------------------------------------
-- 3. Accounts tables: main admin + secretary may READ,
--    only the accounts admin may WRITE directly.
--    (The public "send online donation / subscription" rules stay.)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['donations', 'subscriptions', 'subscription_payments',
                           'income_entries', 'expense_entries', 'account_heads']
  loop
    execute format('drop policy if exists %I on public.%I', t || ' admin all', t);
    execute format('drop policy if exists %I on public.%I', t || ' staff read', t);
    execute format('drop policy if exists %I on public.%I', t || ' accounts write', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_staff())',
      t || ' staff read', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_accounts_admin()) with check (public.is_accounts_admin())',
      t || ' accounts write', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Content tables: the secretary may READ everything (also unpublished
--    drafts) so they can prepare changes. Writing stays main-admin only.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['events', 'gallery', 'announcements', 'worship_schedule',
                           'temple_highlights', 'temple_content', 'committee_contacts',
                           'event_catalog', 'smriti_stambha']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists %I on public.%I', t || ' staff read', t);
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_staff())',
        t || ' staff read', t);
    end if;
  end loop;
end $$;

-- Secretary may upload photos (for gallery / event requests), not delete them.
drop policy if exists "temple photos secretary upload" on storage.objects;
create policy "temple photos secretary upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-photos' and public.is_secretary());

-- ---------------------------------------------------------------------
-- 5. Change requests
-- ---------------------------------------------------------------------
create table if not exists public.pending_changes (
  id            uuid primary key default gen_random_uuid(),
  table_name    text not null,
  action        text not null check (action in ('insert', 'update', 'delete', 'upsert')),
  row_key       text not null default 'id',   -- column that identifies the row
  row_id        text,                         -- value of that column (update / delete / upsert)
  new_data      jsonb,
  old_data      jsonb,
  summary       text check (summary is null or char_length(summary) <= 200),
  approver_role text not null,
  requested_by  uuid not null default auth.uid(),
  requested_at  timestamptz not null default now(),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  review_note   text check (review_note is null or char_length(review_note) <= 500)
);
create index if not exists pending_changes_status_idx on public.pending_changes (status, approver_role, requested_at);

-- Fill in / check every new request on the server (cannot be faked by the browser).
create or replace function public.pending_changes_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old jsonb;
begin
  new.approver_role := public.change_approver(new.table_name);
  if new.approver_role is null then
    raise exception 'Changes to table % cannot be requested', new.table_name;
  end if;
  if new.row_key not in ('id', 'key') then
    raise exception 'Invalid row key';
  end if;
  if new.action in ('update', 'delete') and new.row_id is null then
    raise exception 'row_id is required for %', new.action;
  end if;
  if new.action in ('insert', 'update', 'upsert') and (new.new_data is null or jsonb_typeof(new.new_data) <> 'object') then
    raise exception 'new_data must be a JSON object';
  end if;

  new.requested_by := auth.uid();
  new.requested_at := now();
  new.status       := 'pending';
  new.reviewed_by  := null;
  new.reviewed_at  := null;
  new.review_note  := null;

  if new.action = 'upsert' then
    new.row_id := coalesce(new.row_id, new.new_data ->> new.row_key);
  end if;

  if new.row_id is not null then
    execute format('select to_jsonb(t) from public.%I t where t.%I::text = $1', new.table_name, new.row_key)
      into v_old using new.row_id;
    new.old_data := v_old;
  else
    new.old_data := null;
  end if;
  return new;
end $$;

drop trigger if exists pending_changes_before_insert on public.pending_changes;
create trigger pending_changes_before_insert
  before insert on public.pending_changes
  for each row execute function public.pending_changes_before_insert();

alter table public.pending_changes enable row level security;

drop policy if exists "pending_changes secretary send" on public.pending_changes;
create policy "pending_changes secretary send" on public.pending_changes
  for insert to authenticated
  with check (public.is_secretary() and public.change_approver(table_name) is not null);

drop policy if exists "pending_changes read" on public.pending_changes;
create policy "pending_changes read" on public.pending_changes
  for select to authenticated
  using (requested_by = auth.uid() or approver_role = public.staff_role());

-- No update / delete rules: status changes only through the functions below.
revoke update, delete on public.pending_changes from anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Approve / reject / cancel
-- ---------------------------------------------------------------------
create or replace function public.apply_change(p public.pending_changes)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_cols text;
  v_set  text;
  v_n    int;
begin
  -- only real columns of the target table; never let a request change the key on update
  select string_agg(quote_ident(a.attname), ', ' order by a.attnum)
    into v_cols
  from pg_attribute a
  where a.attrelid = format('public.%I', p.table_name)::regclass
    and a.attnum > 0 and not a.attisdropped
    and p.new_data ? a.attname
    and not (p.action = 'update' and a.attname = p.row_key);

  if p.action = 'delete' then
    execute format('delete from public.%I where %I::text = $1', p.table_name, p.row_key) using p.row_id;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'The row no longer exists'; end if;

  elsif v_cols is null then
    raise exception 'The request has no valid fields';

  elsif p.action = 'insert' then
    execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1)',
                   p.table_name, v_cols) using p.new_data;

  elsif p.action = 'update' then
    execute format('update public.%1$I set (%2$s) = (select %2$s from jsonb_populate_record(null::public.%1$I, $1)) where %3$I::text = $2',
                   p.table_name, v_cols, p.row_key) using p.new_data, p.row_id;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'The row no longer exists'; end if;

  elsif p.action = 'upsert' then
    select string_agg(format('%1$s = excluded.%1$s', c), ', ')
      into v_set
    from unnest(string_to_array(v_cols, ', ')) c
    where c <> quote_ident(p.row_key);
    execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1) on conflict (%3$I) do %4$s',
                   p.table_name, v_cols, p.row_key,
                   case when v_set is null then 'nothing' else 'update set ' || v_set end)
      using p.new_data;
  end if;
end $$;

revoke all on function public.apply_change(public.pending_changes) from public, anon, authenticated;

create or replace function public.approve_change(p_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare p public.pending_changes;
begin
  select * into p from public.pending_changes where id = p_id for update;
  if not found then raise exception 'Request not found'; end if;
  if p.status <> 'pending' then raise exception 'This request is already %', p.status; end if;
  if public.staff_role() is distinct from p.approver_role then
    raise exception 'Only the % can approve this request', replace(p.approver_role, '_', ' ');
  end if;
  if p.requested_by = auth.uid() then
    raise exception 'You cannot approve your own request';
  end if;

  perform public.apply_change(p);

  update public.pending_changes
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
   where id = p_id;
end $$;

create or replace function public.reject_change(p_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare p public.pending_changes;
begin
  select * into p from public.pending_changes where id = p_id for update;
  if not found then raise exception 'Request not found'; end if;
  if p.status <> 'pending' then raise exception 'This request is already %', p.status; end if;
  if public.staff_role() is distinct from p.approver_role then
    raise exception 'Only the % can reject this request', replace(p.approver_role, '_', ' ');
  end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'Please write a reason'; end if;

  update public.pending_changes
     set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
   where id = p_id;
end $$;

create or replace function public.cancel_change(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.pending_changes
     set status = 'cancelled', reviewed_at = now()
   where id = p_id and requested_by = auth.uid() and status = 'pending';
  if not found then raise exception 'Only your own pending requests can be cancelled'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 7. Staff list and role changes (main admin only, from the dashboard)
--    A person must first have a login: Supabase → Authentication → Add user.
-- ---------------------------------------------------------------------
create or replace function public.list_staff()
returns table (user_id uuid, email text, role text, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_temple_admin() then raise exception 'Main admin only'; end if;
  return query
    select u.id, u.email::text, ap.role, u.last_sign_in_at
    from auth.users u
    left join public.admin_profiles ap on ap.user_id = u.id
    order by ap.role nulls last, u.email;
end $$;

-- p_role = 'admin' | 'accounts_admin' | 'secretary' | null (remove access)
create or replace function public.set_staff_role(p_email text, p_role text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid;
begin
  if not public.is_temple_admin() then raise exception 'Main admin only'; end if;
  if p_role is not null and p_role not in ('admin', 'accounts_admin', 'secretary') then
    raise exception 'Unknown role %', p_role;
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No login found for %. Add the user first in Supabase → Authentication.', p_email;
  end if;
  if v_user = auth.uid() and coalesce(p_role, '') <> 'admin' then
    raise exception 'You cannot remove your own main-admin access';
  end if;

  if p_role is null then
    delete from public.admin_profiles where user_id = v_user;
  else
    insert into public.admin_profiles (user_id, role) values (v_user, p_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
end $$;


-- E-mail addresses of staff members (so request lists can show who asked / approved)
create or replace function public.staff_emails()
returns table (user_id uuid, email text, role text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_staff() then raise exception 'Staff only'; end if;
  return query
    select ap.user_id, u.email::text, ap.role
    from public.admin_profiles ap join auth.users u on u.id = ap.user_id;
end $$;

revoke all on function public.approve_change(uuid, text), public.staff_emails(), public.reject_change(uuid, text),
  public.cancel_change(uuid), public.list_staff(), public.set_staff_role(text, text) from public, anon;
grant execute on function public.approve_change(uuid, text), public.staff_emails(), public.reject_change(uuid, text),
  public.cancel_change(uuid), public.list_staff(), public.set_staff_role(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Check: current staff and their roles
-- ---------------------------------------------------------------------
select u.email, ap.role
from public.admin_profiles ap join auth.users u on u.id = ap.user_id
order by ap.role, u.email;
