-- Founders of 1923 on the Smriti Stambha + the Samiti's own Bhavadhara directory entry
-- + longer "About" text (up to 3000 characters) in the Bhavadhara directory.
-- Run once in Supabase → SQL Editor. Safe to run again (it updates the same rows).

begin;

-- 1. Bhavadhara directory: allow a longer About text (was 1000)
alter table public.bhavadhara_orgs drop constraint if exists bhavadhara_orgs_about_en_check;
alter table public.bhavadhara_orgs drop constraint if exists bhavadhara_orgs_about_bn_check;
alter table public.bhavadhara_orgs add constraint bhavadhara_orgs_about_en_check check (about_en is null or char_length(about_en) <= 3000);
alter table public.bhavadhara_orgs add constraint bhavadhara_orgs_about_bn_check check (about_bn is null or char_length(about_bn) <= 3000);

-- 2. Smriti Stambha: remove the five sample founders, add the real founders of 1923
delete from public.smriti_stambha where id::text like '5a3b1e00-%';

insert into public.smriti_stambha (id, name_en, name_bn, role_en, role_bn, years, tribute_en, tribute_bn, is_late, sort_order) values
  ('d1922000-0000-4000-8000-000000000001', $q$Dr. Chittaharan Dutta$q$, $q$ডা. চিত্তহরণ দত্ত$q$, $q$Founder Member$q$, $q$প্রতিষ্ঠাতা সদস্য$q$, null,
   $q$A physician by profession and a devotee at heart, Dr. Chittaharan Dutta was among the first to dream of a Samiti in Dhoom inspired by Sri Ramakrishna and Swami Vivekananda. He helped found the Samiti in 1923 and guided its early service to the village. With great generosity he donated land on which the temple of Sri Sri Thakur and Maa Kali stands today, where daily worship continues. His gift remains the spiritual heart of the Samiti.$q$,
   $q$পেশায় চিকিৎসক আর অন্তরে একনিষ্ঠ ভক্ত ডা. চিত্তহরণ দত্ত শ্রীরামকৃষ্ণ ও স্বামী বিবেকানন্দের আদর্শে ধুমে একটি সমিতি গড়ার প্রথম স্বপ্নদ্রষ্টাদের একজন। ১৯২৩ সালে সমিতি প্রতিষ্ঠায় তিনি অগ্রণী ভূমিকা রাখেন এবং গ্রামের সেবাকাজের শুরুতে পথ দেখান। তাঁর দান করা জমিতেই আজকের শ্রীশ্রীঠাকুর ও মা কালীর মন্দির দাঁড়িয়ে আছে, যেখানে আজও নিত্যপূজা হয়। তাঁর এই দান সমিতির আধ্যাত্মিক কেন্দ্র হয়ে আছে।$q$, true, 10),
  ('d1922000-0000-4000-8000-000000000002', $q$Sri Rohini Kumar Acharya$q$, $q$শ্রী রোহিণী কুমার আচার্য্য$q$, $q$Founder Member$q$, $q$প্রতিষ্ঠাতা সদস্য$q$, null,
   $q$Sri Rohini Kumar Acharya was one of the founding members who brought the message of Sri Ramakrishna and Swami Vivekananda to this remote village in 1923. In the Samiti's early years he worked with his fellow founders to serve the poor, to found a girls' school for women's education, and to help pilgrims reach the Chandranath Temple during the Shiva Chaturdashi fair. His devotion and selfless effort helped build the foundation on which the Samiti still stands.$q$,
   $q$১৯২৩ সালে যাঁরা শ্রীরামকৃষ্ণ ও স্বামী বিবেকানন্দের বাণী এই প্রত্যন্ত গ্রামে নিয়ে আসেন, শ্রী রোহিণী কুমার আচার্য্য তাঁদের অন্যতম প্রতিষ্ঠাতা সদস্য। সমিতির শুরুর দিনগুলোতে তিনি সহ-প্রতিষ্ঠাতাদের সঙ্গে দরিদ্রসেবা, নারীশিক্ষার জন্য বালিকা বিদ্যালয় প্রতিষ্ঠা এবং শিবচতুর্দশী মেলায় তীর্থযাত্রীদের চন্দ্রনাথ মন্দির দর্শনে সহায়তায় নিজেকে নিয়োজিত করেন। তাঁর ভক্তি ও নিঃস্বার্থ শ্রমেই গড়ে ওঠে সমিতির ভিত্তি।$q$, true, 20),
  ('d1922000-0000-4000-8000-000000000003', $q$Sri Jagabandhu Nath$q$, $q$শ্রী জগবন্ধু নাথ$q$, $q$Founder Member$q$, $q$প্রতিষ্ঠাতা সদস্য$q$, null,
   $q$Sri Jagabandhu Nath was a founding member of the Dhoom Vivekananda Samiti in 1923. Inspired by Swamiji's ideal of serving Shiva in every being, he took part in the Samiti's early work of serving the poor, holding cultural programmes and spinning on the charkha in the Swadeshi spirit. He was part of the village community that welcomed Mahatma Gandhi to the Samiti. The weekly prayer meeting and the spirit of service that he helped begin continue to this day.$q$,
   $q$শ্রী জগবন্ধু নাথ ১৯২৩ সালে ধুম বিবেকানন্দ সমিতির অন্যতম প্রতিষ্ঠাতা সদস্য। স্বামীজীর “শিবজ্ঞানে জীবসেবা” আদর্শে অনুপ্রাণিত হয়ে তিনি সমিতির প্রথম দিকের দরিদ্রসেবা, সাংস্কৃতিক অনুষ্ঠান ও স্বদেশী আদর্শে চরকায় সুতা কাটার কাজে যুক্ত ছিলেন। মহাত্মা গান্ধীকে সমিতিতে স্বাগত জানানো গ্রামবাসীদের মধ্যে তিনিও ছিলেন। তাঁর হাতে শুরু হওয়া প্রার্থনা সভা আর সেবার ধারা আজও বহমান।$q$, true, 30),
  ('d1922000-0000-4000-8000-000000000004', $q$Sri Dhirendra Kumar Dutta$q$, $q$শ্রী ধীরেন্দ্র কুমার দত্ত$q$, $q$Founder Member$q$, $q$প্রতিষ্ঠাতা সদস্য$q$, null,
   $q$Sri Dhirendra Kumar Dutta was among the devoted founders who established the Dhoom Vivekananda Samiti in 1923, guided by the ideal of “Atmano mokshartham jagad hitaya cha” (for one's own liberation and the welfare of the world). He gave his time and energy to the Samiti's early prayer meetings and service work in the village. Through his dedication he helped plant a tradition of worship and service that has now reached its second century.$q$,
   $q$“আত্মনো মোক্ষার্থং জগদ্ধিতায় চ” আদর্শে ১৯২৩ সালে যাঁরা ধুম বিবেকানন্দ সমিতি প্রতিষ্ঠা করেন, শ্রী ধীরেন্দ্র কুমার দত্ত তাঁদের অন্যতম। সমিতির প্রথম দিকের প্রার্থনা সভা ও গ্রামের সেবাকাজে তিনি নিজের সময় ও শ্রম উৎসর্গ করেন। তাঁর নিষ্ঠায় যে পূজা ও সেবার ধারা শুরু হয়েছিল, তা আজ শতবর্ষ পেরিয়ে দ্বিতীয় শতাব্দীতে পৌঁছেছে।$q$, true, 40),
  ('d1922000-0000-4000-8000-000000000005', $q$Dr. Bipin Acharya$q$, $q$ডা. বিপিন আচার্য$q$, $q$Patron & Supporter$q$, $q$পৃষ্ঠপোষক ও সহযোগী$q$, null,
   $q$Dr. Bipin Acharya stood beside the founders of the Dhoom Vivekananda Samiti when it was established in 1923. His support helped Dr. Chittaharan Dutta, Sri Rohini Kumar Acharya, Sri Jagabandhu Nath, Sri Dhirendra Kumar Dutta and their companions turn a devotee's dream into a living institution in this remote village. Inspired by Sri Ramakrishna and Swami Vivekananda, he helped open the way for the Samiti's century of worship and service. We remember his kindness with deep gratitude.$q$,
   $q$১৯২৩ সালে ধুম বিবেকানন্দ সমিতি প্রতিষ্ঠার সময় ডা. বিপিন আচার্য প্রতিষ্ঠাতাদের পাশে দাঁড়িয়েছিলেন। তাঁর সহযোগিতায় ডা. চিত্তহরণ দত্ত, শ্রী রোহিণী কুমার আচার্য্য, শ্রী জগবন্ধু নাথ, শ্রী ধীরেন্দ্র কুমার দত্ত ও তাঁদের সঙ্গীরা এই প্রত্যন্ত গ্রামে ভক্তির স্বপ্নকে একটি জীবন্ত প্রতিষ্ঠানে রূপ দিতে পেরেছিলেন। শ্রীরামকৃষ্ণ ও স্বামী বিবেকানন্দের আদর্শে অনুপ্রাণিত হয়ে তিনি সমিতির শতবর্ষের পূজা ও সেবার পথ খুলে দিতে সাহায্য করেন। তাঁর উদারতাকে আমরা গভীর কৃতজ্ঞতায় স্মরণ করি।$q$, true, 50)
on conflict (id) do update set
  name_en = excluded.name_en, name_bn = excluded.name_bn, role_en = excluded.role_en, role_bn = excluded.role_bn,
  tribute_en = excluded.tribute_en, tribute_bn = excluded.tribute_bn,
  is_late = excluded.is_late, sort_order = excluded.sort_order, is_published = true;

-- 3. Bhavadhara directory: the Samiti's own entry (approved)
insert into public.bhavadhara_orgs (id, name_en, name_bn, org_type, country, city, address, website, founded_year, about_en, about_bn, status, sort_order) values
  ('d1922000-0000-4000-8000-0000000000aa', 'Dhoom Vivekananda Samiti', 'ধুম বিবেকানন্দ সমিতি', 'samiti', 'Bangladesh', 'Mirsarai, Chattogram',
   'Dhoom Village, No. 4 Dhoom Union, Mirsarai, Chattogram', 'https://rbchy.github.io/dhoom-vivekananda-samiti/', 1923,
   $q$Dhoom Vivekananda Samiti is a religious and humanitarian organisation inspired by Sri Ramakrishna, Holy Mother Sri Sarada Devi and Swami Vivekananda. It was founded in 1923 in the remote village of Dhoom by Dr. Chittaharan Dutta, Sri Rohini Kumar Acharya, Sri Jagabandhu Nath, Sri Dhirendra Kumar Dutta and others, with the support of Dr. Bipin Acharya, and celebrated its centenary in 2023.

In its early years the Samiti founded a girls' school, helped pilgrims at the Shiva Chaturdashi fair in Sitakunda reach the Chandranath Temple, served the poor, held cultural programmes and spun cotton on the charkha in the Swadeshi spirit. Mahatma Gandhi visited the Samiti during the freedom movement; at his suggestion the weekly prayer meeting moved to Friday with “Raghupati Raghava Raja Ram”, a tradition that continues today.

Guided by Swamiji's ideal of “serving Shiva in every being”, the Samiti looks after five temples of Dhoom, runs a community clinic with a free monthly medical camp, cares for the cremation temple, distributes clothes to people in need every year, teaches the Gita to children and helps with education and marriage. The birthdays of Thakur, Maa and Swamiji, Basanti Durga Puja and Shyama Puja are celebrated, and monks of Belur Math and Ramakrishna Math, Dhaka, attend the annual festival every year. President: Prof. Dulal Chandra Nath.$q$,
   $q$ধুম বিবেকানন্দ সমিতি শ্রীরামকৃষ্ণ, শ্রীশ্রী মা সারদা দেবী ও স্বামী বিবেকানন্দের আদর্শে অনুপ্রাণিত একটি ধর্মীয় ও মানবকল্যাণমূলক প্রতিষ্ঠান। ডা. চিত্তহরণ দত্ত, শ্রী রোহিণী কুমার আচার্য্য, শ্রী জগবন্ধু নাথ, শ্রী ধীরেন্দ্র কুমার দত্ত প্রমুখের উদ্যোগে এবং ডা. বিপিন আচার্যের সহযোগিতায় ১৯২৩ সালে প্রত্যন্ত গ্রাম ধুমে সমিতি প্রতিষ্ঠিত হয়। ২০২৩ সালে সমিতি শতবর্ষ পূর্ণ করেছে।

শুরুর দিকে সমিতি নারীশিক্ষার জন্য বালিকা বিদ্যালয় প্রতিষ্ঠা করে, সীতাকুণ্ডের শিবচতুর্দশী মেলায় তীর্থযাত্রীদের চন্দ্রনাথ মন্দির দর্শনে সহায়তা করে, এবং দরিদ্রসেবা, সাংস্কৃতিক অনুষ্ঠান ও স্বদেশী আদর্শে চরকায় সুতা কাটার কাজ চালায়। স্বাধীনতা আন্দোলনের সময় মহাত্মা গান্ধী সমিতি পরিদর্শন করেন; তাঁর পরামর্শে সাপ্তাহিক প্রার্থনা সভা শুক্রবারে আনা হয় এবং “রঘুপতি রাঘব রাজা রাম” গাওয়া শুরু হয় — এই প্রথা আজও চলছে।

স্বামীজীর “শিবজ্ঞানে জীবসেবা”-র আদর্শে সমিতি ধুমের পাঁচটি মন্দির পরিচালনা করে, মাসিক বিনামূল্যে চিকিৎসাসহ একটি কমিউনিটি ক্লিনিক চালায়, শ্মশান মন্দিরের দেখাশোনা করে, প্রতি বছর দুঃস্থদের মাঝে বস্ত্র বিতরণ করে, শিশুদের গীতা শিক্ষা দেয় এবং শিক্ষা ও বিবাহে সাহায্য করে। ঠাকুর, মা ও স্বামীজীর জন্মোৎসব, বাসন্তী দুর্গাপূজা ও শ্যামাপূজা পালিত হয়, এবং প্রতি বছর বেলুড় মঠ ও ঢাকা রামকৃষ্ণ মঠের সন্ন্যাসীরা বার্ষিক উৎসবে আসেন। সভাপতি: অধ্যাপক দুলাল চন্দ্র নাথ।$q$,
   'approved', 1)
on conflict (id) do update set
  name_en = excluded.name_en, name_bn = excluded.name_bn, org_type = excluded.org_type, country = excluded.country,
  city = excluded.city, address = excluded.address, website = excluded.website, founded_year = excluded.founded_year,
  about_en = excluded.about_en, about_bn = excluded.about_bn, status = excluded.status, sort_order = excluded.sort_order;

commit;
