-- =====================================================================
-- TEST DATA — 10 sample rows in each table, for trying the website.
-- Run AFTER the three schema files. Safe to run more than once.
-- Remove everything again with remove-test-data.sql (your real data is not touched).
--
-- How test rows are marked:
--   • tables created by the setup files: id starts with 7e570000-0000-4000-8000-
--   • events, gallery, announcements: created_at = 2000-01-01 (hidden marker)
--   • phone numbers use the reserved fictional range 555-01xx, emails use example.com
-- =====================================================================

-- helper: test id number n → uuid
create or replace function pg_temp.tid(n int) returns uuid language sql immutable as
$$ select ('7e570000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;

-- 1. Temple information (only fills fields that are still empty)
update public.site_settings set value_en = 'Ramakrishna Temple, Dhoom, Mirsharai, Chattogram, Bangladesh', value_bn = 'রামকৃষ্ণ মন্দির, ধুম, মীরসরাই, চট্টগ্রাম, বাংলাদেশ' where key = 'address' and value_en is null;
update public.site_settings set value_en = '+1 (215) 555-0100' where key = 'temple_phone' and value_en is null;
update public.site_settings set value_en = 'temple-test@example.com' where key = 'email' and value_en is null;
update public.site_settings set value_en = 'Hours may change on festival days — please check the Events section.', value_bn = 'উৎসবের দিনে সময় পরিবর্তন হতে পারে — অনুষ্ঠান অংশ দেখুন।' where key = 'festival_hours_note' and value_en is null;

-- 2. Yearly event list (10 more festivals)
insert into public.event_catalog (id, name_en, name_bn, usual_month, sort_order) values
  (pg_temp.tid(1),  'Ganesh Chaturthi', 'গণেশ চতুর্থী', 9, 115),
  (pg_temp.tid(2),  'Satyanarayan Puja (monthly)', 'সত্যনারায়ণ পূজা (মাসিক)', null, 5),
  (pg_temp.tid(3),  'Jagaddhatri Puja', 'জগদ্ধাত্রী পূজা', 11, 145),
  (pg_temp.tid(4),  'Annapurna Puja', 'অন্নপূর্ণা পূজা', 4, 75),
  (pg_temp.tid(5),  'Basanti Puja', 'বাসন্তী পূজা', 4, 76),
  (pg_temp.tid(6),  'Ram Navami', 'রামনবমী', 4, 77),
  (pg_temp.tid(7),  'Akshaya Tritiya', 'অক্ষয় তৃতীয়া', 5, 85),
  (pg_temp.tid(8),  'Snan Yatra', 'স্নানযাত্রা', 6, 88),
  (pg_temp.tid(9),  'Bhai Phonta', 'ভাইফোঁটা', 11, 142),
  (pg_temp.tid(10), 'Poush Sankranti', 'পৌষ সংক্রান্তি', 1, 15)
on conflict do nothing;

-- 3. Worship schedule (daily + weekly)
insert into public.worship_schedule (id, day_of_week, title_en, title_bn, is_closed, start_time, end_time, note_en, note_bn, sort_order) values
  (pg_temp.tid(1),  null, 'Mangal Aarti', 'মঙ্গল আরতি', false, '06:30', '07:00', null, null, 10),
  (pg_temp.tid(2),  null, 'Sandhya Aarti', 'সন্ধ্যা আরতি', false, '18:30', '19:15', 'Prasad after aarti', 'আরতির পর প্রসাদ বিতরণ', 20),
  (pg_temp.tid(3),  0, 'Weekly Worship', 'সাপ্তাহিক পূজা', false, '19:00', '22:00', 'Open to all devotees', 'সকল ভক্তের জন্য উন্মুক্ত', 30),
  (pg_temp.tid(4),  0, 'Bhajan & Kirtan', 'ভজন ও কীর্তন', false, '17:30', '18:30', null, null, 25),
  (pg_temp.tid(5),  1, 'Shiva Puja', 'শিব পূজা', false, '18:00', '19:00', null, null, 30),
  (pg_temp.tid(6),  2, 'Hanuman Chalisa Path', 'হনুমান চালিসা পাঠ', false, '18:00', '19:00', null, null, 30),
  (pg_temp.tid(7),  3, 'Gita Path', 'গীতা পাঠ', false, '18:00', '19:00', 'Study circle', 'পাঠচক্র', 30),
  (pg_temp.tid(8),  4, 'Lakshmi Puja', 'লক্ষ্মী পূজা', false, '18:00', '19:00', null, null, 30),
  (pg_temp.tid(9),  5, 'Ramakrishna Kathamrita Path', 'শ্রীশ্রীরামকৃষ্ণ কথামৃত পাঠ', false, '19:00', '20:30', null, null, 30),
  (pg_temp.tid(10), 6, 'Kali Puja', 'কালী পূজা', false, '18:00', '19:00', null, null, 30)
on conflict do nothing;

-- 4. Committee contacts
insert into public.committee_contacts (id, name, role_en, role_bn, phone, email, sort_order) values
  (pg_temp.tid(1),  'Test President', 'President', 'সভাপতি', '+1 (215) 555-0101', 'president-test@example.com', 10),
  (pg_temp.tid(2),  'Test Vice President', 'Vice President', 'সহ-সভাপতি', '+1 (215) 555-0102', null, 20),
  (pg_temp.tid(3),  'Test Secretary', 'General Secretary', 'সাধারণ সম্পাদক', '+1 (215) 555-0103', 'secretary-test@example.com', 30),
  (pg_temp.tid(4),  'Test Treasurer', 'Treasurer', 'কোষাধ্যক্ষ', '+1 (215) 555-0104', 'treasurer-test@example.com', 40),
  (pg_temp.tid(5),  'Test Puja Coordinator', 'Puja Coordinator', 'পূজা সমন্বয়ক', '+1 (215) 555-0105', null, 50),
  (pg_temp.tid(6),  'Test Event Coordinator', 'Event Coordinator', 'অনুষ্ঠান সমন্বয়ক', '+1 (215) 555-0106', null, 60),
  (pg_temp.tid(7),  'Test Youth Coordinator', 'Youth Coordinator', 'যুব সমন্বয়ক', '+1 (215) 555-0107', null, 70),
  (pg_temp.tid(8),  'Test Volunteer Lead', 'Volunteer Lead', 'স্বেচ্ছাসেবক প্রধান', '+1 (215) 555-0108', null, 80),
  (pg_temp.tid(9),  'Test Priest', 'Priest', 'পুরোহিত', '+1 (215) 555-0109', null, 90),
  (pg_temp.tid(10), 'Test Office Assistant', 'Office', 'অফিস', '+1 (215) 555-0110', 'office-test@example.com', 100)
on conflict do nothing;

-- 5. Mission values (5) and deities (5)
insert into public.temple_highlights (id, kind, title_en, title_bn, subtitle_en, subtitle_bn, body_en, body_bn, sort_order) values
  (pg_temp.tid(1),  'mission', 'Devotion', 'ভক্তি', null, null, 'A peaceful place for daily worship, prayer and meditation for every devotee.', 'প্রত্যেক ভক্তের জন্য দৈনিক পূজা, প্রার্থনা ও ধ্যানের শান্ত স্থান।', 10),
  (pg_temp.tid(2),  'mission', 'Service', 'সেবা', null, null, 'Serving people in need as a form of worship — "Shiva jnane jiva seva".', 'শিবজ্ঞানে জীবসেবা — মানুষের সেবাই পূজা।', 20),
  (pg_temp.tid(3),  'mission', 'Harmony', 'সম্প্রীতি', null, null, 'Respect for all faiths, following the message "As many faiths, so many paths".', '"যত মত তত পথ" — সকল ধর্মের প্রতি শ্রদ্ধা।', 30),
  (pg_temp.tid(4),  'mission', 'Community', 'সমাজ', null, null, 'Bringing families together through festivals, prasad and shared celebrations.', 'উৎসব, প্রসাদ ও মিলনমেলার মাধ্যমে পরিবারগুলোকে একত্র করা।', 40),
  (pg_temp.tid(5),  'mission', 'Education', 'শিক্ষা', null, null, 'Study circles, Gita path and classes for children on values and heritage.', 'পাঠচক্র, গীতা পাঠ ও শিশুদের জন্য মূল্যবোধের শিক্ষা।', 50),
  (pg_temp.tid(6),  'deity', 'Sri Ramakrishna', 'শ্রীরামকৃষ্ণ', 'Janmatithi — annual', 'জন্মতিথি — বার্ষিক', 'Worshipped daily with aarti; his birth anniversary is the main celebration.', 'প্রতিদিন আরতির মাধ্যমে পূজিত; জন্মতিথি প্রধান উৎসব।', 10),
  (pg_temp.tid(7),  'deity', 'Holy Mother Sri Sarada Devi', 'শ্রীশ্রী মা সারদা দেবী', 'Janmatithi — annual', 'জন্মতিথি — বার্ষিক', 'The Holy Mother, remembered with special puja on her birth anniversary.', 'জন্মতিথিতে বিশেষ পূজার মাধ্যমে স্মরণ।', 20),
  (pg_temp.tid(8),  'deity', 'Swami Vivekananda', 'স্বামী বিবেকানন্দ', 'Janmatithi — January', 'জন্মতিথি — জানুয়ারি', 'Inspiration for service and youth programmes of the temple.', 'মন্দিরের সেবা ও যুব কার্যক্রমের অনুপ্রেরণা।', 30),
  (pg_temp.tid(9),  'deity', 'Goddess Durga', 'মা দুর্গা', 'Durga Puja — annual', 'দুর্গাপূজা — বার্ষিক', 'The grandest celebration of the year with anjali and prasad.', 'অঞ্জলি ও প্রসাদসহ বছরের সবচেয়ে বড় উৎসব।', 40),
  (pg_temp.tid(10), 'deity', 'Goddess Kali', 'মা কালী', 'Shyama Puja — annual', 'শ্যামাপূজা — বার্ষিক', 'Night-long worship on the new moon of Kartik.', 'কার্তিক অমাবস্যায় রাতভর পূজা।', 50)
on conflict do nothing;

-- 6. Extra income & expenditure heads
insert into public.account_heads (id, head_type, code, name_en, name_bn, sort_order) values
  (pg_temp.tid(1),  'income',  'test_durga_chanda', 'Durga Puja chanda (test)', 'দুর্গাপূজার চাঁদা (পরীক্ষা)', 41),
  (pg_temp.tid(2),  'income',  'test_kali_chanda', 'Kali Puja chanda (test)', 'কালীপূজার চাঁদা (পরীক্ষা)', 42),
  (pg_temp.tid(3),  'income',  'test_book_stall', 'Book stall (test)', 'বইয়ের স্টল (পরীক্ষা)', 55),
  (pg_temp.tid(4),  'income',  'test_hall_booking', 'Hall booking (test)', 'হল ভাড়া (পরীক্ষা)', 56),
  (pg_temp.tid(5),  'income',  'test_souvenir', 'Souvenir advertisement (test)', 'স্মরণিকা বিজ্ঞাপন (পরীক্ষা)', 57),
  (pg_temp.tid(6),  'expense', 'test_idol', 'Idol / pratima (test)', 'প্রতিমা (পরীক্ষা)', 15),
  (pg_temp.tid(7),  'expense', 'test_pandal', 'Pandal (test)', 'প্যান্ডেল (পরীক্ষা)', 45),
  (pg_temp.tid(8),  'expense', 'test_cleaning', 'Cleaning (test)', 'পরিচ্ছন্নতা (পরীক্ষা)', 75),
  (pg_temp.tid(9),  'expense', 'test_bank_charge', 'Bank charges (test)', 'ব্যাংক চার্জ (পরীক্ষা)', 135),
  (pg_temp.tid(10), 'expense', 'test_scholarship', 'Student scholarship (test)', 'ছাত্রবৃত্তি (পরীক্ষা)', 125)
on conflict do nothing;

-- 7. Events (upcoming; 8 published, 2 drafts)
delete from public.events where created_at >= '2000-01-01 00:00:00+00' and created_at < '2000-01-02 00:00:00+00';  -- avoid duplicates when re-run
insert into public.events (title_en, title_bn, description_en, description_bn, event_date, image_url, is_published, opens_at, puja_starts_at, closes_at, location, created_at) values
  ('Jagaddhatri Puja', 'জগদ্ধাত্রী পূজা', 'Puja, anjali and prasad for all devotees.', 'সকল ভক্তের জন্য পূজা, অঞ্জলি ও প্রসাদ।', current_date + 7, '/temple-photo.jpg', true, '17:00', '18:30', '22:00', null, '2000-01-01 00:00:01+00'),
  ('Satyanarayan Puja (monthly)', 'সত্যনারায়ণ পূজা (মাসিক)', 'Monthly puja for the blessings of Lord Vishnu.', 'শ্রীবিষ্ণুর আশীর্বাদ কামনায় মাসিক পূজা।', current_date + 14, null, true, '18:00', '19:00', '21:00', null, '2000-01-01 00:00:02+00'),
  ('Gita Jayanti', 'গীতা জয়ন্তী', 'Recitation of the Bhagavad Gita and discourse.', 'শ্রীমদ্ভগবদ্গীতা পাঠ ও আলোচনা।', current_date + 21, null, true, '17:30', '18:00', '20:30', null, '2000-01-01 00:00:03+00'),
  ('Holy Mother Sri Sarada Devi Janmatithi', 'শ্রীশ্রী মা সারদা দেবীর জন্মতিথি', 'Special puja, bhajan and prasad.', 'বিশেষ পূজা, ভজন ও প্রসাদ।', current_date + 30, '/hero-banner.jpg', true, '07:00', '08:00', '21:00', null, '2000-01-01 00:00:04+00'),
  ('Kalpataru Utsav', 'কল্পতরু উৎসব', 'Celebration of Kalpataru day with kirtan.', 'কীর্তনসহ কল্পতরু দিবস উদযাপন।', current_date + 50, null, true, '09:00', '10:00', '20:00', null, '2000-01-01 00:00:05+00'),
  ('Swami Vivekananda Janmatithi', 'স্বামী বিবেকানন্দের জন্মতিথি', 'Youth programme, essay competition and puja.', 'যুব অনুষ্ঠান, রচনা প্রতিযোগিতা ও পূজা।', current_date + 62, null, true, '08:00', '09:00', '18:00', null, '2000-01-01 00:00:06+00'),
  ('Saraswati Puja', 'সরস্বতী পূজা', 'Puja for students and families; hate-khori for children.', 'শিক্ষার্থী ও পরিবারের জন্য পূজা; শিশুদের হাতেখড়ি।', current_date + 80, null, true, '08:00', '09:30', '14:00', null, '2000-01-01 00:00:07+00'),
  ('Sri Ramakrishna Janmatithi', 'শ্রীরামকৃষ্ণের জন্মতিথি', 'The main annual celebration of the temple.', 'মন্দিরের প্রধান বার্ষিক উৎসব।', current_date + 100, '/temple-photo.jpg', true, '05:30', '06:30', '21:00', null, '2000-01-01 00:00:08+00'),
  ('Community Picnic', 'বার্ষিক বনভোজন', 'Annual picnic for all families (draft).', 'সকল পরিবারের জন্য বার্ষিক বনভোজন (খসড়া)।', current_date + 120, null, false, '10:00', null, '17:00', 'Local park (to be confirmed)', '2000-01-01 00:00:09+00'),
  ('Annual General Meeting', 'বার্ষিক সাধারণ সভা', 'Presentation of the yearly accounts (draft).', 'বার্ষিক আয়-ব্যয়ের হিসাব উপস্থাপন (খসড়া)।', current_date + 140, null, false, '16:00', null, '19:00', null, '2000-01-01 00:00:10+00');

-- 8. Gallery (uses the temple photos already in the project)
delete from public.gallery where created_at >= '2000-01-01 00:00:00+00' and created_at < '2000-01-02 00:00:00+00';  -- avoid duplicates when re-run
insert into public.gallery (title_en, title_bn, image_url, description_en, description_bn, is_published, category, created_at) values
  ('Temple at sunset', 'সূর্যাস্তে মন্দির', '/temple-photo.jpg', 'Evening view of the temple.', 'সন্ধ্যায় মন্দিরের দৃশ্য।', true, 'temple', '2000-01-01 00:00:01+00'),
  ('Temple banner', 'মন্দিরের ব্যানার', '/hero-banner.jpg', null, null, true, 'temple', '2000-01-01 00:00:02+00'),
  ('Durga Puja', 'দুর্গাপূজা', '/temple-photo.jpg', 'Durga Puja celebration.', 'দুর্গাপূজা উদযাপন।', true, 'festivals', '2000-01-01 00:00:03+00'),
  ('Shyama Puja', 'শ্যামাপূজা', '/hero-banner.jpg', null, null, true, 'festivals', '2000-01-01 00:00:04+00'),
  ('Saraswati Puja', 'সরস্বতী পূজা', '/temple-photo.jpg', null, null, true, 'festivals', '2000-01-01 00:00:05+00'),
  ('Evening aarti', 'সন্ধ্যা আরতি', '/hero-banner.jpg', null, null, true, 'worship', '2000-01-01 00:00:06+00'),
  ('Sunday worship', 'রবিবারের পূজা', '/temple-photo.jpg', null, null, true, 'worship', '2000-01-01 00:00:07+00'),
  ('Prasad distribution', 'প্রসাদ বিতরণ', '/hero-banner.jpg', null, null, true, 'community', '2000-01-01 00:00:08+00'),
  ('Community picnic', 'বনভোজন', '/temple-photo.jpg', null, null, true, 'community', '2000-01-01 00:00:09+00'),
  ('Volunteers (draft)', 'স্বেচ্ছাসেবক (খসড়া)', '/hero-banner.jpg', null, null, false, 'community', '2000-01-01 00:00:10+00');

-- 9. Announcements
delete from public.announcements where created_at >= '2000-01-01 00:00:00+00' and created_at < '2000-01-02 00:00:00+00';  -- avoid duplicates when re-run
insert into public.announcements (title_en, title_bn, message_en, message_bn, is_published, created_at) values
  ('Jagaddhatri Puja next week', 'আগামী সপ্তাহে জগদ্ধাত্রী পূজা', 'All devotees are invited. Prasad will be served.', 'সকল ভক্তকে আমন্ত্রণ। প্রসাদ বিতরণ করা হবে।', true, '2000-01-01 00:00:01+00'),
  ('Volunteers needed', 'স্বেচ্ছাসেবক প্রয়োজন', 'Please contact the committee to help with festival preparation.', 'উৎসবের প্রস্তুতিতে সাহায্য করতে কমিটির সঙ্গে যোগাযোগ করুন।', true, '2000-01-01 00:00:02+00'),
  ('Monthly subscription open', 'মাসিক চাঁদা চালু', 'Support the temple every month — register online.', 'প্রতি মাসে মন্দিরের পাশে থাকুন — অনলাইনে নিবন্ধন করুন।', true, '2000-01-01 00:00:03+00'),
  ('Gita study circle', 'গীতা পাঠচক্র', 'Every Wednesday at 6 PM.', 'প্রতি বুধবার সন্ধ্যা ৬টায়।', true, '2000-01-01 00:00:04+00'),
  ('Prasad sponsorship', 'প্রসাদ স্পনসর', 'Families may sponsor prasad for Sunday worship.', 'পরিবারগুলো রবিবারের পূজার প্রসাদ স্পনসর করতে পারেন।', true, '2000-01-01 00:00:05+00'),
  ('Blood donation camp', 'রক্তদান শিবির', 'Humanitarian service camp at the temple premises.', 'মন্দির প্রাঙ্গণে মানবিক সেবা শিবির।', true, '2000-01-01 00:00:06+00'),
  ('Children''s value class', 'শিশুদের মূল্যবোধ ক্লাস', 'Saturday mornings for ages 6–14.', 'শনিবার সকালে ৬–১৪ বছর বয়সীদের জন্য।', true, '2000-01-01 00:00:07+00'),
  ('Winter clothes drive', 'শীতবস্ত্র সংগ্রহ', 'Donate warm clothes for people in need.', 'অসহায় মানুষের জন্য শীতবস্ত্র দান করুন।', true, '2000-01-01 00:00:08+00'),
  ('Parking notice (draft)', 'পার্কিং বিজ্ঞপ্তি (খসড়া)', 'Draft notice — not published.', 'খসড়া বিজ্ঞপ্তি — প্রকাশিত নয়।', false, '2000-01-01 00:00:09+00'),
  ('AGM date (draft)', 'সাধারণ সভার তারিখ (খসড়া)', 'Draft notice — not published.', 'খসড়া বিজ্ঞপ্তি — প্রকাশিত নয়।', false, '2000-01-01 00:00:10+00');

-- 10. Donations (office + online, BDT + USD)
insert into public.donations (id, channel, donor_name, phone, email, amount, currency, method, transaction_ref, receipt_no, purpose, event_catalog_id, donated_on, status, notes) values
  (pg_temp.tid(1),  'office', 'Test Donor One', '+1 (215) 555-0121', null, 1000, 'BDT', 'cash', null, 'TEST-R-0001', 'General temple fund', null, current_date - 2, 'verified', 'test data'),
  (pg_temp.tid(2),  'office', 'Test Donor Two', '+1 (215) 555-0122', null, 5000, 'BDT', 'cheque', 'CHQ-TEST-2', 'TEST-R-0002', 'Durga Puja', (select id from public.event_catalog where name_en = 'Durga Puja'), current_date - 5, 'verified', 'test data'),
  (pg_temp.tid(3),  'office', 'Anonymous', null, null, 500, 'BDT', 'cash', null, 'TEST-R-0003', 'General temple fund', null, current_date - 8, 'verified', 'test data'),
  (pg_temp.tid(4),  'office', 'Test Donor Four', '+1 (215) 555-0124', null, 2500, 'BDT', 'bkash', 'BKTEST0004', 'TEST-R-0004', 'Shyama Puja (Kali Puja)', (select id from public.event_catalog where name_en = 'Shyama Puja (Kali Puja)'), current_date - 10, 'verified', 'test data'),
  (pg_temp.tid(5),  'office', 'Test Donor Five', null, null, 100, 'USD', 'cash', null, 'TEST-R-0005', 'General temple fund', null, current_date - 12, 'verified', 'test data'),
  (pg_temp.tid(6),  'online', 'Test Donor Six', '+1 (215) 555-0126', 'donor6@example.com', 1500, 'BDT', 'nagad', 'NGTEST0006', 'TEST-R-0006', 'General temple fund', null, current_date - 3, 'verified', 'test data'),
  (pg_temp.tid(7),  'online', 'Test Donor Seven', '+1 (215) 555-0127', 'donor7@example.com', 51, 'USD', 'card', 'PI-TEST-0007', 'TEST-R-0007', 'Durga Puja', (select id from public.event_catalog where name_en = 'Durga Puja'), current_date - 4, 'verified', 'test data'),
  (pg_temp.tid(8),  'online', 'Test Donor Eight', '+1 (215) 555-0128', null, 750, 'BDT', 'bkash', 'BKTEST0008', null, 'General temple fund', null, current_date - 1, 'pending', 'test data — waiting to verify'),
  (pg_temp.tid(9),  'online', 'Test Donor Nine', '+1 (215) 555-0129', 'donor9@example.com', 2000, 'BDT', 'bank', 'BANKTEST09', null, 'Saraswati Puja', (select id from public.event_catalog where name_en = 'Saraswati Puja'), current_date, 'pending', 'test data — waiting to verify'),
  (pg_temp.tid(10), 'online', 'Test Donor Ten', '+1 (215) 555-0130', null, 300, 'BDT', 'rocket', 'RKTEST0010', null, 'General temple fund', null, current_date - 6, 'rejected', 'test data — transaction not found')
on conflict do nothing;

-- 11. Monthly subscriptions
insert into public.subscriptions (id, donor_name, phone, email, monthly_amount, currency, payment_method, start_month, status, source, notes) values
  (pg_temp.tid(1),  'Test Subscriber One',   '+1 (215) 555-0141', null, 300, 'BDT', 'cash',  date_trunc('month', current_date - interval '3 months')::date, 'active', 'office', 'test data'),
  (pg_temp.tid(2),  'Test Subscriber Two',   '+1 (215) 555-0142', null, 500, 'BDT', 'bkash', date_trunc('month', current_date - interval '2 months')::date, 'active', 'office', 'test data'),
  (pg_temp.tid(3),  'Test Subscriber Three', '+1 (215) 555-0143', null, 200, 'BDT', 'nagad', date_trunc('month', current_date - interval '1 month')::date, 'active', 'online', 'test data'),
  (pg_temp.tid(4),  'Test Subscriber Four',  '+1 (215) 555-0144', 'sub4@example.com', 20, 'USD', 'card', date_trunc('month', current_date - interval '2 months')::date, 'active', 'online', 'test data'),
  (pg_temp.tid(5),  'Test Subscriber Five',  '+1 (215) 555-0145', null, 1000, 'BDT', 'bank', date_trunc('month', current_date)::date, 'active', 'office', 'test data'),
  (pg_temp.tid(6),  'Test Subscriber Six',   '+1 (215) 555-0146', null, 250, 'BDT', 'cash',  date_trunc('month', current_date - interval '4 months')::date, 'paused', 'office', 'test data'),
  (pg_temp.tid(7),  'Test Subscriber Seven', '+1 (215) 555-0147', null, 150, 'BDT', 'bkash', date_trunc('month', current_date - interval '5 months')::date, 'cancelled', 'office', 'test data'),
  (pg_temp.tid(8),  'Test Subscriber Eight', '+1 (215) 555-0148', 'sub8@example.com', 400, 'BDT', 'bkash', date_trunc('month', current_date)::date, 'pending', 'online', 'test data — new request'),
  (pg_temp.tid(9),  'Test Subscriber Nine',  '+1 (215) 555-0149', null, 10, 'USD', 'card', date_trunc('month', current_date)::date, 'pending', 'online', 'test data — new request'),
  (pg_temp.tid(10), 'Test Subscriber Ten',   '+1 (215) 555-0150', null, 300, 'BDT', 'rocket', date_trunc('month', current_date - interval '1 month')::date, 'active', 'online', 'test data')
on conflict do nothing;

-- 12. Monthly payments (some months paid, some still due)
insert into public.subscription_payments (id, subscription_id, month, amount, currency, method, transaction_ref, paid_on) values
  (pg_temp.tid(1),  pg_temp.tid(1), date_trunc('month', current_date - interval '3 months')::date, 300, 'BDT', 'cash', null, current_date - 85),
  (pg_temp.tid(2),  pg_temp.tid(1), date_trunc('month', current_date - interval '2 months')::date, 300, 'BDT', 'cash', null, current_date - 55),
  (pg_temp.tid(3),  pg_temp.tid(1), date_trunc('month', current_date - interval '1 month')::date, 300, 'BDT', 'cash', null, current_date - 25),
  (pg_temp.tid(4),  pg_temp.tid(2), date_trunc('month', current_date - interval '2 months')::date, 500, 'BDT', 'bkash', 'BKSUB00004', current_date - 50),
  (pg_temp.tid(5),  pg_temp.tid(2), date_trunc('month', current_date)::date, 500, 'BDT', 'bkash', 'BKSUB00005', current_date - 2),
  (pg_temp.tid(6),  pg_temp.tid(3), date_trunc('month', current_date - interval '1 month')::date, 200, 'BDT', 'nagad', 'NGSUB00006', current_date - 20),
  (pg_temp.tid(7),  pg_temp.tid(4), date_trunc('month', current_date - interval '2 months')::date, 20, 'USD', 'card', 'PI-SUB-0007', current_date - 58),
  (pg_temp.tid(8),  pg_temp.tid(4), date_trunc('month', current_date - interval '1 month')::date, 20, 'USD', 'card', 'PI-SUB-0008', current_date - 28),
  (pg_temp.tid(9),  pg_temp.tid(5), date_trunc('month', current_date)::date, 1000, 'BDT', 'bank', 'BANKSUB009', current_date - 1),
  (pg_temp.tid(10), pg_temp.tid(10), date_trunc('month', current_date - interval '1 month')::date, 300, 'BDT', 'rocket', 'RKSUB00010', current_date - 22)
on conflict do nothing;

-- 13. Other income
insert into public.income_entries (id, entry_date, category, description, received_from, amount, currency, method, reference, receipt_no, event_catalog_id, notes) values
  (pg_temp.tid(1),  current_date - 1,  'pranami', 'Pranami box — Sunday worship', null, 1250, 'BDT', 'cash', null, 'TEST-INC-01', null, 'test data'),
  (pg_temp.tid(2),  current_date - 8,  'pranami', 'Pranami box — Sunday worship', null, 980, 'BDT', 'cash', null, 'TEST-INC-02', null, 'test data'),
  (pg_temp.tid(3),  current_date - 4,  'puja_sponsorship', 'Kali Puja sponsorship', 'Test Family A', 5000, 'BDT', 'bkash', 'BKINC00003', 'TEST-INC-03', (select id from public.event_catalog where name_en = 'Shyama Puja (Kali Puja)'), 'test data'),
  (pg_temp.tid(4),  current_date - 15, 'membership', 'Annual membership fees (5 families)', null, 2500, 'BDT', 'cash', null, 'TEST-INC-04', null, 'test data'),
  (pg_temp.tid(5),  current_date - 6,  'event_contribution', 'Durga Puja contribution', 'Test Family B', 3000, 'BDT', 'nagad', 'NGINC00005', 'TEST-INC-05', (select id from public.event_catalog where name_en = 'Durga Puja'), 'test data'),
  (pg_temp.tid(6),  current_date - 9,  'prasad', 'Prasad contribution — Sunday', null, 600, 'BDT', 'cash', null, 'TEST-INC-06', null, 'test data'),
  (pg_temp.tid(7),  current_date - 20, 'fundraising', 'Building fund drive', 'Test Family C', 150, 'USD', 'bank', 'BANKINC007', 'TEST-INC-07', null, 'test data'),
  (pg_temp.tid(8),  current_date - 25, 'grant', 'Community grant (test)', 'Test Foundation', 10000, 'BDT', 'bank', 'GRANT00008', 'TEST-INC-08', null, 'test data'),
  (pg_temp.tid(9),  current_date - 3,  'interest', 'Bank interest — quarter', 'Test Bank', 320, 'BDT', 'bank', 'INT0000009', 'TEST-INC-09', null, 'test data'),
  (pg_temp.tid(10), current_date - 2,  'other', 'Sale of old newspapers', null, 150, 'BDT', 'cash', null, 'TEST-INC-10', null, 'test data')
on conflict do nothing;

-- 14. Expenditure
insert into public.expense_entries (id, expense_date, category, description, paid_to, amount, currency, method, reference, voucher_no, approved_by, event_catalog_id, notes) values
  (pg_temp.tid(1),  current_date - 4,  'puja_materials', 'Flowers, fruits and incense for Kali Puja', 'Test Flower Shop', 3200, 'BDT', 'cash', null, 'TEST-EXP-01', 'Test Treasurer', (select id from public.event_catalog where name_en = 'Shyama Puja (Kali Puja)'), 'test data'),
  (pg_temp.tid(2),  current_date - 4,  'priest', 'Priest dakshina — Kali Puja', 'Test Priest', 2000, 'BDT', 'cash', null, 'TEST-EXP-02', 'Test Treasurer', (select id from public.event_catalog where name_en = 'Shyama Puja (Kali Puja)'), 'test data'),
  (pg_temp.tid(3),  current_date - 5,  'prasad_bhog', 'Bhog and prasad — Sunday worship', 'Test Grocery', 1800, 'BDT', 'bkash', 'BKEXP00003', 'TEST-EXP-03', 'Test Treasurer', null, 'test data'),
  (pg_temp.tid(4),  current_date - 7,  'decoration', 'Lights and decoration — Durga Puja', 'Test Decorator', 4500, 'BDT', 'cheque', 'CHQEXP0004', 'TEST-EXP-04', 'Test President', (select id from public.event_catalog where name_en = 'Durga Puja'), 'test data'),
  (pg_temp.tid(5),  current_date - 10, 'utilities', 'Electricity bill', 'Test Power Company', 1650, 'BDT', 'bank', 'BANKEXP005', 'TEST-EXP-05', 'Test Treasurer', null, 'test data'),
  (pg_temp.tid(6),  current_date - 12, 'maintenance', 'Plumbing repair', 'Test Plumber', 900, 'BDT', 'cash', null, 'TEST-EXP-06', 'Test Secretary', null, 'test data'),
  (pg_temp.tid(7),  current_date - 14, 'printing', 'Festival flyers', 'Test Printers', 700, 'BDT', 'cash', null, 'TEST-EXP-07', 'Test Secretary', null, 'test data'),
  (pg_temp.tid(8),  current_date - 16, 'sound_av', 'Sound system rent — Durga Puja', 'Test Sound Service', 2500, 'BDT', 'bkash', 'BKEXP00008', 'TEST-EXP-08', 'Test Treasurer', (select id from public.event_catalog where name_en = 'Durga Puja'), 'test data'),
  (pg_temp.tid(9),  current_date - 18, 'charity', 'Winter blankets for families in need', 'Test Blanket Supplier', 6000, 'BDT', 'bank', 'BANKEXP009', 'TEST-EXP-09', 'Test President', null, 'test data'),
  (pg_temp.tid(10), current_date - 20, 'insurance', 'Building insurance premium', 'Test Insurance Co.', 80, 'USD', 'card', 'PI-EXP-0010', 'TEST-EXP-10', 'Test Treasurer', null, 'test data')
on conflict do nothing;

-- 15. Messages from the website
insert into public.contact_messages (id, name, email, phone, subject, message, status, created_at) values
  (pg_temp.tid(1),  'Test Visitor 1',  'visitor1@example.com', null, 'Durga Puja timing', 'When does Durga Puja start this year? Thank you.', 'new', now() - interval '1 hour'),
  (pg_temp.tid(2),  'Test Visitor 2',  'visitor2@example.com', '+1 (215) 555-0162', 'Volunteering', 'I would like to volunteer for the next festival.', 'new', now() - interval '5 hours'),
  (pg_temp.tid(3),  'Test Visitor 3',  'visitor3@example.com', null, 'Prasad sponsorship', 'How can our family sponsor prasad for a Sunday?', 'new', now() - interval '1 day'),
  (pg_temp.tid(4),  'Test Visitor 4',  'visitor4@example.com', null, null, 'Is there parking near the temple?', 'read', now() - interval '2 days'),
  (pg_temp.tid(5),  'Test Visitor 5',  'visitor5@example.com', null, 'Annaprashan', 'Can we arrange an annaprashan ceremony at the temple?', 'read', now() - interval '3 days'),
  (pg_temp.tid(6),  'Test Visitor 6',  'visitor6@example.com', null, 'Donation receipt', 'Please send me a receipt for my donation last week.', 'replied', now() - interval '4 days'),
  (pg_temp.tid(7),  'Test Visitor 7',  'visitor7@example.com', null, 'Gita class', 'What time is the Gita study circle on Wednesday?', 'replied', now() - interval '6 days'),
  (pg_temp.tid(8),  'Test Visitor 8',  'visitor8@example.com', null, 'Children class', 'Is there a class for children on weekends?', 'new', now() - interval '7 days'),
  (pg_temp.tid(9),  'Test Visitor 9',  'visitor9@example.com', null, 'Hall booking', 'Can the hall be booked for a family puja?', 'read', now() - interval '9 days'),
  (pg_temp.tid(10), 'Test Visitor 10', 'visitor10@example.com', null, 'Thank you', 'Thank you for the wonderful Kali Puja celebration!', 'replied', now() - interval '10 days')
on conflict do nothing;

-- 16. Temple story (only if you have not written one yet)
insert into public.temple_content (slug, title_en, title_bn, body_en, body_bn, is_published, updated_at)
select 'about-temple', 'How Our Temple Began', 'আমাদের মন্দিরের সূচনা',
  E'This is sample text for testing the "Our Story" section. Replace it with the real history of the temple from Admin → Temple Content.\n\nWrite how the devotees first gathered, how the temple was built, and the plans for the future.',
  E'এটি "আমাদের ইতিহাস" অংশ পরীক্ষার নমুনা লেখা। Admin → Temple Content থেকে মন্দিরের আসল ইতিহাস লিখে এটি বদলে দিন।\n\nভক্তরা কীভাবে প্রথম একত্র হয়েছিলেন, মন্দির কীভাবে গড়ে উঠল এবং ভবিষ্যতের পরিকল্পনা লিখুন।',
  true, '2000-01-01 00:00:00+00'
where not exists (select 1 from public.temple_content where slug = 'about-temple');
