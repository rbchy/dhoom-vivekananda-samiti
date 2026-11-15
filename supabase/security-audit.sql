-- =====================================================================
-- Dhoom Vivekananda Samiti — SECURITY AUDIT (read-only, changes nothing)
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query →
-- paste this whole file → Run. Copy ALL result rows and share them.
-- =====================================================================

-- 1. Every table in "public": is Row Level Security ON, and how many policies?
--    Any row with rls_enabled = false is a problem (anyone can read/write it).
select
  c.relname                         as table_name,
  c.relrowsecurity                  as rls_enabled,
  count(p.policyname)               as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;

-- 2. Every policy in "public" — especially the tables NOT created by the
--    project's SQL files: admin_profiles, events, gallery, announcements,
--    temple_content. Look for INSERT/UPDATE/DELETE/ALL allowed to anon or
--    "true" without is_temple_admin().
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3. Who is an admin? (should list ONLY committee-approved people)
select ap.user_id, u.email, ap.role, u.created_at, u.last_sign_in_at
from public.admin_profiles ap
left join auth.users u on u.id = ap.user_id
order by u.created_at;

-- 4. All login accounts. Any account you do not recognise = signup is open.
select id, email, created_at, last_sign_in_at
from auth.users
order by created_at;

-- 5. Photo storage bucket settings (size / file-type limits).
select id, public, file_size_limit, allowed_mime_types
from storage.buckets;
