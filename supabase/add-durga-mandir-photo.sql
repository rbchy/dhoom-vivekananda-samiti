-- Adds the Sri Sri Basanti Durga Mandir photo (the pratima in the mandap, with the
-- temple's name board) to the website gallery, under Sree Sree Durga Mandir.
-- Run once in Supabase → SQL Editor. Safe to run again.
insert into public.gallery (title_en, title_bn, description_en, description_bn, image_url, category, organisation, is_published)
select 'Sri Sri Basanti Durga Mandir', 'শ্রী শ্রী বাসন্তী দুর্গা মন্দির',
  'The Durga pratima with Lakshmi, Saraswati, Kartik, Ganesh and Lord Shiva in the mandap of Sri Sri Basanti Durga Mandir, Dhoom. Established 22 March 2010.',
  'শ্রী শ্রী বাসন্তী দুর্গা মন্দিরের মণ্ডপে লক্ষ্মী, সরস্বতী, কার্তিক, গণেশ ও শিবসহ মা দুর্গার প্রতিমা। স্থাপিত: ২২ শে মার্চ ২০১০ ইং।',
  'https://rbchy.github.io/dhoom-vivekananda-samiti/images/gallery/basanti-durga-mandir.webp',
  'temple', 'durga', true
where not exists (select 1 from public.gallery where image_url like '%/images/gallery/basanti-durga-mandir.webp');
