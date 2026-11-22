-- Holy Visits (পুণ্য আগমন): the twelve revered visitors of the Samiti.
-- Dates are not known yet, so the visit date is now optional. Add the date, places,
-- words and photos later from Admin → Holy Visits.
-- Run once in Supabase → SQL Editor. Safe to run again (it updates the same rows).

begin;

alter table public.maharaj_visits alter column visit_date drop not null;

insert into public.maharaj_visits (id, monk_name_en, monk_name_bn, monk_title_en, monk_title_bn, visit_date, places, sort_order, is_published) values
  ('b1a00000-0000-4000-8000-000000000001', $q$Swami Shambhudananda Maharaj$q$, $q$শ্রীমৎ স্বামী শম্ভুদানন্দ মহারাজ$q$, $q$Belur Math$q$, $q$বেলুড় মঠ$q$, null, '{}', 10, true),
  ('b1a00000-0000-4000-8000-000000000002', $q$Swami Umananda Maharaj$q$, $q$শ্রীমৎ স্বামী উমানন্দ মহারাজ$q$, $q$Belur Math$q$, $q$বেলুড় মঠ$q$, null, '{}', 20, true),
  ('b1a00000-0000-4000-8000-000000000003', $q$Swami Aksharananda Maharaj$q$, $q$শ্রীমৎ স্বামী অক্ষরানন্দ মহারাজ$q$, $q$Belur Math$q$, $q$বেলুড় মঠ$q$, null, '{}', 30, true),
  ('b1a00000-0000-4000-8000-000000000004', $q$Swami Sarveshwarananda Maharaj$q$, $q$শ্রীমৎ স্বামী সর্বেশ্বরানন্দ মহারাজ$q$, null, null, null, '{}', 40, true),
  ('b1a00000-0000-4000-8000-000000000005', $q$Swami Paradevananda Maharaj$q$, $q$শ্রীমৎ স্বামী পরদেবানন্দ মহারাজ$q$, null, null, null, '{}', 50, true),
  ('b1a00000-0000-4000-8000-000000000006', $q$Swami Yogananda Maharaj$q$, $q$শ্রীমৎ স্বামী যোগানন্দ মহারাজ$q$, null, null, null, '{}', 60, true),
  ('b1a00000-0000-4000-8000-000000000007', $q$Swami Sthiratmananda Maharaj$q$, $q$শ্রীমৎ স্বামী স্থিরাত্মানন্দ মহারাজ$q$, null, null, null, '{}', 70, true),
  ('b1a00000-0000-4000-8000-000000000008', $q$Swami Shaktinathananda Maharaj$q$, $q$শ্রীমৎ স্বামী শক্তিনাথানন্দ মহারাজ$q$, $q$Adhyaksha, Ramakrishna Mission Sevashram, Chattogram$q$, $q$অধ্যক্ষ, চট্টগ্রাম রামকৃষ্ণ মিশন সেবাশ্রম$q$, null, '{}', 80, true),
  ('b1a00000-0000-4000-8000-000000000009', $q$Swami Purnabratananda Maharaj$q$, $q$শ্রীমৎ স্বামী পূর্ণব্রতানন্দ মহারাজ$q$, $q$Superintendent, Fatehabad Ramakrishna Sevashram$q$, $q$তত্ত্বাবধায়ক, ফতেয়াবাদ রামকৃষ্ণ সেবাশ্রম$q$, null, '{}', 90, true),
  ('b1a00000-0000-4000-8000-000000000010', $q$Swami Gourananda Maharaj$q$, $q$শ্রীমৎ স্বামী গৌরানন্দ মহারাজ$q$, null, null, null, '{}', 100, true),
  ('b1a00000-0000-4000-8000-000000000011', $q$Swami Subananda Maharaj$q$, $q$শ্রীমৎ স্বামী সুবানন্দ মহারাজ$q$, $q$Belur Math$q$, $q$বেলুড় মঠ$q$, null, '{}', 110, true),
  ('b1a00000-0000-4000-8000-000000000012', $q$Sri Rashmohan Chakraborty$q$, $q$শ্রী রাশমোহন চক্রবর্তী$q$, $q$Sadhak and Guru, Cumilla$q$, $q$সাধক ও গুরু, কুমিল্লা$q$, null, '{}', 120, true)
on conflict (id) do update set
  monk_name_en = excluded.monk_name_en, monk_name_bn = excluded.monk_name_bn,
  monk_title_en = excluded.monk_title_en, monk_title_bn = excluded.monk_title_bn,
  sort_order = excluded.sort_order;

commit;
