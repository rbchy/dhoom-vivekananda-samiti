-- =====================================================================
-- A separate page for each institution of the Samiti: /org/<id>
-- (e.g. /org/ramakrishna, /org/dakshin-kalika, /org/clinic).
-- The page text is kept in temple_content, one row per institution, with the
-- slug org-<id>. Edit it in Admin → Temple Content → "Which page".
-- temple_content already has its security rules and is in the Approvals list.
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================

-- Pranam mantra shown on the institution page (Bengali script + Roman letters)
alter table public.temple_content add column if not exists mantra_bn text;
alter table public.temple_content add column if not exists mantra_en text;
alter table public.temple_content drop constraint if exists temple_content_mantra_length;
alter table public.temple_content add constraint temple_content_mantra_length
  check ((mantra_bn is null or char_length(mantra_bn) <= 600) and (mantra_en is null or char_length(mantra_en) <= 600));

-- Draft pages (NOT published). Check the text in Admin, change what is not right,
-- tick "Publish" and save. Until a page is published, the website shows the short
-- description of the institution instead. Rows that already exist are never changed.
insert into public.temple_content (slug, title_en, title_bn, body_en, body_bn, mantra_bn, mantra_en, is_published, updated_at)
select v.slug, v.title_en, v.title_bn, v.body_en, v.body_bn, v.mantra_bn, v.mantra_en, false, now()
from (values
  ('org-ramakrishna', 'Sree Sree Ramakrishna Mandir', 'শ্রীশ্রী রামকৃষ্ণ মন্দির',
   E'Sree Sree Ramakrishna Mandir is the spiritual heart of Dhoom Vivekananda Samiti, dedicated to Thakur Sri Ramakrishna, Holy Mother Sri Sarada Devi and Swami Vivekananda.\n\nEvery day begins with Mangal Arati and ends with Sandhya Arati; on Fridays devotees gather for Sri Sri Ramakrishna Kathamrita Path, and on Sundays for bhajan, kirtan and weekly worship. Thakur''s Janmatithi and the Kalpataru Utsav on 1st January are celebrated with great joy.\n\nIn the spirit of Thakur''s message "as many faiths, so many paths", the temple welcomes everyone who seeks peace and God.',
   E'শ্রীশ্রী রামকৃষ্ণ মন্দির ধুম বিবেকানন্দ সমিতির আধ্যাত্মিক কেন্দ্র — ঠাকুর শ্রীরামকৃষ্ণ, শ্রীশ্রী মা সারদা দেবী ও স্বামী বিবেকানন্দের প্রতি উৎসর্গীকৃত।\n\nপ্রতিদিন মঙ্গল আরতিতে দিনের শুরু আর সন্ধ্যারতিতে দিনের সমাপ্তি; প্রতি শুক্রবার শ্রীশ্রীরামকৃষ্ণ কথামৃত পাঠ এবং প্রতি রবিবার ভজন, কীর্তন ও সাপ্তাহিক পূজায় ভক্তরা সমবেত হন। ঠাকুরের জন্মতিথি ও ১ জানুয়ারি কল্পতরু উৎসব মহা আনন্দে উদযাপিত হয়।\n\nঠাকুরের বাণী "যত মত, তত পথ" — এই ভাবধারায় শান্তি ও ঈশ্বরের সন্ধানী সকলের জন্য মন্দিরের দ্বার সদা উন্মুক্ত।',
   E'ওঁ স্থাপকায় চ ধর্মস্য সর্বধর্মস্বরূপিণে।\nঅবতারবরিষ্ঠায় রামকৃষ্ণায় তে নমঃ॥',
   E'Om sthāpakāya cha dharmasya sarva-dharma-svarūpiṇe,\navatāra-variṣṭhāya Rāmakṛṣṇāya te namaḥ.'),
  ('org-dakshin-kalika', 'Sree Sree Dokkhin Kalika Mandir', 'শ্রীশ্রী দক্ষিণকালিকা মন্দির',
   E'Sree Sree Dokkhin Kalika Mandir is dedicated to Mother Dakshina Kali, the compassionate Divine Mother who removes fear and darkness and protects her children.\n\nSri Ramakrishna himself worshipped the Mother as Dakshina Kali at Dakshineswar, and in that spirit devotees gather here every Saturday evening for Kali Puja and arati. The great Shyama Puja on the new-moon night of Kartik (Dipanwita Amavasya) is celebrated with deep devotion, lamps, pushpanjali and prasad.\n\nAll are welcome to come and offer their prayers at the Mother''s feet.',
   E'শ্রীশ্রী দক্ষিণকালিকা মন্দির করুণাময়ী জগজ্জননী মা দক্ষিণাকালীর মন্দির — যিনি ভয় ও অন্ধকার দূর করে সন্তানদের রক্ষা করেন।\n\nঠাকুর শ্রীরামকৃষ্ণ স্বয়ং দক্ষিণেশ্বরে মাকে দক্ষিণাকালী রূপে পূজা করেছিলেন; সেই ভাবধারায় এখানে প্রতি শনিবার সন্ধ্যায় কালীপূজা ও আরতি হয়। কার্তিক মাসের দীপান্বিতা অমাবস্যায় মহা শ্যামাপূজা প্রদীপ, পুষ্পাঞ্জলি ও প্রসাদ বিতরণের মাধ্যমে গভীর ভক্তিভরে উদযাপিত হয়।\n\nমায়ের চরণে প্রার্থনা জানাতে সকলকে সাদর আমন্ত্রণ।',
   E'ওঁ কালি কালি মহাকালি কালিকে পাপহারিণি।\nধর্মার্থমোক্ষদে দেবি নারায়ণি নমোঽস্তু তে॥',
   E'Om Kāli Kāli Mahākāli Kālike pāpa-hāriṇi,\ndharmārtha-mokṣade devi Nārāyaṇi namo''stu te.'),
  ('org-durga', 'Sree Sree Basanti Durga Mandir', 'শ্রীশ্রী বাসন্তী দুর্গা মন্দির',
   E'Sree Sree Basanti Durga Mandir, Dhoom (established 22 March 2010) is the home of the spring worship of Mother Durga. The mandap holds the ten-armed Mother with Lakshmi, Saraswati, Kartik, Ganesh and Lord Shiva.\n\nBasanti Durga Puja is the original spring worship of the Mother, celebrated in the bright fortnight of Chaitra, as first performed by King Suratha in the Markandeya Purana. From Saptami to Dashami the Mother is worshipped with Chandi Path, Sandhi Puja, pushpanjali, arati and prasad distribution.\n\nAll devotees are warmly invited to receive the Mother''s blessings.',
   E'ধূমের শ্রীশ্রী বাসন্তী দুর্গা মন্দির (স্থাপিত: ২২ মার্চ ২০১০) মা দুর্গার বসন্তকালীন আরাধনার পীঠস্থান। মন্দিরের মণ্ডপে লক্ষ্মী, সরস্বতী, কার্তিক, গণেশ ও দেবাদিদেব মহাদেবসহ দশভুজা মা দুর্গা অধিষ্ঠিত।\n\nবাসন্তী দুর্গাপূজা মা দুর্গার আদি বসন্তকালীন পূজা — মার্কণ্ডেয় পুরাণ অনুসারে রাজা সুরথ প্রথম এই পূজা করেছিলেন। চৈত্র মাসের শুক্লপক্ষে সপ্তমী থেকে দশমী পর্যন্ত চণ্ডীপাঠ, সন্ধিপূজা, পুষ্পাঞ্জলি, আরতি ও প্রসাদ বিতরণের মাধ্যমে মায়ের আরাধনা হয়।\n\nমায়ের আশীর্বাদ গ্রহণে সকল ভক্তকে আন্তরিক আমন্ত্রণ।',
   E'ওঁ সর্বমঙ্গলমঙ্গল্যে শিবে সর্বার্থসাধিকে।\nশরণ্যে ত্র্যম্বকে গৌরি নারায়ণি নমোঽস্তু তে॥',
   E'Om sarva-maṅgala-māṅgalye Śive sarvārtha-sādhike,\nśaraṇye tryambake Gauri Nārāyaṇi namo''stu te.'),
  ('org-shiv', 'Sree Sree Shiv Mandir', 'শ্রীশ্রী শিব মন্দির',
   E'Sree Sree Shiv Mandir of Dhoom Vivekananda Samiti is a peaceful abode of Lord Shiva, the auspicious one who is easily pleased by simple devotion. The temple also holds beautiful statues of Lord Shiva and Mother Ganga.\n\nEvery Monday evening devotees gather for Shiva Puja, offering water, milk, bel leaves and flowers on the Shivalinga with the chant "Om Namah Shivaya". Maha Shivaratri and the holy month of Shravan are observed with special worship and prasad distribution.\n\nSwami Vivekananda taught us to see Shiva in every being; in that spirit, all are welcome to come, pray and find peace here.',
   E'ধুম বিবেকানন্দ সমিতির শ্রীশ্রী শিব মন্দির দেবাদিদেব মহাদেবের এক শান্ত ও পবিত্র ধাম — যিনি সরল ভক্তিতেই প্রসন্ন হন। এই মন্দিরে মহাদেব ও মা গঙ্গার সুন্দর মূর্তিও প্রতিষ্ঠিত।\n\nপ্রতি সোমবার সন্ধ্যায় ভক্তরা শিবপূজায় সমবেত হয়ে "ওঁ নমঃ শিবায়" মন্ত্রে শিবলিঙ্গে জল, দুধ, বেলপাতা ও ফুল অর্পণ করেন। মহাশিবরাত্রি ও পবিত্র শ্রাবণ মাসে বিশেষ পূজা ও প্রসাদ বিতরণের আয়োজন করা হয়।\n\nস্বামী বিবেকানন্দ আমাদের শিখিয়েছেন জীবের মধ্যেই শিবকে দেখতে — সেই ভাবধারায় এখানে প্রার্থনা ও শান্তির জন্য সকলকে আন্তরিক আমন্ত্রণ।',
   E'ওঁ নমস্তুভ্যং বিরূপাক্ষ নমস্তে দিব্যচক্ষুষে।\nনমঃ পিনাকহস্তায় বজ্রহস্তায় বৈ নমঃ॥',
   E'Om namas-tubhyaṁ virūpākṣa namaste divya-cakṣuṣe,\nnamaḥ pināka-hastāya vajra-hastāya vai namaḥ.'),
  ('org-gourishankar', 'Sree Sree GouriShankar Funeral Temple (Mahashmashan)', 'শ্রীশ্রী গৌরীশংকর শ্মশান মন্দির (মহাশ্মশান)',
   E'Sree Sree GouriShankar Funeral Temple is the sacred cremation ground (Mahashmashan) of Dhoom, maintained by Dhoom Vivekananda Samiti.\n\nUnder the blessings of Lord Shiva and Mother Gouri, families can perform the last rites of their loved ones with dignity, peace and proper religious custom. The covered shelter gives mourners a calm place to sit, pray and bid farewell.\n\nThe Samiti keeps the ground clean and cared for, because every soul deserves a respectful journey home to God.',
   E'শ্রীশ্রী গৌরীশংকর শ্মশান মন্দির ধূমের পবিত্র মহাশ্মশান, যা ধুম বিবেকানন্দ সমিতি পরিচালনা ও রক্ষণাবেক্ষণ করে।\n\nদেবাদিদেব মহাদেব ও মা গৌরীর আশীর্বাদে এখানে পরিবারগুলো তাঁদের প্রিয়জনের অন্ত্যেষ্টিক্রিয়া মর্যাদা, শান্তি ও যথাযথ শাস্ত্রীয় রীতিতে সম্পন্ন করতে পারেন। ছাউনিযুক্ত আশ্রয়ে শোকার্ত স্বজনেরা শান্তভাবে বসে প্রার্থনা ও শেষ বিদায় জানাতে পারেন।\n\nসমিতি শ্মশান প্রাঙ্গণ পরিচ্ছন্ন ও সুরক্ষিত রাখে — কারণ প্রতিটি আত্মা সম্মানের সঙ্গে ঈশ্বরের কাছে ফেরার অধিকারী।',
   null, null),
  ('org-clinic', 'Dhoom Vivekananda Samiti Community Clinic', 'ধুম বিবেকানন্দ সমিতি কমিউনিটি ক্লিনিক',
   E'Inspired by Swami Vivekananda''s ideal of "serving Shiva in every being", the Dhoom Vivekananda Samiti Community Clinic stands beside the poor, the sick and the helpless.\n\nPoor and needy patients receive medical check-ups, doctor''s advice and essential medicines free of cost or at a very low price, and those who need further care are guided to the nearest hospital.\n\nEvery patient is received with care and respect, because serving people is our worship. We are grateful to the doctors, volunteers and donors whose support keeps this service running.',
   E'স্বামী বিবেকানন্দের "শিবজ্ঞানে জীবসেবা"-র আদর্শে অনুপ্রাণিত হয়ে ধুম বিবেকানন্দ সমিতি কমিউনিটি ক্লিনিক দরিদ্র, অসুস্থ ও অসহায় মানুষের পাশে দাঁড়ায়।\n\nএখানে দরিদ্র ও অসহায় রোগীদের বিনামূল্যে বা নামমাত্র মূল্যে স্বাস্থ্য পরীক্ষা, চিকিৎসকের পরামর্শ ও প্রয়োজনীয় ওষুধ দেওয়া হয় এবং প্রয়োজনে নিকটবর্তী হাসপাতালে যাওয়ার পরামর্শ দেওয়া হয়।\n\nপ্রত্যেক রোগীকে যত্ন ও সম্মানের সঙ্গে গ্রহণ করা হয়, কারণ মানুষের সেবাই আমাদের পূজা। যাঁদের সহযোগিতায় এই সেবা চলছে, সেই চিকিৎসক, স্বেচ্ছাসেবক ও দাতাদের প্রতি আমরা কৃতজ্ঞ।',
   null, null)
) as v(slug, title_en, title_bn, body_en, body_bn, mantra_bn, mantra_en)
where not exists (select 1 from public.temple_content c where c.slug = v.slug);
