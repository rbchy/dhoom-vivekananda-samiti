-- =====================================================================
-- Events: a short subtitle (e.g. "Annual festival") and a mantra shown on
-- the event card, plus two yearly festivals: Sri Sri Saraswati Puja and
-- Sri Sri Gita Jayanti, each with picture, mantra and Bangla/English text.
-- Run once in Supabase → SQL Editor. Safe to run again: each festival is
-- added only if an event with that name on that date does not exist yet.
-- =====================================================================

alter table public.events add column if not exists subtitle_en text;
alter table public.events add column if not exists subtitle_bn text;
alter table public.events add column if not exists mantra_bn text;
alter table public.events add column if not exists mantra_en text;

alter table public.events drop constraint if exists events_extras_length;
alter table public.events add constraint events_extras_length check (
  (subtitle_en is null or char_length(subtitle_en) <= 120) and (subtitle_bn is null or char_length(subtitle_bn) <= 120) and
  (mantra_bn is null or char_length(mantra_bn) <= 500) and (mantra_en is null or char_length(mantra_en) <= 500));

-- Sri Sri Saraswati Puja — Vasant Panchami, Thursday 11 February 2027
insert into public.events (title_en, title_bn, subtitle_en, subtitle_bn, description_en, description_bn, event_date, image_url, mantra_bn, mantra_en, is_published)
select 'Sri Sri Saraswati Puja', 'শ্রীশ্রী সরস্বতী পূজা', 'Annual festival · Vasant Panchami', 'বার্ষিক উৎসব · বসন্ত পঞ্চমী',
  'On the holy day of Vasant Panchami the temple worships Sri Sri Saraswati, the goddess of learning, wisdom, music and the arts. The puja is performed with the chanting of Vedic mantras, followed by pushpanjali (flower offering) and the distribution of prasad. Students, parents and all devotees are warmly invited with their families.',
  'বসন্ত পঞ্চমীর পুণ্য তিথিতে বিদ্যা, জ্ঞান, সংগীত ও শিল্পকলার দেবী শ্রীশ্রী সরস্বতীর পূজা অনুষ্ঠিত হবে। বৈদিক মন্ত্রোচ্চারণে দেবীর আরাধনা, তারপর পুষ্পাঞ্জলি ও প্রসাদ বিতরণ করা হবে। ছাত্রছাত্রী, অভিভাবক ও সকল ভক্তকে সপরিবারে সাদর আমন্ত্রণ জানানো হচ্ছে।',
  date '2027-02-11',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/events/saraswati-puja.webp',
  E'ওঁ ভদ্রকাল্যৈ নমো নিত্যং সরস্বত্যৈ নমো নমঃ।\nবেদ-বেদাঙ্গ-বেদান্ত-বিদ্যাস্থানেভ্য এব চ॥\n— পুষ্পাঞ্জলি মন্ত্র',
  E'Om bhadrakālyai namo nityaṁ Sarasvatyai namo namaḥ,\nveda-vedāṅga-vedānta-vidyā-sthānebhya eva ca.\n— Pushpanjali mantra',
  true
where not exists (select 1 from public.events where title_en ilike '%saraswati%' and event_date = date '2027-02-11');

-- Sri Sri Gita Jayanti — Mokshada Ekadashi, Sunday 20 December 2026
insert into public.events (title_en, title_bn, subtitle_en, subtitle_bn, description_en, description_bn, event_date, image_url, mantra_bn, mantra_en, is_published)
select 'Sri Sri Gita Jayanti', 'শ্রীশ্রী গীতা জয়ন্তী', 'Annual festival · Mokshada Ekadashi', 'বার্ষিক উৎসব · মোক্ষদা একাদশী',
  'Gita Jayanti falls on Mokshada Ekadashi, the bright eleventh day of Agrahayan (Margashirsha), the day on which Sri Krishna spoke the Srimad Bhagavad Gita to Arjuna on the field of Kurukshetra. The day is observed with Gita path (reading of the Gita), puja, a discussion on its teachings and the distribution of prasad. All devotees are warmly invited.',
  'অগ্রহায়ণ মাসের শুক্লা একাদশী, মোক্ষদা একাদশীর পুণ্য তিথিতে শ্রীশ্রী গীতা জয়ন্তী পালিত হবে। এই দিনেই কুরুক্ষেত্রের রণাঙ্গনে ভগবান শ্রীকৃষ্ণ অর্জুনকে শ্রীমদ্ভগবদ্গীতার অমৃতবাণী শুনিয়েছিলেন। গীতাপাঠ, পূজা-অর্চনা, গীতার শিক্ষা নিয়ে আলোচনা ও প্রসাদ বিতরণের মাধ্যমে দিনটি উদযাপিত হবে। সকল ভক্তকে সাদর আমন্ত্রণ।',
  date '2026-12-20',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/events/gita-jayanti.webp',
  E'যদা যদা হি ধর্মস্য গ্লানির্ভবতি ভারত।\nঅভ্যুত্থানমধর্মস্য তদাত্মানং সৃজাম্যহম্‌॥\n— শ্রীমদ্ভগবদ্গীতা ৪।৭',
  E'Yadā yadā hi dharmasya glānir bhavati bhārata,\nabhyutthānam adharmasya tadātmānaṁ sṛjāmy aham.\n— Bhagavad Gita 4.7',
  true
where not exists (select 1 from public.events where title_en ilike '%gita jayanti%' and event_date = date '2026-12-20');
