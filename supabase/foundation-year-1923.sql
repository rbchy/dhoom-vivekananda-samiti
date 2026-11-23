-- Foundation year of Dhoom Vivekananda Samiti: 1922 → 1923
-- The founders' tributes (Smriti Stambha) and the Samiti's own Bhavadhara entry are stored in the database,
-- so changing the website code alone does not change them.
-- Run once in Supabase → SQL Editor. Safe to run again (it only changes text that still says 1922).

begin;

-- 1. Smriti Stambha: the founders of 1923 (ids start with d1922000- — the id stays the same)
update public.smriti_stambha
set tribute_en = replace(tribute_en, '1922', '1923'),
    tribute_bn = replace(tribute_bn, '১৯২২', '১৯২৩')
where id::text like 'd1922000-%'
  and (tribute_en like '%1922%' or tribute_bn like '%১৯২২%');

-- 2. Bhavadhara directory: the Samiti's own entry
update public.bhavadhara_orgs
set founded_year = 1923,
    about_en = replace(about_en, '1922', '1923'),
    about_bn = replace(about_bn, '১৯২২', '১৯২৩')
where id = 'd1922000-0000-4000-8000-0000000000aa';

commit;

-- 3. Check: any other text in the database that still says 1922 (for example a post or a page written in the
--    admin dashboard). Change those by hand in the admin dashboard, or tell Claude what they are.
create temp table still_1922 (table_name text, column_name text, rows_found integer);
do $$
declare
  col record;
  found integer;
begin
  for col in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
      and c.data_type in ('text', 'character varying')
  loop
    execute format('select count(*) from public.%I where %I like %L or %I like %L',
      col.table_name, col.column_name, '%1922%', col.column_name, '%১৯২২%') into found;
    if found > 0 then
      insert into still_1922 values (col.table_name, col.column_name, found);
    end if;
  end loop;
end $$;
select * from still_1922 order by table_name, column_name;  -- empty result = nothing left to change
