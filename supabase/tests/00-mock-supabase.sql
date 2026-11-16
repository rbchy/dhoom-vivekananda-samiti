-- =====================================================================
-- CI ONLY — a tiny imitation of Supabase (auth, storage, roles) plus the
-- tables that were created in the Supabase dashboard, so every SQL file in
-- supabase/ can be tested in a plain PostgreSQL. NEVER run this in Supabase.
-- =====================================================================
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema storage;
grant usage on schema public, auth, storage to anon, authenticated;

create table auth.users (id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;

create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant all on storage.objects to anon, authenticated;

-- Tables made in the dashboard (shapes taken from the website code)
create table public.admin_profiles (user_id uuid references auth.users, role text check (role = 'admin'));
create table public.events (id uuid primary key default gen_random_uuid(), title_en text, title_bn text, description_en text, description_bn text,
  event_date date, image_url text, is_published boolean default false, opens_at time, puja_starts_at time, closes_at time, location text,
  created_at timestamptz default now());
create table public.gallery (id uuid primary key default gen_random_uuid(), title_en text, title_bn text, image_url text,
  description_en text, description_bn text, is_published boolean default false, category text, created_at timestamptz default now());
create table public.announcements (id uuid primary key default gen_random_uuid(), title_en text, title_bn text, message_en text,
  message_bn text, is_published boolean default false, created_at timestamptz default now());
create table public.temple_content (id uuid primary key default gen_random_uuid(), slug text unique, title_en text, title_bn text,
  body_en text, body_bn text, is_published boolean default true, updated_at timestamptz);

-- The dashboard rules call is_admin(); the live version was not in the repo,
-- so this mock uses the RISKY form (any admin_profiles row) to prove the fix works.
create function public.is_admin() returns boolean language plpgsql stable as
  $$ begin return exists (select 1 from public.admin_profiles where user_id = auth.uid()); end $$;

do $$
declare t text;
begin
  foreach t in array array['events', 'gallery', 'announcements', 'temple_content'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', 'Admins manage ' || t, t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_published = true or (select public.is_admin()))', 'Public can read published ' || t, t);
  end loop;
end $$;

alter default privileges in schema public grant all on tables to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'main@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'accounts@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'secretary@example.com'),
  ('00000000-0000-0000-0000-00000000000d', 'nobody@example.com');
insert into public.admin_profiles values ('00000000-0000-0000-0000-00000000000a', 'admin');
