-- =====================================================================
-- Dhoom Vivekananda Samiti — photos for each organisation / temple
-- RUN ONCE in Supabase → SQL Editor (after site-extras-schema.sql).
-- Safe to run again.
--
-- Adds an "organisation" column to the gallery table.
--   null            = photo of the Samiti in general
--   'dakshin-kalika' = Sree Sree Dokkhin Kalika Mandir
--   'durga'          = Sree Sree Durga Mandir
--   'clinic'         = Dhoom Vivekananda Samiti Community Clinic
--   'shiv'           = Sree Sree Shiv Mandir
--   'ramakrishna'    = Sree Sree Ramakrishna Mandir
--   'gourishankar'   = Sree Sree GouriShankar Funeral Temple
-- The same ids are listed in src/i18n-org.js — keep both lists the same.
-- =====================================================================

alter table public.gallery add column if not exists organisation text;

alter table public.gallery drop constraint if exists gallery_organisation_check;
alter table public.gallery add constraint gallery_organisation_check
  check (organisation is null or organisation in ('dakshin-kalika', 'durga', 'clinic', 'shiv', 'ramakrishna', 'gourishankar'));

-- Faster filtering by organisation on the website and in Admin
create index if not exists gallery_organisation_idx on public.gallery (organisation, created_at desc);

-- Gallery "category" also gets 'clinic' (health camps, clinic service photos)
alter table public.gallery drop constraint if exists gallery_category_check;
alter table public.gallery add constraint gallery_category_check
  check (category in ('festivals', 'worship', 'community', 'temple', 'clinic'));

-- Optional: existing temple photos belonged to the Ramakrishna Mandir.
-- Remove the two dashes below and run this line if you want to move them there.
-- update public.gallery set organisation = 'ramakrishna' where organisation is null;
