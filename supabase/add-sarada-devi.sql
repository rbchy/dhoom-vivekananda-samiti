-- Adds Sri Sri Ma Sarada Devi to the deities section (Mission & Deities) with picture,
-- pranam mantra and Bangla/English description. Run once in Supabase → SQL Editor,
-- after pranam-mantra.sql. Safe to run again.
-- If a Sarada Devi card already exists, only its EMPTY fields are filled; nothing written
-- in Admin → Mission & Deities is overwritten. Descriptions are kept under the 800-character limit of a card.

insert into public.temple_highlights
  (kind, title_en, title_bn, subtitle_en, subtitle_bn, body_en, body_bn, image_url, pranam_bn, pranam_en, sort_order, is_active)
select 'deity', 'Sri Sri Ma Sarada Devi', 'শ্রীশ্রী মা সারদা দেবী',
  'Holy Mother of the Ramakrishna Order', 'সঙ্ঘজননী · শ্রীরামকৃষ্ণের লীলাসঙ্গিনী',
  'Sri Sri Ma Sarada Devi was born on 22 December 1853 at Jayrambati in Bankura district and was married to Sri Ramakrishna in her childhood. In 1872, at Dakshineswar, Sri Ramakrishna worshipped her as Shodashi, the Divine Mother. After his passing she became the spiritual mother of the Ramakrishna Order — “Mother” to monks and householders alike — and gave initiation and shelter to countless devotees, making no distinction between her own and others. She passed away on 21 July 1920 at the Udbodhan house in Kolkata. Her last words: “If you want peace, do not look for faults in others; look for your own. Learn to make the whole world your own. No one is a stranger, my child; this whole world is your own.”',
  'শ্রীশ্রী মা সারদা দেবী ১৮৫৩ সালের ২২ ডিসেম্বর বাঁকুড়া জেলার জয়রামবাটী গ্রামে জন্মগ্রহণ করেন। শৈশবেই শ্রীরামকৃষ্ণের সঙ্গে তাঁর বিবাহ হয়। ১৮৭২ সালে দক্ষিণেশ্বরে ফলহারিণী কালীপূজার রাতে ঠাকুর তাঁকে ষোড়শীরূপে পূজা করেন। ঠাকুরের দেহত্যাগের পর তিনিই রামকৃষ্ণ সঙ্ঘের আধ্যাত্মিক জননী — সন্ন্যাসী ও গৃহী সকলের “মা”। আপন-পর ভেদ না করে অসংখ্য ভক্তকে তিনি দীক্ষা ও আশ্রয় দিয়েছেন। ১৯২০ সালের ২১ জুলাই কলকাতার উদ্বোধন ভবনে তিনি দেহত্যাগ করেন। তাঁর শেষ উপদেশ: “যদি শান্তি চাও, মা, কারও দোষ দেখো না, দোষ দেখবে নিজের। জগৎকে আপনার করে নিতে শেখো। কেউ পর নয়, মা, জগৎ তোমার।”',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/deities/sarada-devi.webp',
  E'যথাগ্নের্দাহিকা শক্তিঃ রামকৃষ্ণে স্থিতা হি যা।\nসর্ববিদ্যাস্বরূপাং তাং সারদাং প্রণমাম্যহম্॥',
  E'Yathāgner dāhikā śaktiḥ Rāmakṛṣṇe sthitā hi yā,\nsarva-vidyā-svarūpāṁ tāṁ Sāradāṁ praṇamāmy aham.',
  10, true
where not exists (
  select 1 from public.temple_highlights where kind = 'deity' and (title_en ilike '%sarada%' or title_bn like '%সারদা%')
);

-- A card that already exists: fill only what is still empty
update public.temple_highlights set
  subtitle_bn = coalesce(nullif(subtitle_bn, ''), 'সঙ্ঘজননী · শ্রীরামকৃষ্ণের লীলাসঙ্গিনী'),
  subtitle_en = coalesce(nullif(subtitle_en, ''), 'Holy Mother of the Ramakrishna Order'),
  body_en     = coalesce(nullif(body_en, ''), 'Sri Sri Ma Sarada Devi was born on 22 December 1853 at Jayrambati in Bankura district and was married to Sri Ramakrishna in her childhood. In 1872, at Dakshineswar, Sri Ramakrishna worshipped her as Shodashi, the Divine Mother. After his passing she became the spiritual mother of the Ramakrishna Order — “Mother” to monks and householders alike — and gave initiation and shelter to countless devotees, making no distinction between her own and others. She passed away on 21 July 1920 at the Udbodhan house in Kolkata. Her last words: “If you want peace, do not look for faults in others; look for your own. Learn to make the whole world your own. No one is a stranger, my child; this whole world is your own.”'),
  body_bn     = coalesce(nullif(body_bn, ''), 'শ্রীশ্রী মা সারদা দেবী ১৮৫৩ সালের ২২ ডিসেম্বর বাঁকুড়া জেলার জয়রামবাটী গ্রামে জন্মগ্রহণ করেন। শৈশবেই শ্রীরামকৃষ্ণের সঙ্গে তাঁর বিবাহ হয়। ১৮৭২ সালে দক্ষিণেশ্বরে ফলহারিণী কালীপূজার রাতে ঠাকুর তাঁকে ষোড়শীরূপে পূজা করেন। ঠাকুরের দেহত্যাগের পর তিনিই রামকৃষ্ণ সঙ্ঘের আধ্যাত্মিক জননী — সন্ন্যাসী ও গৃহী সকলের “মা”। আপন-পর ভেদ না করে অসংখ্য ভক্তকে তিনি দীক্ষা ও আশ্রয় দিয়েছেন। ১৯২০ সালের ২১ জুলাই কলকাতার উদ্বোধন ভবনে তিনি দেহত্যাগ করেন। তাঁর শেষ উপদেশ: “যদি শান্তি চাও, মা, কারও দোষ দেখো না, দোষ দেখবে নিজের। জগৎকে আপনার করে নিতে শেখো। কেউ পর নয়, মা, জগৎ তোমার।”'),
  image_url   = coalesce(nullif(image_url, ''), 'https://rbchy.github.io/dhoom-vivekananda-samiti/images/deities/sarada-devi.webp'),
  pranam_bn   = coalesce(nullif(pranam_bn, ''), E'যথাগ্নের্দাহিকা শক্তিঃ রামকৃষ্ণে স্থিতা হি যা।\nসর্ববিদ্যাস্বরূপাং তাং সারদাং প্রণমাম্যহম্॥'),
  pranam_en   = coalesce(nullif(pranam_en, ''), E'Yathāgner dāhikā śaktiḥ Rāmakṛṣṇe sthitā hi yā,\nsarva-vidyā-svarūpāṁ tāṁ Sāradāṁ praṇamāmy aham.')
where kind = 'deity' and (title_en ilike '%sarada%' or title_bn like '%সারদা%');
