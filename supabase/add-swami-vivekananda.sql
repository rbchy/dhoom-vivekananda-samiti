-- Adds Swami Vivekananda to the deities section (Mission & Deities) with picture,
-- pranam mantra and Bangla/English description. Run once in Supabase → SQL Editor,
-- after pranam-mantra.sql. Safe to run again.
-- If a Swami Vivekananda card already exists, only its EMPTY fields are filled; nothing written
-- in Admin → Mission & Deities is overwritten. Descriptions are kept under the 800-character limit of a card.

insert into public.temple_highlights
  (kind, title_en, title_bn, subtitle_en, subtitle_bn, body_en, body_bn, image_url, pranam_bn, pranam_en, sort_order, is_active)
select 'deity', 'Swami Vivekananda', 'স্বামী বিবেকানন্দ',
  'Founder of the Ramakrishna Mission', 'বিশ্ববিজয়ী সন্ন্যাসী · রামকৃষ্ণ মিশনের প্রতিষ্ঠাতা',
  'Swami Vivekananda was born Narendranath Datta in Kolkata on 12 January 1863. In 1881 he met Sri Ramakrishna at Dakshineswar and found in him the guide of his life. His addresses at the Parliament of the World''s Religions in Chicago, beginning on 11 September 1893, carried the message of Vedanta and of India to the world. In 1897 he founded the Ramakrishna Mission and soon after built Belur Math on the Ganga. Sri Ramakrishna''s ideal of serving God in every being became the heart of his work. He entered mahasamadhi at Belur Math on 4 July 1902. His call still inspires: “Arise, awake, and stop not till the goal is reached.”',
  'স্বামী বিবেকানন্দ ১৮৬৩ সালের ১২ জানুয়ারি কলকাতায় জন্মগ্রহণ করেন; পূর্বাশ্রমের নাম নরেন্দ্রনাথ দত্ত। ১৮৮১ সালে দক্ষিণেশ্বরে শ্রীরামকৃষ্ণের সঙ্গে তাঁর প্রথম সাক্ষাৎ হয়, আর ঠাকুরের কাছেই তিনি পান জীবনের দিশা। ১৮৯৩ সালের ১১ সেপ্টেম্বর শিকাগো ধর্মমহাসভায় তাঁর ভাষণ সারা বিশ্বে বেদান্ত ও ভারতের বাণী পৌঁছে দেয়। ১৮৯৭ সালে তিনি রামকৃষ্ণ মিশন প্রতিষ্ঠা করেন এবং গঙ্গাতীরে বেলুড় মঠ গড়ে তোলেন। ঠাকুরের “শিবজ্ঞানে জীবসেবা”-র আদর্শই তাঁর কর্মযোগের মূলমন্ত্র। ১৯০২ সালের ৪ জুলাই বেলুড় মঠে তিনি মহাসমাধি লাভ করেন। তাঁর আহ্বান আজও প্রেরণা জোগায়: “ওঠো, জাগো, লক্ষ্যে না পৌঁছানো পর্যন্ত থেমো না।”',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/deities/swami-vivekananda.webp',
  E'ওঁ নমঃ শ্রীযতিরাজায় বিবেকানন্দসূরয়ে।\nসচ্চিৎসুখস্বরূপায় স্বামিনে তাপহারিণে॥',
  E'Om namaḥ śrī-yatirājāya Vivekānanda-sūraye,\nsac-cit-sukha-svarūpāya svāmine tāpa-hāriṇe.',
  15, true
where not exists (
  select 1 from public.temple_highlights where kind = 'deity' and (title_en ilike '%vivekananda%' or title_bn like '%বিবেকানন্দ%')
);

-- A card that already exists: fill only what is still empty
update public.temple_highlights set
  subtitle_en = coalesce(nullif(subtitle_en, ''), 'Founder of the Ramakrishna Mission'),
  subtitle_bn = coalesce(nullif(subtitle_bn, ''), 'বিশ্ববিজয়ী সন্ন্যাসী · রামকৃষ্ণ মিশনের প্রতিষ্ঠাতা'),
  body_en     = coalesce(nullif(body_en, ''), 'Swami Vivekananda was born Narendranath Datta in Kolkata on 12 January 1863. In 1881 he met Sri Ramakrishna at Dakshineswar and found in him the guide of his life. His addresses at the Parliament of the World''s Religions in Chicago, beginning on 11 September 1893, carried the message of Vedanta and of India to the world. In 1897 he founded the Ramakrishna Mission and soon after built Belur Math on the Ganga. Sri Ramakrishna''s ideal of serving God in every being became the heart of his work. He entered mahasamadhi at Belur Math on 4 July 1902. His call still inspires: “Arise, awake, and stop not till the goal is reached.”'),
  body_bn     = coalesce(nullif(body_bn, ''), 'স্বামী বিবেকানন্দ ১৮৬৩ সালের ১২ জানুয়ারি কলকাতায় জন্মগ্রহণ করেন; পূর্বাশ্রমের নাম নরেন্দ্রনাথ দত্ত। ১৮৮১ সালে দক্ষিণেশ্বরে শ্রীরামকৃষ্ণের সঙ্গে তাঁর প্রথম সাক্ষাৎ হয়, আর ঠাকুরের কাছেই তিনি পান জীবনের দিশা। ১৮৯৩ সালের ১১ সেপ্টেম্বর শিকাগো ধর্মমহাসভায় তাঁর ভাষণ সারা বিশ্বে বেদান্ত ও ভারতের বাণী পৌঁছে দেয়। ১৮৯৭ সালে তিনি রামকৃষ্ণ মিশন প্রতিষ্ঠা করেন এবং গঙ্গাতীরে বেলুড় মঠ গড়ে তোলেন। ঠাকুরের “শিবজ্ঞানে জীবসেবা”-র আদর্শই তাঁর কর্মযোগের মূলমন্ত্র। ১৯০২ সালের ৪ জুলাই বেলুড় মঠে তিনি মহাসমাধি লাভ করেন। তাঁর আহ্বান আজও প্রেরণা জোগায়: “ওঠো, জাগো, লক্ষ্যে না পৌঁছানো পর্যন্ত থেমো না।”'),
  image_url   = coalesce(nullif(image_url, ''), 'https://rbchy.github.io/dhoom-vivekananda-samiti/images/deities/swami-vivekananda.webp'),
  pranam_bn   = coalesce(nullif(pranam_bn, ''), E'ওঁ নমঃ শ্রীযতিরাজায় বিবেকানন্দসূরয়ে।\nসচ্চিৎসুখস্বরূপায় স্বামিনে তাপহারিণে॥'),
  pranam_en   = coalesce(nullif(pranam_en, ''), E'Om namaḥ śrī-yatirājāya Vivekānanda-sūraye,\nsac-cit-sukha-svarūpāya svāmine tāpa-hāriṇe.')
where kind = 'deity' and (title_en ilike '%vivekananda%' or title_bn like '%বিবেকানন্দ%');
