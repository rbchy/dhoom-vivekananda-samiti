-- Adds Sri Surya Dev to "Deities Worshipped Here" with picture, pranam mantra and
-- description in Bangla and English. Run once in Supabase → SQL Editor, after
-- pranam-mantra.sql. Does nothing if a Surya card already exists.
insert into public.temple_highlights
  (kind, title_en, title_bn, subtitle_en, subtitle_bn, body_en, body_bn, image_url, pranam_bn, pranam_en, sort_order, is_active)
select 'deity', 'Sri Surya Dev', 'শ্রীশ্রী সূর্যদেব',
  'Annual puja', 'বার্ষিক পূজা',
  'Once a year the temple holds a special puja of Lord Surya, the giver of light, life and health. With the chanting of Vedic mantras, arghya (water) is offered to the Sun, followed by red flowers, incense, lamps and aarti. Devotees pray for good health, energy and the welfare of all.',
  'বছরে একবার আলো, প্রাণ ও আরোগ্যের দেবতা শ্রীশ্রী সূর্যদেবের বিশেষ পূজা অনুষ্ঠিত হয়। বৈদিক মন্ত্রোচ্চারণের সঙ্গে সূর্যদেবকে অর্ঘ্য (জল) নিবেদন, রক্তপুষ্প অর্পণ, ধূপ-দীপ প্রজ্বলন ও আরতির মাধ্যমে তাঁর উপাসনা করা হয়। ভক্তরা সুস্বাস্থ্য, শক্তি ও সকলের কল্যাণ কামনায় সূর্যদেবের আশীর্বাদ প্রার্থনা করেন।',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/deities/surya-dev.webp',
  E'ওঁ জবাকুসুমসঙ্কাশং কাশ্যপেয়ং মহাদ্যুতিম্‌।\nধ্বান্তারিং সর্বপাপঘ্নং প্রণতোঽস্মি দিবাকরম্‌॥',
  E'Om japā-kusuma-saṅkāśaṁ kāśyapeyaṁ mahā-dyutim,\ndhvāntāriṁ sarva-pāpaghnaṁ praṇato''smi divākaram.',
  90, true
where not exists (
  select 1 from public.temple_highlights
  where kind = 'deity' and (title_en ilike '%surya%' or title_en ilike '%surjya%')
);
