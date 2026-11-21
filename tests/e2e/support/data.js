// Sample rows the fake Supabase answers with. Dates are fixed: the tests freeze the
// browser clock at TODAY, so "upcoming" and the calendar month never drift.
export const TODAY = '2026-11-20T10:00:00+06:00'

const img = path => `/images/${path}`

export function sampleTables() {
  return {
    worship_schedule: [
      { id: 'ws-1', day_of_week: null, title_en: 'Morning aarti', title_bn: 'সকালের আরতি', start_time: '06:30:00', end_time: '07:00:00', is_closed: false, is_active: true, sort_order: 10 },
      { id: 'ws-2', day_of_week: null, title_en: 'Evening aarti', title_bn: 'সন্ধ্যা আরতি', start_time: '18:30:00', end_time: '19:15:00', is_closed: false, is_active: true, sort_order: 11 },
      { id: 'ws-3', day_of_week: 5, title_en: 'Kathamrita reading', title_bn: 'কথামৃত পাঠ', start_time: '19:00:00', end_time: '20:30:00', is_closed: false, is_active: true, sort_order: 60 },
      { id: 'ws-4', day_of_week: 2, title_en: 'Hidden row', title_bn: 'লুকানো', start_time: '09:00:00', end_time: '10:00:00', is_closed: false, is_active: false, sort_order: 90 }
    ],
    events: [
      { id: 'ev-gita', is_published: true, title_en: 'Sri Sri Gita Jayanti', title_bn: 'শ্রীশ্রী গীতা জয়ন্তী', subtitle_en: 'Annual festival · Mokshada Ekadashi', subtitle_bn: 'বার্ষিক উৎসব · মোক্ষদা একাদশী', event_date: '2026-12-01', image_url: img('events/gita-jayanti.webp'), description_en: 'Gita path from morning to noon, then prasad for all.', description_bn: 'সকাল থেকে দুপুর পর্যন্ত গীতা পাঠ, তারপর প্রসাদ।', opens_at: '06:30:00', puja_starts_at: '09:00:00', closes_at: '21:00:00', location: 'Sree Sree Ramakrishna Mandir', created_at: '2026-11-01T00:00:00Z' },
      { id: 'ev-kalpataru', is_published: true, title_en: 'Kalpataru Utsav', title_bn: 'কল্পতরু উৎসব', event_date: '2027-01-01', image_url: null, description_en: 'Special puja, aarti and bhajan.', description_bn: 'বিশেষ পূজা, আরতি ও ভজন।', location: 'Dhoom Vivekananda Samiti', created_at: '2026-11-02T00:00:00Z' },
      { id: 'ev-draft', is_published: false, title_en: 'Unpublished draft event', title_bn: 'খসড়া', event_date: '2026-11-25', created_at: '2026-11-03T00:00:00Z' }
    ],
    gallery: [
      { id: 'ph-durga', image_url: img('gallery/basanti-durga-mandir.webp'), title_en: 'Sri Sri Basanti Durga Mandir', title_bn: 'শ্রীশ্রী বাসন্তী দুর্গা মন্দির', category: 'temple', organisation: 'durga', is_published: true, created_at: '2026-11-18T00:00:00Z' },
      { id: 'ph-saraswati', image_url: img('events/saraswati-puja.webp'), title_en: 'Saraswati Puja', title_bn: 'সরস্বতী পূজা', category: 'festivals', organisation: 'ramakrishna', is_published: true, created_at: '2026-11-17T00:00:00Z' },
      { id: 'ph-gita', image_url: img('events/gita-jayanti.webp'), title_en: 'Gita Jayanti', title_bn: 'গীতা জয়ন্তী', category: 'festivals', organisation: 'ramakrishna', is_published: true, created_at: '2026-11-16T00:00:00Z' },
      { id: 'ph-ganga', image_url: img('deities/ganga-devi.webp'), title_en: 'Ganga Devi', title_bn: 'গঙ্গা দেবী', category: 'worship', organisation: 'shiv', is_published: true, created_at: '2026-11-15T00:00:00Z' }
    ],
    announcements: [
      { id: 'an-1', is_published: true, title_en: 'Evening aarti every day', title_bn: 'প্রতিদিন সন্ধ্যা আরতি', message_en: 'Devotees are welcome to join the evening aarti.', message_bn: 'সন্ধ্যা আরতিতে সকলে আমন্ত্রিত।', created_at: '2026-11-19T00:00:00Z' }
    ],
    temple_content: [
      { id: 'tc-about', slug: 'about-temple', is_published: true, title_en: 'About the Samiti', title_bn: 'সমিতি সম্পর্কে', body_en: 'Dhoom Vivekananda Samiti is a religious, non-profit humanitarian organisation.', body_bn: 'ধুম বিবেকানন্দ সমিতি একটি ধর্মীয়, অলাভজনক মানবকল্যাণমূলক সংগঠন।' },
      { id: 'tc-ramakrishna', slug: 'org-ramakrishna', is_published: true, title_en: 'Sree Sree Ramakrishna Mandir', title_bn: 'শ্রীশ্রী রামকৃষ্ণ মন্দির', body_en: 'Daily worship of Sri Ramakrishna.\n\nKathamrita is read every Friday evening.', body_bn: 'শ্রীরামকৃষ্ণের নিত্যপূজা।\n\nপ্রতি শুক্রবার সন্ধ্যায় কথামৃত পাঠ।', mantra_en: 'Om sthāpakāya cha dharmasya sarva-dharma-svarūpiṇe', mantra_bn: 'ওঁ স্থাপকায় চ ধর্মস্য সর্বধর্মস্বরূপিণে' },
      { id: 'tc-shiv-draft', slug: 'org-shiv', is_published: false, title_en: 'Draft Shiv page', body_en: 'DRAFT TEXT THAT MUST NOT SHOW' }
    ],
    temple_highlights: [
      { id: 'hl-1', kind: 'mission', title_en: 'Worship', title_bn: 'পূজা ও উপাসনা', body_en: 'Daily puja and aarti.', body_bn: 'প্রতিদিনের পূজা ও আরতি।', sort_order: 1, is_active: true },
      { id: 'hl-2', kind: 'deity', title_en: 'Sri Surya Dev', title_bn: 'শ্রীশ্রী সূর্যদেব', image_url: img('deities/surya-dev.webp'), sort_order: 2, is_active: true }
    ],
    site_settings: [
      { key: 'festival_hours_note', value_en: 'Hours may change on festival days.', value_bn: 'উৎসবের দিনে সময় বদলাতে পারে।' },
      { key: 'bhajan_autoplay', value_en: 'off', value_bn: null }
    ],
    committee_contacts: [],
    event_catalog: [
      { id: 'cat-durga', name_en: 'Durga Puja', name_bn: 'দুর্গাপূজা', usual_month: 10, sort_order: 1, is_active: true },
      { id: 'cat-shyama', name_en: 'Shyama Puja', name_bn: 'শ্যামাপূজা', usual_month: 11, sort_order: 2, is_active: true },
      { id: 'cat-gita', name_en: 'Gita Jayanti', name_bn: 'গীতা জয়ন্তী', usual_month: 12, sort_order: 3, is_active: true }
    ],
    smriti_stambha: [
      { id: 'sm-2', name_en: 'Sri Gopal Chandra Nath', name_bn: 'শ্রী গোপাল চন্দ্র নাথ', role_en: 'Founder General Secretary', role_bn: 'প্রতিষ্ঠাতা সাধারণ সম্পাদক', years: '1985 – 2015', is_late: true, sort_order: 30, is_published: true },
      { id: 'sm-1', name_en: 'Sri Haripada Chowdhury', name_bn: 'শ্রী হরিপদ চৌধুরী', role_en: 'Founder President', role_bn: 'প্রতিষ্ঠাতা সভাপতি', years: '1985 – 2004', is_late: true, sort_order: 10, is_published: true },
      { id: 'sm-x', name_en: 'Hidden Draft Name', name_bn: 'খসড়া নাম', sort_order: 5, is_published: false }
    ],
    // Test-only rows for /visits and /bhavadhara (invented names, never on the real site)
    maharaj_visits: [
      { id: 'vi-1', monk_name_en: 'Test Swami Alpha Maharaj', monk_name_bn: 'পরীক্ষা স্বামী আলফা মহারাজ', monk_title_en: 'Test President', monk_title_bn: 'পরীক্ষা অধ্যক্ষ', visit_date: '2024-02-10', visit_date_end: null, occasion_en: 'Test consecration', occasion_bn: 'পরীক্ষা প্রতিষ্ঠা', places: ['ramakrishna', 'durga'], summary_en: 'First paragraph of the visit.\n\nSecond paragraph.', summary_bn: 'প্রথম অনুচ্ছেদ।', blessing_en: 'Test blessing words.', blessing_bn: 'পরীক্ষা আশীর্বাণী।', photo_url: null, photos: [img('gallery/basanti-durga-mandir.webp')], sort_order: 100, is_published: true },
      { id: 'vi-2', monk_name_en: 'Test Swami Beta Maharaj', visit_date: '2019-12-01', places: [], photos: [], sort_order: 100, is_published: true },
      { id: 'vi-x', monk_name_en: 'Hidden Draft Visit', visit_date: '2025-01-01', places: [], photos: [], sort_order: 100, is_published: false }
    ],
    visit_memories: [
      { id: 'me-1', visit_id: 'vi-1', author_name: 'Test Devotee', relation: 'Disciple', place: 'Test Town', memory: 'An approved test memory of the visit.', status: 'approved', created_at: '2024-03-01T00:00:00Z' },
      { id: 'me-2', visit_id: 'vi-1', author_name: 'Waiting Writer', memory: 'A PENDING MEMORY THAT MUST NOT SHOW.', status: 'pending', created_at: '2024-03-02T00:00:00Z' }
    ],
    bhavadhara_orgs: [
      { id: 'bd-1', name_en: 'Test Vedanta Centre Zeta', org_type: 'vedanta_society', country: 'Testland', city: 'Zeta City', website: 'https://example.org', email: null, phone: null, founded_year: 1990, about_en: 'A test centre.', status: 'approved', sort_order: 100 },
      { id: 'bd-2', name_en: 'Test Ashram Omega', org_type: 'ashram', country: 'Bangladesh', city: 'Test Upazila', status: 'approved', sort_order: 100 },
      { id: 'bd-x', name_en: 'Pending Org Must Not Show', org_type: 'other', country: 'Nowhere', status: 'pending', sort_order: 100 }
    ],
    // Test-only rows for /donors and /committee. The public view already hides what the admin hid,
    // so the view rows here have no amount or address where that was chosen.
    donor_honours_public: [
      { id: 'dh-2', name_en: 'Test Donor Second', address_en: 'Second Village, Testland', amount: 250000, currency: 'BDT', donated_on: '2023-05-01', purpose_en: 'Clinic medicines', sort_order: 100 },
      { id: 'dh-1', name_en: 'Test Donor First', name_bn: 'পরীক্ষা দাতা প্রথম', address_en: 'First Town, Testland', address_bn: 'প্রথম শহর', amount: 1500000, currency: 'BDT', donated_on: '2022-01-15', purpose_en: 'Ramakrishna Mandir building', in_memory_of: 'Late Test Parent', sort_order: 100 },
      { id: 'dh-3', name_en: 'Test Land Giver', address_en: null, amount: null, currency: 'BDT', gift_en: 'Land for the Durga Mandir', donated_on: '1999-03-03', sort_order: 100 }
    ],
    samiti_officials: [
      { id: 'of-m', name_en: 'Test Member Mu', position: 'member', role_en: 'Executive Member', role_bn: 'কার্যনির্বাহী সদস্য', term: '2025 – 2027', is_current: true, sort_order: 100, is_published: true },
      { id: 'of-p', name_en: 'Test President Pi', name_bn: 'পরীক্ষা সভাপতি', position: 'president', role_en: 'President', role_bn: 'সভাপতি', term: '2025 – 2027', is_current: true, phone: '+880 1700 000000', sort_order: 10, is_published: true },
      { id: 'of-s', name_en: 'Test Secretary Sigma', position: 'general_secretary', role_en: 'General Secretary', role_bn: 'সাধারণ সম্পাদক', term: '2025 – 2027', is_current: true, sort_order: 30, is_published: true },
      { id: 'of-old', name_en: 'Test Former President', position: 'president', role_en: 'President', term: '2021 – 2023', is_current: false, sort_order: 10, is_published: true },
      { id: 'of-x', name_en: 'Hidden Official', position: 'member', is_current: true, sort_order: 100, is_published: false }
    ],
    donor_honours: [],
    admin_profiles: [
      { user_id: 'user-main-admin', role: 'admin' }
    ]
  }
}

// Accounts the fake Supabase Auth knows. "visitor@" has a login but no staff role.
export const ACCOUNTS = {
  'admin@example.com': { password: 'correct-horse', id: 'user-main-admin' },
  'visitor@example.com': { password: 'visitor-pass', id: 'user-no-role' }
}
