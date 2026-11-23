// Search-engine (SEO) text for every public page.
// Used in two places:
//   1. scripts/seo-build.mjs — after `vite build`, writes a static HTML file per page with these
//      titles, descriptions and share-preview (Open Graph) tags, plus sitemap.xml and robots.txt
//   2. src/main.jsx (RouteSeo) — keeps the description and canonical link right while visitors move around
// Plain data only (no imports), so Node can read it without the bundler.

export const SITE_NAME = { en: 'Dhoom Vivekananda Samiti', bn: 'ধুম বিবেকানন্দ সমিতি' }
export const DEFAULT_SITE_URL = 'https://rbchy.github.io/dhoom-vivekananda-samiti/'
export const OG_IMAGE = 'og-image.jpg'

export const SEO_PAGES = [
  {
    path: '/',
    priority: '1.0',
    changefreq: 'weekly',
    title: { en: 'Dhoom Vivekananda Samiti — Temples & Community Clinic, Mirsharai, Chattogram', bn: 'ধুম বিবেকানন্দ সমিতি — মন্দির ও কমিউনিটি ক্লিনিক, মীরসরাই, চট্টগ্রাম' },
    description: {
      en: 'Dhoom Vivekananda Samiti (since 1923), Dhoom, Mirsharai, Chattogram: Ramakrishna, Kali, Durga and Shiv temples, a community clinic, festivals, puja timings and service work inspired by Sri Ramakrishna and Swami Vivekananda.',
      bn: 'ধুম বিবেকানন্দ সমিতি (১৯২৩ সাল থেকে), ধুম, মীরসরাই, চট্টগ্রাম: শ্রীশ্রী রামকৃষ্ণ, দক্ষিণকালিকা, দুর্গা ও শিব মন্দির, কমিউনিটি ক্লিনিক, পূজার সময়সূচি, উৎসব ও সেবাকাজ।'
    }
  },
  {
    path: '/calendar',
    priority: '0.8',
    changefreq: 'weekly',
    title: { en: 'Festival Calendar', bn: 'উৎসবের ক্যালেন্ডার' },
    description: {
      en: 'Puja and festival calendar of Dhoom Vivekananda Samiti — Kali Puja, Durga Puja, Basanti Puja, Shivaratri, Ramakrishna and Vivekananda Jayanti and other worship days.',
      bn: 'ধুম বিবেকানন্দ সমিতির পূজা ও উৎসবের ক্যালেন্ডার — কালীপূজা, দুর্গাপূজা, বাসন্তী পূজা, শিবরাত্রি, শ্রীরামকৃষ্ণ ও স্বামী বিবেকানন্দ জয়ন্তীসহ সব পূজার দিন।'
    }
  },
  {
    path: '/smriti-stambha',
    priority: '0.6',
    changefreq: 'yearly',
    title: { en: 'Smriti Stambha — Founders of the Samiti (1923)', bn: 'স্মৃতিস্তম্ভ — সমিতির প্রতিষ্ঠাতাগণ (১৯২৩)' },
    description: {
      en: 'In grateful memory of the founders who established Dhoom Vivekananda Samiti in 1923 in Dhoom, Mirsharai — the story of the Samiti and the names of its founding committee.',
      bn: '১৯২৩ সালে মীরসরাইয়ের ধুম গ্রামে যাঁরা ধুম বিবেকানন্দ সমিতি প্রতিষ্ঠা করেছিলেন, সেই প্রতিষ্ঠাতাদের কৃতজ্ঞ স্মরণে — সমিতির ইতিহাস ও প্রতিষ্ঠাকালীন কমিটির নাম।'
    }
  },
  {
    path: '/visits',
    priority: '0.6',
    changefreq: 'monthly',
    title: { en: 'Holy Visits', bn: 'পুণ্য আগমন' },
    description: {
      en: 'Monks and holy personalities who have visited Dhoom Vivekananda Samiti, Mirsharai, Chattogram.',
      bn: 'যেসব সন্ন্যাসী ও মহাত্মা ধুম বিবেকানন্দ সমিতিতে পদার্পণ করেছেন, তাঁদের পুণ্য আগমনের বিবরণ।'
    }
  },
  {
    path: '/bhavadhara',
    priority: '0.6',
    changefreq: 'monthly',
    title: { en: 'Ramakrishna–Vivekananda Bhavadhara Worldwide', bn: 'বিশ্বজুড়ে রামকৃষ্ণ–বিবেকানন্দ ভাবধারা' },
    description: {
      en: 'How the ideals of Sri Ramakrishna, Holy Mother Sri Sarada Devi and Swami Vivekananda spread around the world, and the Samiti’s place in that movement.',
      bn: 'শ্রীরামকৃষ্ণ, শ্রীশ্রী মা সারদা দেবী ও স্বামী বিবেকানন্দের ভাবধারা কীভাবে বিশ্বজুড়ে ছড়িয়েছে, আর সেই ধারায় ধুম বিবেকানন্দ সমিতির স্থান।'
    }
  },
  {
    path: '/donors',
    priority: '0.5',
    changefreq: 'monthly',
    title: { en: 'Honoured Donors', bn: 'দাতা সম্মাননা' },
    description: {
      en: 'Honoured donors and supporters of Dhoom Vivekananda Samiti’s temples, community clinic and service work.',
      bn: 'ধুম বিবেকানন্দ সমিতির মন্দির, কমিউনিটি ক্লিনিক ও সেবাকাজের সম্মানিত দাতা ও সহযোগীগণ।'
    }
  },
  {
    path: '/committee',
    priority: '0.5',
    changefreq: 'yearly',
    title: { en: 'Samiti Committee', bn: 'সমিতির কমিটি' },
    description: {
      en: 'The executive committee and office bearers of Dhoom Vivekananda Samiti, Mirsharai, Chattogram.',
      bn: 'ধুম বিবেকানন্দ সমিতির কার্যনির্বাহী কমিটি ও কর্মকর্তাগণ।'
    }
  },
  // The six institutions (ids match ORGANISATIONS in src/i18n-org.js)
  {
    path: '/org/ramakrishna', priority: '0.8', changefreq: 'monthly', schemaType: 'PlaceOfWorship',
    title: { en: 'Sree Sree Ramakrishna Mandir, Dhoom', bn: 'শ্রীশ্রী রামকৃষ্ণ মন্দির, ধুম' },
    description: {
      en: 'Sree Sree Ramakrishna Mandir of Dhoom Vivekananda Samiti, Mirsharai, Chattogram — daily worship, aarati timings, Friday prayer meeting and festivals.',
      bn: 'ধুম বিবেকানন্দ সমিতির শ্রীশ্রী রামকৃষ্ণ মন্দির, মীরসরাই, চট্টগ্রাম — নিত্যপূজা, আরতির সময়, শুক্রবারের প্রার্থনা সভা ও উৎসব।'
    }
  },
  {
    path: '/org/dakshin-kalika', priority: '0.8', changefreq: 'monthly', schemaType: 'HinduTemple',
    title: { en: 'Sree Sree Dokkhin Kalika Mandir, Dhoom', bn: 'শ্রীশ্রী দক্ষিণকালিকা মন্দির, ধুম' },
    description: {
      en: 'Sree Sree Dokkhin Kalika Mandir, Dhoom, Mirsharai, Chattogram — Kali Puja, daily worship and temple timings.',
      bn: 'শ্রীশ্রী দক্ষিণকালিকা মন্দির, ধুম, মীরসরাই, চট্টগ্রাম — কালীপূজা, নিত্যপূজা ও মন্দির খোলার সময়।'
    }
  },
  {
    path: '/org/durga', priority: '0.8', changefreq: 'monthly', schemaType: 'HinduTemple',
    title: { en: 'Sree Sree Basanti Durga Mandir, Dhoom', bn: 'শ্রীশ্রী বাসন্তী দুর্গা মন্দির, ধুম' },
    description: {
      en: 'Sree Sree Basanti Durga Mandir (established 2010), Dhoom, Mirsharai — Basanti Puja, Durga Puja and the ten-armed Mother Durga with her family.',
      bn: 'শ্রীশ্রী বাসন্তী দুর্গা মন্দির (প্রতিষ্ঠা ২০১০), ধুম, মীরসরাই — বাসন্তী পূজা, দুর্গাপূজা ও সপরিবারে দশভুজা মা দুর্গা।'
    }
  },
  {
    path: '/org/shiv', priority: '0.7', changefreq: 'monthly', schemaType: 'HinduTemple',
    title: { en: 'Sree Sree Shiv Mandir, Dhoom', bn: 'শ্রীশ্রী শিব মন্দির, ধুম' },
    description: {
      en: 'Sree Sree Shiv Mandir of Dhoom Vivekananda Samiti, Mirsharai, Chattogram — Shivaratri, daily worship and temple timings.',
      bn: 'ধুম বিবেকানন্দ সমিতির শ্রীশ্রী শিব মন্দির, মীরসরাই, চট্টগ্রাম — শিবরাত্রি, নিত্যপূজা ও মন্দিরের সময়সূচি।'
    }
  },
  {
    path: '/org/gourishankar', priority: '0.6', changefreq: 'monthly', schemaType: 'PlaceOfWorship',
    title: { en: 'Sree Sree GouriShankar Funeral Temple, Dhoom', bn: 'শ্রীশ্রী গৌরীশংকর শ্মশান মন্দির, ধুম' },
    description: {
      en: 'Sree Sree GouriShankar Funeral (cremation) Temple of Dhoom Vivekananda Samiti, Mirsharai, Chattogram.',
      bn: 'ধুম বিবেকানন্দ সমিতির শ্রীশ্রী গৌরীশংকর শ্মশান মন্দির, মীরসরাই, চট্টগ্রাম।'
    }
  },
  {
    path: '/org/clinic', priority: '0.8', changefreq: 'monthly', schemaType: 'MedicalClinic',
    title: { en: 'Dhoom Vivekananda Samiti Community Clinic', bn: 'ধুম বিবেকানন্দ সমিতি কমিউনিটি ক্লিনিক' },
    description: {
      en: 'Community clinic of Dhoom Vivekananda Samiti in Dhoom, Mirsharai, Chattogram — health care for the people of the area.',
      bn: 'ধুম, মীরসরাই, চট্টগ্রামে ধুম বিবেকানন্দ সমিতির কমিউনিটি ক্লিনিক — এলাকার মানুষের জন্য চিকিৎসাসেবা।'
    }
  }
]

// Pages search engines must not list
export const NOINDEX_PREFIXES = ['/admin']

export const ORG_ADDRESS = {
  streetAddress: 'Dhoom',
  addressLocality: 'Mirsharai',
  postalCode: '4328',
  addressRegion: 'Chattogram',
  addressCountry: 'BD'
}
export const ORG_GEO = { latitude: 22.8916846, longitude: 91.5123757 }

export function findSeoPage(pathname) {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/'
  return SEO_PAGES.find(page => page.path === clean) || null
}
