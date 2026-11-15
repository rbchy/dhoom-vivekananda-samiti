-- =====================================================================
-- Run ONLY if uploading a Gallery or Deity photo says "not allowed / policy".
-- Lets temple admins upload and delete photos in the "event-photos" bucket
-- (the same bucket the Events form uses), and everyone view them.
-- Supabase → SQL Editor → paste → Run. Safe to run more than once.
-- =====================================================================
insert into storage.buckets (id, name, public) values ('event-photos', 'event-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "temple photos public read" on storage.objects;
create policy "temple photos public read" on storage.objects
  for select using (bucket_id = 'event-photos');

drop policy if exists "temple photos admin upload" on storage.objects;
create policy "temple photos admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-photos' and public.is_temple_admin());

drop policy if exists "temple photos admin update" on storage.objects;
create policy "temple photos admin update" on storage.objects
  for update to authenticated using (bucket_id = 'event-photos' and public.is_temple_admin());

drop policy if exists "temple photos admin delete" on storage.objects;
create policy "temple photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'event-photos' and public.is_temple_admin());
