-- Smriti Stambha: the 31 names of the memorial list (smriti smarak), as written in the Samiti's diary
-- (pages of 22–23 February 2016), in the diary's order.
-- Run once in Supabase → SQL Editor. Safe to run again (it updates the same rows).
--
-- Kept as they are: the five founders of 1923 already on the Stambha, with their tributes.
-- Five names of the list are already on the Stambha and are not added a second time
-- (confirmed by the Samiti, Nov 2026):
--   no. 1  Chitta Ranjan Dutta     = Dr. Chittaharan Dutta       (d1922000-…-000000000001)
--   no. 2  Dhirendra Kumar Dutta   = founder listed as Dhirendra Chandra Dutta (…-000000000004) — name corrected below
--   no. 13 Bipin Acharya           = listed as Dr. Bipin Dutta   (…-000000000005) — name corrected below
--   no. 14 Rohini Kumar Acharya    (…-000000000002)
--   no. 28 Jagabandhu Nath         (…-000000000003)
-- The other 26 are added after the founders (sort_order 201–231 = diary no. 1–31).

begin;

-- Correct two names already on the Stambha (name and the same name inside the tribute)
update public.smriti_stambha
set name_en = 'Sri Dhirendra Kumar Dutta', name_bn = 'শ্রী ধীরেন্দ্র কুমার দত্ত',
    tribute_en = replace(tribute_en, 'Dhirendra Chandra Dutta', 'Dhirendra Kumar Dutta'),
    tribute_bn = replace(tribute_bn, 'ধীরেন্দ্র চন্দ্র দত্ত', 'ধীরেন্দ্র কুমার দত্ত')
where id = 'd1922000-0000-4000-8000-000000000004';

update public.smriti_stambha
set name_en = 'Dr. Bipin Acharya', name_bn = 'ডা. বিপিন আচার্য',
    tribute_en = replace(tribute_en, 'Bipin Dutta', 'Bipin Acharya'),
    tribute_bn = replace(tribute_bn, 'বিপিন দত্ত', 'বিপিন আচার্য')
where id = 'd1922000-0000-4000-8000-000000000005';

insert into public.smriti_stambha (id, name_en, name_bn, role_en, role_bn, is_late, sort_order) values
  ('d2016000-0000-4000-8000-000000000003', $q$Sri Nripendra Kumar Dutta$q$, $q$শ্রী নৃপেন্দ্র কুমার দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 203),
  ('d2016000-0000-4000-8000-000000000004', $q$Sri Noni Gopal Dutta$q$, $q$শ্রী ননী গোপাল দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 204),
  ('d2016000-0000-4000-8000-000000000005', $q$Sri Nobo Gopal Dutta$q$, $q$শ্রী নব গোপাল দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 205),
  ('d2016000-0000-4000-8000-000000000006', $q$Sri Promod Gopal Dutta$q$, $q$শ্রী প্রমোদ গোপাল দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 206),
  ('d2016000-0000-4000-8000-000000000007', $q$Sri Nitya Gopal Dutta$q$, $q$শ্রী নিত্য গোপাল দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 207),
  ('d2016000-0000-4000-8000-000000000008', $q$Sri Dwija Gopal Dutta$q$, $q$শ্রী দ্বিজ গোপাল দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 208),
  ('d2016000-0000-4000-8000-000000000009', $q$Sri Malay Kar Chowdhury$q$, $q$শ্রী মলয় কর চৌধুরী$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 209),
  ('d2016000-0000-4000-8000-000000000010', $q$Sri Mukul Kar Chowdhury$q$, $q$শ্রী মুকুল কর চৌধুরী$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 210),
  ('d2016000-0000-4000-8000-000000000011', $q$Sri Parijat Dutta$q$, $q$শ্রী পারিজাত দত্ত$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 211),
  ('d2016000-0000-4000-8000-000000000012', $q$Sri Akshay Kumar Acharya$q$, $q$শ্রী অক্ষয় কুমার আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 212),
  ('d2016000-0000-4000-8000-000000000015', $q$Sri Phanibhushan Acharya$q$, $q$শ্রী ফণিভূষণ আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 215),
  ('d2016000-0000-4000-8000-000000000016', $q$Sri Dhirendra Kumar Acharya$q$, $q$শ্রী ধীরেন্দ্র কুমার আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 216),
  ('d2016000-0000-4000-8000-000000000017', $q$Sri Rebati Acharya$q$, $q$শ্রী রেবতী আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 217),
  ('d2016000-0000-4000-8000-000000000018', $q$Sri Balai Acharya$q$, $q$শ্রী বলাই আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 218),
  ('d2016000-0000-4000-8000-000000000019', $q$Sri Shambhucharan Acharya$q$, $q$শ্রী শম্ভুচরণ আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 219),
  ('d2016000-0000-4000-8000-000000000020', $q$Sri Anil Acharya$q$, $q$শ্রী অনিল আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 220),
  ('d2016000-0000-4000-8000-000000000021', $q$Sri Dhanaranjan Acharya$q$, $q$শ্রী ধনারঞ্জন আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 221),
  ('d2016000-0000-4000-8000-000000000022', $q$Sri Manoranjan Acharya$q$, $q$শ্রী মনোরঞ্জন আচার্য$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 222),
  ('d2016000-0000-4000-8000-000000000023', $q$Sri Gyanada Nath$q$, $q$শ্রী জ্ঞানদা নাথ$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 223),
  ('d2016000-0000-4000-8000-000000000024', $q$Sri Dhirendra Nath$q$, $q$শ্রী ধীরেন্দ্র নাথ$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 224),
  ('d2016000-0000-4000-8000-000000000025', $q$Sri Kiran Nath$q$, $q$শ্রী কিরণ নাথ$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 225),
  ('d2016000-0000-4000-8000-000000000026', $q$Sri Birendra Nath$q$, $q$শ্রী বীরেন্দ্র নাথ$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 226),
  ('d2016000-0000-4000-8000-000000000027', $q$Sri Rajani Kanta Bhowmik$q$, $q$শ্রী রজনী কান্ত ভৌমিক$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 227),
  ('d2016000-0000-4000-8000-000000000029', $q$Sri Chandra Kanta Nath$q$, $q$শ্রী চন্দ্র কান্ত নাথ$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 229),
  ('d2016000-0000-4000-8000-000000000030', $q$Sri Debendra Pal$q$, $q$শ্রী দেবেন্দ্র পাল$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 230),
  ('d2016000-0000-4000-8000-000000000031', $q$Sri Jamini Pal$q$, $q$শ্রী যামিনী পাল$q$, $q$Memorial Member$q$, $q$স্মরণীয় সদস্য$q$, true, 231)
on conflict (id) do update set
  name_en = excluded.name_en, name_bn = excluded.name_bn, role_en = excluded.role_en, role_bn = excluded.role_bn,
  is_late = excluded.is_late, sort_order = excluded.sort_order, is_published = true;

commit;

-- Check: should list 26 names (with the 5 already there, 31 on the Stambha)
select sort_order, name_bn from public.smriti_stambha where id::text like 'd2016000-%' order by sort_order;
