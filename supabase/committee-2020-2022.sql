-- Executive Committee (কার্যকরী কমিটি) of Dhoom Vivekananda Samiti, term 2020 – 2022,
-- from the stamped list signed by the President and the Secretary (15 members).
-- It is entered as an earlier committee; if no current committee exists yet, the
-- /committee page opens this one automatically. To show it as the current committee,
-- tick "Current committee" for each person in Admin → Officials.
-- Phone numbers are left empty on purpose: the website shows any phone number publicly.
-- Run once in Supabase → SQL Editor. Safe to run again (it updates the same rows).

begin;

-- Two positions this list needs: Assistant Secretary and Publicity Secretary
alter table public.samiti_officials drop constraint if exists samiti_officials_position_check;
alter table public.samiti_officials add constraint samiti_officials_position_check
  check (position in ('patron', 'advisor', 'president', 'vice_president', 'general_secretary', 'joint_secretary',
                      'assistant_secretary', 'organising_secretary', 'treasurer', 'office_secretary', 'cultural_secretary',
                      'publicity_secretary', 'member', 'other'));

insert into public.samiti_officials (id, name_en, name_bn, position, role_en, role_bn, term, is_current, about_en, about_bn, sort_order, is_published) values
  ('c2020000-0000-4000-8000-000000000001', $q$Prof. Dulal Chandra Nath$q$, $q$অধ্যাপক দুলাল চন্দ্র নাথ$q$, 'president', $q$President$q$, $q$সভাপতি$q$, '2020 – 2022', false, $q$Son of the late Dwarika Mohan Nath$q$, $q$পিতা: মৃত দ্বারিকা মোহন নাথ$q$, 10, true),
  ('c2020000-0000-4000-8000-000000000002', $q$Uttam Kumar Nath$q$, $q$উত্তম কুমার নাথ$q$, 'vice_president', $q$Senior Vice President$q$, $q$সিনিয়র সহ-সভাপতি$q$, '2020 – 2022', false, $q$Son of the late Kiron Chandra Nath$q$, $q$পিতা: মৃত কিরণ চন্দ্র নাথ$q$, 18, true),
  ('c2020000-0000-4000-8000-000000000003', $q$Nepal Acharya$q$, $q$নেপাল আচার্য্য$q$, 'vice_president', $q$Vice President$q$, $q$সহ-সভাপতি$q$, '2020 – 2022', false, $q$Son of the late Rebati Mohan Acharya$q$, $q$পিতা: মৃত রেবতী মোহন আচার্য্য$q$, 20, true),
  ('c2020000-0000-4000-8000-000000000004', $q$Ratan Ghosh$q$, $q$রতন ঘোষ$q$, 'general_secretary', $q$General Secretary$q$, $q$সাধারণ সম্পাদক$q$, '2020 – 2022', false, $q$Son of the late Santosh Chandra Ghosh$q$, $q$পিতা: মৃত সন্তোষ চন্দ্র ঘোষ$q$, 30, true),
  ('c2020000-0000-4000-8000-000000000005', $q$Suman Chandra Acharya$q$, $q$সুমন চন্দ্র আচার্য্য$q$, 'joint_secretary', $q$Joint Secretary$q$, $q$যুগ্ম সম্পাদক$q$, '2020 – 2022', false, $q$Son of the late Santosh Acharya$q$, $q$পিতা: মৃত সন্তোষ আচার্য্য$q$, 40, true),
  ('c2020000-0000-4000-8000-000000000006', $q$Dipak Kumar Nath$q$, $q$দীপক কুমার নাথ$q$, 'assistant_secretary', $q$Assistant Secretary$q$, $q$সহ-সম্পাদক$q$, '2020 – 2022', false, $q$Son of the late Dhirendra Kumar Nath$q$, $q$পিতা: মৃত ধীরেন্দ্র কুমার নাথ$q$, 42, true),
  ('c2020000-0000-4000-8000-000000000007', $q$Binod Bandhu Nath$q$, $q$বিনোদ বন্ধু নাথ$q$, 'treasurer', $q$Treasurer$q$, $q$কোষাধ্যক্ষ$q$, '2020 – 2022', false, $q$Son of the late Rajani Kanta Nath$q$, $q$পিতা: মৃত রজনী কান্ত নাথ$q$, 50, true),
  ('c2020000-0000-4000-8000-000000000008', $q$Mithun Deb Nath$q$, $q$মিঠুন দেব নাথ$q$, 'organising_secretary', $q$Organising Secretary$q$, $q$সাংগঠনিক সম্পাদক$q$, '2020 – 2022', false, $q$Son of Karuna Ranjan Nath$q$, $q$পিতা: করুণা রঞ্জন নাথ$q$, 45, true),
  ('c2020000-0000-4000-8000-000000000009', $q$Sanjoy Acharya$q$, $q$সঞ্জয় আচার্য্য$q$, 'cultural_secretary', $q$Literary and Cultural Secretary$q$, $q$সাহিত্য ও সাংস্কৃতিক সম্পাদক$q$, '2020 – 2022', false, $q$Son of Nepal Acharya$q$, $q$পিতা: নেপাল আচার্য্য$q$, 65, true),
  ('c2020000-0000-4000-8000-000000000010', $q$Nantu Acharya$q$, $q$নান্টু আচার্য্য$q$, 'publicity_secretary', $q$Publicity Secretary$q$, $q$প্রচার সম্পাদক$q$, '2020 – 2022', false, $q$Son of Anil Acharya$q$, $q$পিতা: অনিল আচার্য্য$q$, 67, true),
  ('c2020000-0000-4000-8000-000000000011', $q$Narayan Chandra Nath$q$, $q$নারায়ণ চন্দ্র নাথ$q$, 'member', $q$Executive Member$q$, $q$কার্যকরী সদস্য$q$, '2020 – 2022', false, $q$Son of the late Gyanada Nath$q$, $q$পিতা: মৃত জ্ঞানদা নাথ$q$, 101, true),
  ('c2020000-0000-4000-8000-000000000012', $q$Karuna Ranjan Nath$q$, $q$করুণা রঞ্জন নাথ$q$, 'member', $q$Executive Member$q$, $q$কার্যকরী সদস্য$q$, '2020 – 2022', false, $q$Son of the late Chandra Kanta Nath$q$, $q$পিতা: মৃত চন্দ্র কান্ত নাথ$q$, 102, true),
  ('c2020000-0000-4000-8000-000000000013', $q$Maranjit Acharya$q$, $q$মরণজিৎ আচার্য্য$q$, 'member', $q$Executive Member$q$, $q$কার্যকরী সদস্য$q$, '2020 – 2022', false, $q$Son of the late Anil Acharya$q$, $q$পিতা: মৃত অনিল আচার্য্য$q$, 103, true),
  ('c2020000-0000-4000-8000-000000000014', $q$Anil Acharya$q$, $q$অনিল আচার্য্য$q$, 'member', $q$Executive Member$q$, $q$কার্যকরী সদস্য$q$, '2020 – 2022', false, $q$Son of the late Shyamacharan Acharya$q$, $q$পিতা: মৃত শ্যামাচরণ আচার্য্য$q$, 104, true),
  ('c2020000-0000-4000-8000-000000000015', $q$Ripon Acharya$q$, $q$রিপন আচার্য্য$q$, 'member', $q$Executive Member$q$, $q$কার্যকরী সদস্য$q$, '2020 – 2022', false, $q$Son of the late Sudhir Acharya$q$, $q$পিতা: মৃত সুধীর আচার্য্য$q$, 105, true)
on conflict (id) do update set
  name_en = excluded.name_en, name_bn = excluded.name_bn, position = excluded.position,
  role_en = excluded.role_en, role_bn = excluded.role_bn, term = excluded.term,
  about_en = excluded.about_en, about_bn = excluded.about_bn, sort_order = excluded.sort_order;

commit;
