-- Adds the Sri Sri Basanti Durga Mandir photo (the pratima in the mandap, with the
-- temple's name board) to the website gallery, under Sree Sree Durga Mandir.
-- Run once in Supabase → SQL Editor. Safe to run again.
insert into public.gallery (title_en, title_bn, description_en, description_bn, image_url, category, organisation, is_published)
select 'Sri Sri Basanti Durga Mandir', 'শ্রী শ্রী বাসন্তী দুর্গা মন্দির',
  'Established on 22 March 2010, Sri Sri Basanti Durga Mandir is one of the sacred shrines of Dhoom Vivekananda Samiti. The mandap holds the ten-armed Mother Durga with Lakshmi, Saraswati, Kartik, Ganesh and Lord Shiva. Basanti Puja, the worship of the Mother in spring, is the temple''s main festival.',
  '২০১০ সালের ২২ মার্চ প্রতিষ্ঠিত শ্রী শ্রী বাসন্তী দুর্গা মন্দির ধুম বিবেকানন্দ সমিতির অন্যতম পবিত্র তীর্থস্থান। মণ্ডপে লক্ষ্মী, সরস্বতী, কার্তিক, গণেশ ও দেবাদিদেব মহাদেবসহ দশভুজা মা দুর্গা অধিষ্ঠিত। বসন্তকালে মায়ের আরাধনা, বাসন্তী পূজা, এই মন্দিরের প্রধান উৎসব।',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/gallery/basanti-durga-mandir.webp',
  'temple', 'durga', true
where not exists (select 1 from public.gallery where image_url like '%/images/gallery/basanti-durga-mandir.webp');

-- If the photo was added before, bring its title and description up to date
update public.gallery set title_en = 'Sri Sri Basanti Durga Mandir', title_bn = 'শ্রী শ্রী বাসন্তী দুর্গা মন্দির',
  description_en = 'Established on 22 March 2010, Sri Sri Basanti Durga Mandir is one of the sacred shrines of Dhoom Vivekananda Samiti. The mandap holds the ten-armed Mother Durga with Lakshmi, Saraswati, Kartik, Ganesh and Lord Shiva. Basanti Puja, the worship of the Mother in spring, is the temple''s main festival.',
  description_bn = '২০১০ সালের ২২ মার্চ প্রতিষ্ঠিত শ্রী শ্রী বাসন্তী দুর্গা মন্দির ধুম বিবেকানন্দ সমিতির অন্যতম পবিত্র তীর্থস্থান। মণ্ডপে লক্ষ্মী, সরস্বতী, কার্তিক, গণেশ ও দেবাদিদেব মহাদেবসহ দশভুজা মা দুর্গা অধিষ্ঠিত। বসন্তকালে মায়ের আরাধনা, বাসন্তী পূজা, এই মন্দিরের প্রধান উৎসব।'
where image_url like '%/images/gallery/basanti-durga-mandir.webp';
