-- =====================================================================
-- Pranam mantra (প্রণাম মন্ত্র) for each presiding deity, shown on the
-- website under the deity's picture and name.
-- Run once in Supabase → SQL Editor, after site-extras-schema.sql. Safe to run again.
-- It fills the mantra only where a deity has none yet, matching by the English name;
-- edit or add mantras later in Admin → Mission & Deities.
-- =====================================================================

alter table public.temple_highlights add column if not exists pranam_bn text;
alter table public.temple_highlights add column if not exists pranam_en text;

alter table public.temple_highlights drop constraint if exists temple_highlights_pranam_length;
alter table public.temple_highlights add constraint temple_highlights_pranam_length
  check ((pranam_bn is null or char_length(pranam_bn) <= 400) and (pranam_en is null or char_length(pranam_en) <= 400));

-- Traditional pranam mantras (Bengali script, and a Roman transliteration for other languages)
with mantras(pattern, bn, en) as (values
  ('%ramakrishna%',
   E'ওঁ স্থাপকায় চ ধর্মস্য সর্বধর্মস্বরূপিণে।\nঅবতারবরিষ্ঠায় রামকৃষ্ণায় তে নমঃ॥',
   E'Om sthāpakāya cha dharmasya sarva-dharma-svarūpiṇe,\navatāra-variṣṭhāya Rāmakṛṣṇāya te namaḥ.'),
  ('%sarada%',
   E'ওঁ জননীং সারদাং দেবীং রামকৃষ্ণং জগদ্‌গুরুম্‌।\nপাদপদ্মে তয়োঃ শ্রিত্বা প্রণমামি মুহুর্মুহুঃ॥',
   E'Om jananīṁ Sāradāṁ devīṁ Rāmakṛṣṇaṁ jagad-gurum,\npāda-padme tayoḥ śritvā praṇamāmi muhur-muhuḥ.'),
  ('%vivekananda%',
   E'ওঁ নমঃ শ্রীযতিরাজায় বিবেকানন্দসূরয়ে।\nসচ্চিৎসুখস্বরূপায় স্বামিনে তাপহারিণে॥',
   E'Om namaḥ śrī-yatirājāya Vivekānanda-sūraye,\nsac-cit-sukha-svarūpāya svāmine tāpa-hāriṇe.'),
  ('%kali%',
   E'ওঁ কালি কালি মহাকালি কালিকে পাপহারিণি।\nধর্মার্থমোক্ষদে দেবি নারায়ণি নমোঽস্তু তে॥',
   E'Om Kāli Kāli Mahākāli Kālike pāpa-hāriṇi,\ndharmārtha-mokṣade devi Nārāyaṇi namo''stu te.'),
  ('%durga%',
   E'ওঁ সর্বমঙ্গলমঙ্গল্যে শিবে সর্বার্থসাধিকে।\nশরণ্যে ত্র্যম্বকে গৌরি নারায়ণি নমোঽস্তু তে॥',
   E'Om sarva-maṅgala-māṅgalye Śive sarvārtha-sādhike,\nśaraṇye tryambake Gauri Nārāyaṇi namo''stu te.'),
  ('%shiv%',
   E'ওঁ নমস্তুভ্যং বিরূপাক্ষ নমস্তে দিব্যচক্ষুষে।\nনমঃ পিনাকহস্তায় বজ্রহস্তায় বৈ নমঃ॥',
   E'Om namas-tubhyaṁ virūpākṣa namaste divya-cakṣuṣe,\nnamaḥ pināka-hastāya vajra-hastāya vai namaḥ.')
)
update public.temple_highlights h
set pranam_bn = m.bn, pranam_en = m.en
from mantras m
where h.kind = 'deity' and h.pranam_bn is null and h.pranam_en is null
  and h.title_en ilike m.pattern
  -- "Sri Ramakrishna" must not also match a title like "Ramakrishna and Sarada"
  and (m.pattern <> '%ramakrishna%' or h.title_en not ilike '%sarada%');
