// Sample content for the demo build only. Replace or extend freely; the real site reads Supabase.
import pandal from './images/pandal.webp'
import shrine from './images/shrine.webp'
import shivaLinga from './images/shiva-linga.webp'
import kaliSanctuary from './images/kali-sanctuary.webp'
import kaliDeity from './images/kali-deity.webp'
import marigold from './images/marigold.webp'
import templeSign from './images/temple-sign.webp'
import evKalpataru from './images/ev-kalpataru.webp'
import evRamakrishna from './images/ev-ramakrishna.webp'
import evSarada from './images/ev-sarada.webp'
import evVivekananda from './images/ev-vivekananda.webp'
import sqRamakrishna from './images/sq-ramakrishna.webp'
import sqSarada from './images/sq-sarada.webp'
import sqVivekananda from './images/sq-vivekananda.webp'

// Event dates are placed a few weeks after the day the demo is opened, so they always show as upcoming
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
let n = 0
const id = () => `demo-${++n}`
const created = i => new Date(Date.now() - i * 86400000).toISOString()

const hours = (day, start, end, sort) => ({ id: id(), day_of_week: day, title_en: 'Temple open', title_bn: 'মন্দির খোলা', start_time: start, end_time: end, is_closed: false, is_active: true, sort_order: sort })

export const DEMO_TABLES = {
  worship_schedule: [
    hours(null, '06:30:00', '07:00:00', 10), hours(null, '18:30:00', '19:15:00', 11),
    hours(1, '18:00:00', '19:00:00', 20), hours(2, '18:00:00', '19:00:00', 30), hours(3, '18:00:00', '19:00:00', 40),
    hours(4, '18:00:00', '19:00:00', 50), hours(5, '19:00:00', '20:30:00', 60), hours(6, '18:00:00', '19:00:00', 70),
    hours(0, '17:30:00', '18:30:00', 80), hours(0, '19:00:00', '22:00:00', 81)
  ],
  events: [
    { title_en: 'Holy Mother Sri Sarada Devi Janmatithi', title_bn: 'শ্রীশ্রী মা সারদা দেবীর জন্মতিথি', image: evSarada, days: 14 },
    { title_en: 'Kalpataru Utsav', title_bn: 'কল্পতরু উৎসব', image: evKalpataru, days: 30 },
    { title_en: 'Swami Vivekananda Janmatithi', title_bn: 'স্বামী বিবেকানন্দের জন্মতিথি', image: evVivekananda, days: 50 },
    { title_en: 'Sri Ramakrishna Janmatithi', title_bn: 'শ্রীশ্রী রামকৃষ্ণদেবের জন্মতিথি', image: evRamakrishna, days: 90 }
  ].map((e, i) => ({
    id: id(), is_published: true, title_en: e.title_en, title_bn: e.title_bn, image_url: e.image, event_date: inDays(e.days),
    description_en: 'Special puja, aarti, bhajan and prasad distribution. All are welcome. (Sample event: date shown for demonstration.)',
    description_bn: 'বিশেষ পূজা, আরতি, ভজন ও প্রসাদ বিতরণ। সকলে আমন্ত্রিত। (নমুনা অনুষ্ঠান: তারিখটি শুধু দেখানোর জন্য।)',
    opens_at: '06:30:00', puja_starts_at: i % 2 ? '10:00:00' : '09:30:00', closes_at: '21:00:00',
    location: 'Dhoom Vivekananda Samiti', created_at: created(i)
  })),
  gallery: [
    [pandal, 'Durga Puja pandal', 'দুর্গাপূজার মণ্ডপ', 'festivals', 'durga'],
    [shrine, 'Temple shrine', 'মন্দিরের গর্ভগৃহ', 'temple', 'shiv'],
    [shivaLinga, 'Shiva Linga', 'শিবলিঙ্গ', 'worship', 'shiv'],
    [kaliSanctuary, 'Kali sanctuary', 'কালী মন্দিরের গর্ভগৃহ', 'worship', 'dakshin-kalika'],
    [marigold, 'Marigold garden', 'গাঁদা ফুলের বাগান', 'temple', null],
    [templeSign, 'Temple signboard', 'মন্দিরের নামফলক', 'temple', null]
  ].map(([image_url, title_en, title_bn, category, organisation], i) => ({ id: id(), image_url, title_en, title_bn, category, organisation, is_published: true, created_at: created(i) })),
  announcements: [
    { title_en: 'Welcome to the demo', title_bn: 'ডেমোতে স্বাগতম', message_en: 'This is a demonstration copy of the website with sample content. Forms do not send anything.', message_bn: 'এটি নমুনা তথ্যসহ ওয়েবসাইটের একটি ডেমো কপি। ফর্ম থেকে কিছু পাঠানো হয় না।' },
    { title_en: 'Evening aarti every day', title_bn: 'প্রতিদিন সন্ধ্যা আরতি', message_en: 'Devotees are welcome to join the evening aarti. See the temple hours table for timings.', message_bn: 'ভক্তরা সন্ধ্যা আরতিতে যোগ দিতে পারেন। সময় জানতে মন্দির খোলার সময়ের টেবিল দেখুন।' }
  ].map((a, i) => ({ id: id(), is_published: true, created_at: created(i), ...a })),
  temple_content: [{
    id: id(), slug: 'about-temple', is_published: true, title_en: 'About the Samiti', title_bn: 'সমিতি সম্পর্কে',
    body_en: 'Dhoom Vivekananda Samiti is a religious, non-profit humanitarian organisation. It looks after its temples, holds daily worship and festivals, and serves the community through its clinic and social work.',
    body_bn: 'ধুম বিবেকানন্দ সমিতি একটি ধর্মীয়, অলাভজনক মানবকল্যাণমূলক সংগঠন। সমিতি তার মন্দিরগুলোর দেখাশোনা করে, প্রতিদিনের পূজা ও উৎসবের আয়োজন করে এবং ক্লিনিক ও সমাজসেবার মাধ্যমে মানুষের পাশে থাকে।'
  }],
  temple_highlights: [
    ['mission', 'Worship', 'পূজা ও উপাসনা', 'Daily puja and aarti, and the yearly festivals of the temples.', 'মন্দিরগুলোতে প্রতিদিনের পূজা-আরতি আর বছরের উৎসব।'],
    ['mission', 'Service', 'সেবা', 'A community clinic and help for people in need, in the spirit of Swami Vivekananda.', 'স্বামী বিবেকানন্দের আদর্শে কমিউনিটি ক্লিনিক ও অসহায় মানুষের সেবা।'],
    ['mission', 'Community', 'সমাজ', 'Bhajan, study circles and gatherings that bring devotees together.', 'ভজন, পাঠচক্র আর মিলনমেলা, যা ভক্তদের এক জায়গায় আনে।'],
    ['deity', 'Sri Ramakrishna', 'শ্রীশ্রী রামকৃষ্ণদেব', null, null, sqRamakrishna],
    ['deity', 'Holy Mother Sri Sarada Devi', 'শ্রীশ্রী মা সারদা দেবী', null, null, sqSarada],
    ['deity', 'Swami Vivekananda', 'স্বামী বিবেকানন্দ', null, null, sqVivekananda],
    ['deity', 'Ma Kali', 'মা কালী', null, null, kaliDeity]
  ].map(([kind, title_en, title_bn, body_en, body_bn, image_url], i) => ({ id: id(), kind, title_en, title_bn, body_en, body_bn, image_url: image_url || null, sort_order: i, is_active: true })),
  site_settings: [
    { key: 'festival_hours_note', value_en: 'Hours may change on festival days.', value_bn: 'উৎসবের দিনে সময় বদলাতে পারে।' }
  ],
  committee_contacts: [],
  // Same five sample names as supabase/smriti-stambha.sql
  smriti_stambha: [
      {
          "id": "5a3b1e00-0000-4000-8000-000000000001",
          "name_en": "Sri Haripada Chowdhury",
          "name_bn": "শ্রী হরিপদ চৌধুরী",
          "role_en": "Founder President",
          "role_bn": "প্রতিষ্ঠাতা সভাপতি",
          "years": "1985 – 2004",
          "tribute_en": "Gave the first land and gathered the villagers to start daily worship. (Sample entry)",
          "tribute_bn": "প্রথম জমি দান করে গ্রামবাসীদের নিয়ে নিত্যপূজা শুরু করেন। (নমুনা)",
          "is_late": true,
          "sort_order": 10,
          "photo_url": null,
          "is_published": true
      },
      {
          "id": "5a3b1e00-0000-4000-8000-000000000002",
          "name_en": "Smt. Sabitri Devi",
          "name_bn": "শ্রীমতী সাবিত্রী দেবী",
          "role_en": "Founder Member",
          "role_bn": "প্রতিষ্ঠাতা সদস্য",
          "years": "1985 – 2010",
          "tribute_en": "Looked after the bhog kitchen and the women's prayer circle for twenty-five years. (Sample entry)",
          "tribute_bn": "পঁচিশ বছর ভোগঘর আর মহিলাদের প্রার্থনাসভা দেখাশোনা করেছেন। (নমুনা)",
          "is_late": true,
          "sort_order": 20,
          "photo_url": null,
          "is_published": true
      },
      {
          "id": "5a3b1e00-0000-4000-8000-000000000003",
          "name_en": "Sri Gopal Chandra Nath",
          "name_bn": "শ্রী গোপাল চন্দ্র নাথ",
          "role_en": "First Secretary",
          "role_bn": "প্রথম সম্পাদক",
          "years": "1987 – 2015",
          "tribute_en": "Kept the first accounts book and built the Durga Mandir with volunteers. (Sample entry)",
          "tribute_bn": "প্রথম হিসাবের খাতা রাখেন এবং স্বেচ্ছাসেবকদের নিয়ে দুর্গা মন্দির গড়ে তোলেন। (নমুনা)",
          "is_late": true,
          "sort_order": 30,
          "photo_url": null,
          "is_published": true
      },
      {
          "id": "5a3b1e00-0000-4000-8000-000000000004",
          "name_en": "Dr. Ashok Kumar Das",
          "name_bn": "ডা. অশোক কুমার দাশ",
          "role_en": "Founder, Community Clinic",
          "role_bn": "কমিউনিটি ক্লিনিকের প্রতিষ্ঠাতা",
          "years": "1995 – present",
          "tribute_en": "Started the free clinic and still sees patients every Sunday. (Sample entry)",
          "tribute_bn": "বিনামূল্যের ক্লিনিক শুরু করেন, এখনও প্রতি রবিবার রোগী দেখেন। (নমুনা)",
          "is_late": false,
          "sort_order": 40,
          "photo_url": null,
          "is_published": true
      },
      {
          "id": "5a3b1e00-0000-4000-8000-000000000005",
          "name_en": "Sri Nitai Mitra",
          "name_bn": "শ্রী নিতাই মিত্র",
          "role_en": "Gita Teacher",
          "role_bn": "গীতা শিক্ষক",
          "years": "2001 – present",
          "tribute_en": "Teaches the Gita to the children of the village every Friday evening. (Sample entry)",
          "tribute_bn": "প্রতি শুক্রবার সন্ধ্যায় গ্রামের শিশুদের গীতা শেখান। (নমুনা)",
          "is_late": false,
          "sort_order": 50,
          "photo_url": null,
          "is_published": true
      }
  ]
}
