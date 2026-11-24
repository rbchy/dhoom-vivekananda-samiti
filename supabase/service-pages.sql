-- =====================================================================
-- Dhoom Vivekananda Samiti — photos for the service-work pages
--   /service/clothes  (Annual Clothes Distribution / বার্ষিক বস্ত্র বিতরণ)
--   /service/gita     (Gita Learning Centre / শিশুদের জন্য গীতা শিক্ষা কেন্দ্র)
-- Lets Admin → Gallery put a photo under these two pages, the same way as
-- under a temple. Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
alter table public.gallery drop constraint if exists gallery_organisation_check;
alter table public.gallery add constraint gallery_organisation_check
  check (organisation is null or organisation in ('dakshin-kalika', 'durga', 'clinic', 'shiv', 'ramakrishna', 'gourishankar', 'clothes', 'gita'));

-- A gallery category for service work
alter table public.gallery drop constraint if exists gallery_category_check;
alter table public.gallery add constraint gallery_category_check
  check (category in ('festivals', 'worship', 'community', 'temple', 'clinic', 'seva'));
