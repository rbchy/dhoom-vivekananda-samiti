-- Adds Sri Sri Ganga Devi to the deities section (daily puja 7–8 AM) with picture,
-- pranam mantra and Bangla/English description, and fills Lord Shiva's daily-puja
-- text if his card has no Bangla description yet. Run once in Supabase → SQL Editor,
-- after pranam-mantra.sql. Safe to run again.

insert into public.temple_highlights
  (kind, title_en, title_bn, subtitle_en, subtitle_bn, body_en, body_bn, image_url, pranam_bn, pranam_en, sort_order, is_active)
select 'deity', 'Sri Sri Ganga Devi', 'শ্রীশ্রী গঙ্গা দেবী',
  'Daily puja · 7–8 AM', 'নিত্যপূজা — প্রতিদিন সকাল ৭টা–৮টা',
  'Every morning from 7 to 8 AM, the sacred Mother Ganga is worshipped with deep devotion. With the chanting of Vedic mantras, flowers are offered at her feet, incense and lamps are lit, and aarti is performed. Devotees join the prayer seeking her blessings for purity, prosperity and the well-being of all.',
  'প্রতিদিন সকাল ৭টা থেকে ৮টা পর্যন্ত পতিতপাবনী পবিত্র গঙ্গা মায়ের পূজা-অর্চনা গভীর ভক্তি ও শ্রদ্ধার সঙ্গে অনুষ্ঠিত হয়। বৈদিক মন্ত্রোচ্চারণের সঙ্গে মায়ের চরণে পুষ্পার্ঘ্য নিবেদন, ধূপ-দীপ প্রজ্বলন ও আরতির মাধ্যমে গঙ্গা মায়ের উপাসনা করা হয়। ভক্তরা এই প্রার্থনায় অংশ নিয়ে জীবনের পবিত্রতা, সংসারের সমৃদ্ধি ও সকলের কল্যাণ কামনায় মায়ের আশীর্বাদ প্রার্থনা করেন।',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/deities/ganga-devi.webp',
  E'ওঁ সদ্যঃ পাতকসংহন্ত্রী সদ্যোদুঃখবিনাশিনী।\nসুখদা মোক্ষদা গঙ্গা গঙ্গৈব পরমা গতিঃ॥',
  E'Om sadyaḥ pātaka-saṁhantrī sadyo-duḥkha-vināśinī,\nsukhadā mokṣadā Gaṅgā Gaṅgaiva paramā gatiḥ.',
  20, true
where not exists (select 1 from public.temple_highlights where kind = 'deity' and title_en ilike '%ganga%');

-- Lord Shiva: daily puja text, only where no Bangla description was written yet
update public.temple_highlights set
  subtitle_en = coalesce(nullif(subtitle_en, ''), 'Daily puja · 7–8 AM'),
  subtitle_bn = coalesce(nullif(subtitle_bn, ''), 'নিত্যপূজা — প্রতিদিন সকাল ৭টা–৮টা'),
  body_en = coalesce(nullif(body_en, ''), 'Every morning from 7 to 8 AM, Lord Mahadev is worshipped with deep devotion. Amid the chanting of Vedic mantras, water is offered on the Shiva Linga (jalabhishek), followed by flowers, incense, lamps and aarti. Devotees join the prayer to seek His blessings for peace of mind and the welfare of all.'),
  body_bn = 'প্রতিদিন সকাল ৭টা থেকে ৮টা পর্যন্ত গভীর ভক্তি ও শ্রদ্ধার সঙ্গে দেবাদিদেব মহাদেবের পূজা-অর্চনা অনুষ্ঠিত হয়। বৈদিক মন্ত্রোচ্চারণের মধ্য দিয়ে শিবলিঙ্গে জলাভিষেক করা হয়, তারপর পুষ্পার্ঘ্য নিবেদন, ধূপ-দীপ প্রজ্বলন ও আরতির মাধ্যমে মহাদেবের উপাসনা সম্পন্ন হয়। ভক্তরা এই পবিত্র প্রার্থনায় অংশ নিয়ে মনের শান্তি ও সকলের মঙ্গল কামনায় ভোলানাথের আশীর্বাদ প্রার্থনা করেন।'
where kind = 'deity' and (title_en ilike '%shiv%' or title_en ilike '%mahadev%') and coalesce(body_bn, '') = '';
