import { DONATION_TEXT } from './i18n-donations'
import { MANAGEMENT_TEXT } from './i18n-management'
import { EXTRAS_TEXT } from './i18n-extras'
import { ORG_TEXT } from './i18n-org'
import { VISITS_TEXT } from './i18n-visits'

// Homepage translations for 10 languages.
// Text that comes from the database (events, gallery, announcements) uses its
// Bangla field when Bangla is selected, otherwise its English field.

export const LANGUAGES = [
  { code: 'en', short: 'EN', native: 'English', english: 'English', locale: 'en-US' },
  { code: 'bn', short: 'বাং', native: 'বাংলা', english: 'Bangla', locale: 'bn-BD' },
  { code: 'hi', short: 'हि', native: 'हिन्दी', english: 'Hindi', locale: 'hi-IN' },
  { code: 'ko', short: '한', native: '한국어', english: 'Korean', locale: 'ko-KR' },
  { code: 'ja', short: '日', native: '日本語', english: 'Japanese', locale: 'ja-JP' },
  { code: 'zh', short: '中', native: '中文（简体）', english: 'Chinese', locale: 'zh-CN' },
  { code: 'es', short: 'ES', native: 'Español', english: 'Spanish', locale: 'es-ES' },
  { code: 'fr', short: 'FR', native: 'Français', english: 'French', locale: 'fr-FR' },
  { code: 'ar', short: 'ع', native: 'العربية', english: 'Arabic', locale: 'ar', rtl: true },
  { code: 'ru', short: 'RU', native: 'Русский', english: 'Russian', locale: 'ru-RU' }
]

const en = {
  nav_home: 'Home', nav_about: 'About Us', nav_worship: 'Daily Worship', nav_events: 'Events', nav_gallery: 'Gallery', nav_donate: 'Donate', nav_contact: 'Contact',
  admin_login: 'Admin Login', search_aria: 'View events', toggle_nav: 'Toggle navigation', choose_language: 'Choose language',
  brand_name: 'Ramakrishna Temple, Dhoom', tag_worship: 'Worship', tag_service: 'Service', tag_harmony: 'Harmony',
  quote_1: '“As many faiths,', quote_2: 'so many paths.”', quote_by: '— Sri Ramakrishna',
  f_about_t: 'About Our Temple', f_about_c: 'Learn about the history, vision and spiritual heritage of Ramakrishna Temple, Dhoom.', f_about_a: 'Read More',
  f_worship_t: 'Daily Worship', f_worship_c: 'View the daily worship schedule, puja timings and special rituals.', f_worship_a: 'View Schedule',
  f_events_t: 'Events & Programs', f_events_c: 'Stay updated with upcoming festivals, spiritual talks and special events.', f_events_a: 'View Events',
  f_gallery_t: 'Gallery', f_gallery_c: 'Explore photos of the temple, festivals, and spiritual activities.', f_gallery_a: 'View Gallery',
  f_donate_t: 'Donate', f_donate_c: 'Support our mission of spiritual growth and service for humanity.', f_donate_a: 'Contribute',
  welcome_eyebrow: 'OUR TEMPLE', welcome_title: 'Welcome to Ramakrishna Temple, Dhoom',
  welcome_p1: 'Ramakrishna Temple, Dhoom is a sacred place dedicated to Sri Ramakrishna, Holy Mother Sri Sarada Devi and Swami Vivekananda. The temple stands as a beacon of spiritual harmony, love, and service.',
  welcome_p2: 'We invite you to visit, attend our daily worship, participate in our programs, and be a part of our spiritual journey.',
  blessing: 'May the blessings of Sri Ramakrishna be with all.', welcome_img_alt: 'Ramakrishna Temple, Dhoom',
  worship_eyebrow: 'DAILY WORSHIP', worship_title: 'Prayer, reflection and community', worship_p: 'Daily worship schedules and special rituals are shared by the temple administration.',
  events_eyebrow: 'UPCOMING PROGRAMS', events_title: 'Events & Programs', events_p: 'Published events are shared directly from the temple administration.',
  events_loading: 'Loading published events…', events_unavailable: 'Events are temporarily unavailable. Please check back soon.', events_none: 'No events have been published yet.', date_tba: 'Date to be announced',
  gallery_eyebrow: 'MOMENTS & MEMORIES', gallery_title: 'Temple Gallery', gallery_p: 'Photos from temple life and its spiritual activities will be featured here.',
  notices_eyebrow: 'TEMPLE NOTICES', notices_title: 'Announcements',
  donate_title: 'Support the Temple', donate_p: 'Donation information is available from the temple committee.',
  contact_title: 'Contact', contact_p: 'Please contact the temple committee for verified visiting information and schedules.',
  rights: 'All rights reserved'
}

const bn = {
  nav_home: 'হোম', nav_about: 'আমাদের কথা', nav_worship: 'দৈনিক পূজা', nav_events: 'অনুষ্ঠান', nav_gallery: 'গ্যালারি', nav_donate: 'দান', nav_contact: 'যোগাযোগ',
  admin_login: 'অ্যাডমিন লগইন', search_aria: 'অনুষ্ঠান দেখুন', toggle_nav: 'মেনু খুলুন বা বন্ধ করুন', choose_language: 'ভাষা বেছে নিন',
  brand_name: 'রামকৃষ্ণ মন্দির, ধুম', tag_worship: 'পূজা', tag_service: 'সেবা', tag_harmony: 'সম্প্রীতি',
  quote_1: '“যত মত,', quote_2: 'তত পথ।”', quote_by: '— শ্রীরামকৃষ্ণ',
  f_about_t: 'আমাদের মন্দির', f_about_c: 'রামকৃষ্ণ মন্দির, ধুমের ইতিহাস, লক্ষ্য ও আধ্যাত্মিক ঐতিহ্য সম্পর্কে জানুন।', f_about_a: 'আরও পড়ুন',
  f_worship_t: 'দৈনিক পূজা', f_worship_c: 'দৈনিক পূজার সময়সূচি, পূজার সময় ও বিশেষ আচার-অনুষ্ঠান দেখুন।', f_worship_a: 'সময়সূচি দেখুন',
  f_events_t: 'অনুষ্ঠান ও কর্মসূচি', f_events_c: 'আসন্ন উৎসব, আধ্যাত্মিক আলোচনা ও বিশেষ অনুষ্ঠানের খবর রাখুন।', f_events_a: 'অনুষ্ঠান দেখুন',
  f_gallery_t: 'গ্যালারি', f_gallery_c: 'মন্দির, উৎসব ও আধ্যাত্মিক কার্যক্রমের ছবি দেখুন।', f_gallery_a: 'গ্যালারি দেখুন',
  f_donate_t: 'দান করুন', f_donate_c: 'আধ্যাত্মিক উন্নতি ও মানবসেবার লক্ষ্যে আমাদের পাশে দাঁড়ান।', f_donate_a: 'অবদান রাখুন',
  welcome_eyebrow: 'আমাদের মন্দির', welcome_title: 'রামকৃষ্ণ মন্দির, ধুমে আপনাকে স্বাগতম',
  welcome_p1: 'রামকৃষ্ণ মন্দির, ধুম শ্রীরামকৃষ্ণ, শ্রীশ্রী মা সারদা দেবী ও স্বামী বিবেকানন্দের প্রতি উৎসর্গীকৃত একটি পবিত্র স্থান। এই মন্দির আধ্যাত্মিক সম্প্রীতি, প্রেম ও সেবার আলোকবর্তিকা।',
  welcome_p2: 'মন্দির দর্শন করতে, দৈনিক পূজায় অংশ নিতে, আমাদের কর্মসূচিতে যোগ দিতে এবং আমাদের আধ্যাত্মিক যাত্রার অংশ হতে আপনাকে আন্তরিক আমন্ত্রণ জানাই।',
  blessing: 'শ্রীরামকৃষ্ণের আশীর্বাদ সকলের উপর বর্ষিত হোক।', welcome_img_alt: 'রামকৃষ্ণ মন্দির, ধুম',
  worship_eyebrow: 'দৈনিক পূজা', worship_title: 'প্রার্থনা, ধ্যান ও সমাজ', worship_p: 'দৈনিক পূজার সময়সূচি ও বিশেষ আচার-অনুষ্ঠানের তথ্য মন্দির কর্তৃপক্ষ জানিয়ে থাকে।',
  events_eyebrow: 'আসন্ন কর্মসূচি', events_title: 'অনুষ্ঠান ও কর্মসূচি', events_p: 'প্রকাশিত অনুষ্ঠানের তথ্য সরাসরি মন্দির কর্তৃপক্ষ জানিয়ে থাকে।',
  events_loading: 'প্রকাশিত অনুষ্ঠান লোড হচ্ছে…', events_unavailable: 'অনুষ্ঠানের তথ্য এই মুহূর্তে পাওয়া যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পরে আবার দেখুন।', events_none: 'এখনও কোনো অনুষ্ঠান প্রকাশিত হয়নি।', date_tba: 'তারিখ পরে জানানো হবে',
  gallery_eyebrow: 'মুহূর্ত ও স্মৃতি', gallery_title: 'মন্দির গ্যালারি', gallery_p: 'মন্দিরের জীবন ও আধ্যাত্মিক কার্যক্রমের ছবি এখানে দেখানো হবে।',
  notices_eyebrow: 'মন্দিরের বিজ্ঞপ্তি', notices_title: 'ঘোষণা',
  donate_title: 'মন্দিরের পাশে দাঁড়ান', donate_p: 'দান সংক্রান্ত তথ্য মন্দির কমিটির কাছ থেকে পাওয়া যাবে।',
  contact_title: 'যোগাযোগ', contact_p: 'দর্শনের সঠিক তথ্য ও সময়সূচির জন্য অনুগ্রহ করে মন্দির কমিটির সঙ্গে যোগাযোগ করুন।',
  rights: 'সর্বস্বত্ব সংরক্ষিত'
}

const hi = {
  nav_home: 'होम', nav_about: 'हमारे बारे में', nav_worship: 'दैनिक पूजा', nav_events: 'कार्यक्रम', nav_gallery: 'गैलरी', nav_donate: 'दान', nav_contact: 'संपर्क',
  admin_login: 'एडमिन लॉगिन', search_aria: 'कार्यक्रम देखें', toggle_nav: 'मेनू खोलें या बंद करें', choose_language: 'भाषा चुनें',
  brand_name: 'रामकृष्ण मंदिर, धूम', tag_worship: 'पूजा', tag_service: 'सेवा', tag_harmony: 'सद्भाव',
  quote_1: '“जितने मत,', quote_2: 'उतने पथ।”', quote_by: '— श्री रामकृष्ण',
  f_about_t: 'हमारा मंदिर', f_about_c: 'रामकृष्ण मंदिर, धूम के इतिहास, दृष्टि और आध्यात्मिक विरासत के बारे में जानें।', f_about_a: 'और पढ़ें',
  f_worship_t: 'दैनिक पूजा', f_worship_c: 'दैनिक पूजा की समय-सारणी, पूजा का समय और विशेष अनुष्ठान देखें।', f_worship_a: 'समय-सारणी देखें',
  f_events_t: 'उत्सव और कार्यक्रम', f_events_c: 'आगामी त्योहारों, आध्यात्मिक प्रवचनों और विशेष कार्यक्रमों की जानकारी पाते रहें।', f_events_a: 'कार्यक्रम देखें',
  f_gallery_t: 'गैलरी', f_gallery_c: 'मंदिर, त्योहारों और आध्यात्मिक गतिविधियों की तस्वीरें देखें।', f_gallery_a: 'गैलरी देखें',
  f_donate_t: 'दान करें', f_donate_c: 'आध्यात्मिक उन्नति और मानव सेवा के हमारे मिशन में सहयोग करें।', f_donate_a: 'योगदान दें',
  welcome_eyebrow: 'हमारा मंदिर', welcome_title: 'रामकृष्ण मंदिर, धूम में आपका स्वागत है',
  welcome_p1: 'रामकृष्ण मंदिर, धूम श्री रामकृष्ण, पवित्र माँ श्री सारदा देवी और स्वामी विवेकानंद को समर्पित एक पवित्र स्थान है। यह मंदिर आध्यात्मिक सद्भाव, प्रेम और सेवा का प्रकाश-स्तंभ है।',
  welcome_p2: 'हम आपको मंदिर आने, दैनिक पूजा में शामिल होने, हमारे कार्यक्रमों में भाग लेने और हमारी आध्यात्मिक यात्रा का हिस्सा बनने के लिए आमंत्रित करते हैं।',
  blessing: 'श्री रामकृष्ण का आशीर्वाद सभी पर बना रहे।', welcome_img_alt: 'रामकृष्ण मंदिर, धूम',
  worship_eyebrow: 'दैनिक पूजा', worship_title: 'प्रार्थना, चिंतन और समुदाय', worship_p: 'दैनिक पूजा की समय-सारणी और विशेष अनुष्ठानों की जानकारी मंदिर प्रशासन द्वारा दी जाती है।',
  events_eyebrow: 'आगामी कार्यक्रम', events_title: 'उत्सव और कार्यक्रम', events_p: 'प्रकाशित कार्यक्रम सीधे मंदिर प्रशासन द्वारा साझा किए जाते हैं।',
  events_loading: 'प्रकाशित कार्यक्रम लोड हो रहे हैं…', events_unavailable: 'कार्यक्रमों की जानकारी अभी उपलब्ध नहीं है। कृपया कुछ देर बाद देखें।', events_none: 'अभी तक कोई कार्यक्रम प्रकाशित नहीं हुआ है।', date_tba: 'तिथि की घोषणा बाद में होगी',
  gallery_eyebrow: 'पल और यादें', gallery_title: 'मंदिर गैलरी', gallery_p: 'मंदिर जीवन और आध्यात्मिक गतिविधियों की तस्वीरें यहाँ दिखाई जाएँगी।',
  notices_eyebrow: 'मंदिर सूचनाएँ', notices_title: 'घोषणाएँ',
  donate_title: 'मंदिर का सहयोग करें', donate_p: 'दान संबंधी जानकारी मंदिर समिति से प्राप्त की जा सकती है।',
  contact_title: 'संपर्क', contact_p: 'दर्शन की सही जानकारी और समय-सारणी के लिए कृपया मंदिर समिति से संपर्क करें।',
  rights: 'सर्वाधिकार सुरक्षित'
}

const ko = {
  nav_home: '홈', nav_about: '소개', nav_worship: '일일 예배', nav_events: '행사', nav_gallery: '갤러리', nav_donate: '후원', nav_contact: '연락처',
  admin_login: '관리자 로그인', search_aria: '행사 보기', toggle_nav: '메뉴 열기/닫기', choose_language: '언어 선택',
  brand_name: '라마크리슈나 사원, 둠', tag_worship: '예배', tag_service: '봉사', tag_harmony: '화합',
  quote_1: '“신앙의 수만큼', quote_2: '길도 많다.”', quote_by: '— 스리 라마크리슈나',
  f_about_t: '사원 소개', f_about_c: '라마크리슈나 사원(둠)의 역사와 비전, 영적 유산을 알아보세요.', f_about_a: '더 보기',
  f_worship_t: '일일 예배', f_worship_c: '일일 예배 일정과 푸자 시간, 특별 의식을 확인하세요.', f_worship_a: '일정 보기',
  f_events_t: '행사 및 프로그램', f_events_c: '다가오는 축제와 영적 강연, 특별 행사 소식을 확인하세요.', f_events_a: '행사 보기',
  f_gallery_t: '갤러리', f_gallery_c: '사원과 축제, 영적 활동의 사진을 둘러보세요.', f_gallery_a: '갤러리 보기',
  f_donate_t: '후원하기', f_donate_c: '영적 성장과 인류 봉사라는 저희의 사명을 후원해 주세요.', f_donate_a: '후원하기',
  welcome_eyebrow: '우리 사원', welcome_title: '라마크리슈나 사원(둠)에 오신 것을 환영합니다',
  welcome_p1: '라마크리슈나 사원(둠)은 스리 라마크리슈나, 성모 스리 사라다 데비, 스와미 비베카난다께 헌정된 신성한 장소입니다. 이 사원은 영적 화합과 사랑, 봉사의 등불입니다.',
  welcome_p2: '사원을 방문하시고 일일 예배와 프로그램에 참여하시어 저희의 영적 여정에 함께해 주시기 바랍니다.',
  blessing: '스리 라마크리슈나의 축복이 모두와 함께하기를.', welcome_img_alt: '라마크리슈나 사원, 둠',
  worship_eyebrow: '일일 예배', worship_title: '기도, 성찰, 그리고 공동체', worship_p: '일일 예배 일정과 특별 의식은 사원 운영진이 안내합니다.',
  events_eyebrow: '다가오는 프로그램', events_title: '행사 및 프로그램', events_p: '게시된 행사는 사원 운영진이 직접 안내합니다.',
  events_loading: '게시된 행사를 불러오는 중…', events_unavailable: '지금은 행사 정보를 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.', events_none: '아직 게시된 행사가 없습니다.', date_tba: '날짜 추후 공지',
  gallery_eyebrow: '순간과 추억', gallery_title: '사원 갤러리', gallery_p: '사원 생활과 영적 활동의 사진이 이곳에 소개될 예정입니다.',
  notices_eyebrow: '사원 공지', notices_title: '공지사항',
  donate_title: '사원 후원하기', donate_p: '후원 관련 정보는 사원 위원회에서 안내받으실 수 있습니다.',
  contact_title: '연락처', contact_p: '정확한 방문 정보와 일정은 사원 위원회에 문의해 주세요.',
  rights: '모든 권리 보유'
}

const ja = {
  nav_home: 'ホーム', nav_about: '私たちについて', nav_worship: '日々の礼拝', nav_events: '行事', nav_gallery: 'ギャラリー', nav_donate: '寄付', nav_contact: 'お問い合わせ',
  admin_login: '管理者ログイン', search_aria: '行事を見る', toggle_nav: 'メニューの開閉', choose_language: '言語を選択',
  brand_name: 'ラーマクリシュナ寺院（ドゥーム）', tag_worship: '礼拝', tag_service: '奉仕', tag_harmony: '調和',
  quote_1: '「信仰の数だけ、', quote_2: '道がある。」', quote_by: '— シュリー・ラーマクリシュナ',
  f_about_t: '寺院について', f_about_c: 'ラーマクリシュナ寺院（ドゥーム）の歴史、理念、精神的な伝統をご紹介します。', f_about_a: '詳しく見る',
  f_worship_t: '日々の礼拝', f_worship_c: '毎日の礼拝スケジュール、プージャの時間、特別な儀式をご覧ください。', f_worship_a: 'スケジュールを見る',
  f_events_t: '行事・プログラム', f_events_c: '今後の祭典、法話、特別行事の最新情報をお届けします。', f_events_a: '行事を見る',
  f_gallery_t: 'ギャラリー', f_gallery_c: '寺院、祭典、精神的な活動の写真をご覧ください。', f_gallery_a: 'ギャラリーを見る',
  f_donate_t: '寄付', f_donate_c: '精神的な成長と人類への奉仕という私たちの使命をご支援ください。', f_donate_a: '寄付する',
  welcome_eyebrow: '私たちの寺院', welcome_title: 'ラーマクリシュナ寺院（ドゥーム）へようこそ',
  welcome_p1: 'ラーマクリシュナ寺院（ドゥーム）は、シュリー・ラーマクリシュナ、聖母シュリー・サーラダー・デーヴィー、スワーミー・ヴィヴェーカーナンダに捧げられた神聖な場所です。この寺院は、精神的な調和、愛、そして奉仕の灯火です。',
  welcome_p2: 'ぜひ寺院を訪れ、日々の礼拝やプログラムに参加し、私たちの精神的な歩みを共にしてください。',
  blessing: 'シュリー・ラーマクリシュナの祝福が皆様にありますように。', welcome_img_alt: 'ラーマクリシュナ寺院（ドゥーム）',
  worship_eyebrow: '日々の礼拝', worship_title: '祈り、内省、そして共同体', worship_p: '毎日の礼拝スケジュールと特別な儀式は、寺院運営事務局からお知らせします。',
  events_eyebrow: '今後のプログラム', events_title: '行事・プログラム', events_p: '公開された行事は、寺院運営事務局から直接お知らせします。',
  events_loading: '公開された行事を読み込み中…', events_unavailable: '現在、行事情報を表示できません。しばらくしてから再度ご確認ください。', events_none: '公開されている行事はまだありません。', date_tba: '日程は後日発表',
  gallery_eyebrow: 'ひとときと思い出', gallery_title: '寺院ギャラリー', gallery_p: '寺院の日常と精神的な活動の写真をここで紹介します。',
  notices_eyebrow: '寺院からのお知らせ', notices_title: 'お知らせ',
  donate_title: '寺院へのご支援', donate_p: '寄付に関する情報は、寺院委員会にお問い合わせください。',
  contact_title: 'お問い合わせ', contact_p: '正確な参拝情報やスケジュールについては、寺院委員会にお問い合わせください。',
  rights: '無断転載を禁じます'
}

const zh = {
  nav_home: '首页', nav_about: '关于我们', nav_worship: '每日礼拜', nav_events: '活动', nav_gallery: '图库', nav_donate: '捐赠', nav_contact: '联系我们',
  admin_login: '管理员登录', search_aria: '查看活动', toggle_nav: '打开或关闭菜单', choose_language: '选择语言',
  brand_name: '罗摩克里希那神庙（杜姆）', tag_worship: '礼拜', tag_service: '服务', tag_harmony: '和谐',
  quote_1: '“有多少种信仰，', quote_2: '就有多少条道路。”', quote_by: '— 室利·罗摩克里希那',
  f_about_t: '关于神庙', f_about_c: '了解杜姆罗摩克里希那神庙的历史、愿景与精神传承。', f_about_a: '了解更多',
  f_worship_t: '每日礼拜', f_worship_c: '查看每日礼拜时间表、普迦时间及特别仪式。', f_worship_a: '查看时间表',
  f_events_t: '活动与项目', f_events_c: '及时了解即将举行的节庆、灵性讲座和特别活动。', f_events_a: '查看活动',
  f_gallery_t: '图库', f_gallery_c: '浏览神庙、节庆和灵性活动的照片。', f_gallery_a: '查看图库',
  f_donate_t: '捐赠', f_donate_c: '支持我们促进灵性成长、服务人类的使命。', f_donate_a: '立即捐赠',
  welcome_eyebrow: '我们的神庙', welcome_title: '欢迎来到杜姆罗摩克里希那神庙',
  welcome_p1: '杜姆罗摩克里希那神庙是供奉室利·罗摩克里希那、圣母室利·萨拉达·德维和斯瓦米·维韦卡南达的神圣之地。神庙是灵性和谐、爱与服务的灯塔。',
  welcome_p2: '诚邀您前来参访，参加每日礼拜和各项活动，与我们一同踏上灵性之旅。',
  blessing: '愿室利·罗摩克里希那的祝福与众人同在。', welcome_img_alt: '杜姆罗摩克里希那神庙',
  worship_eyebrow: '每日礼拜', worship_title: '祈祷、反思与社群', worship_p: '每日礼拜时间表和特别仪式由神庙管理处发布。',
  events_eyebrow: '即将举行', events_title: '活动与项目', events_p: '已发布的活动由神庙管理处直接公布。',
  events_loading: '正在加载已发布的活动…', events_unavailable: '活动信息暂时无法显示，请稍后再查看。', events_none: '目前尚无已发布的活动。', date_tba: '日期待定',
  gallery_eyebrow: '瞬间与回忆', gallery_title: '神庙图库', gallery_p: '神庙生活和灵性活动的照片将在此展示。',
  notices_eyebrow: '神庙通知', notices_title: '公告',
  donate_title: '支持神庙', donate_p: '捐赠相关信息请向神庙委员会咨询。',
  contact_title: '联系我们', contact_p: '如需确切的参访信息和时间安排，请联系神庙委员会。',
  rights: '版权所有'
}

const es = {
  nav_home: 'Inicio', nav_about: 'Nosotros', nav_worship: 'Culto diario', nav_events: 'Eventos', nav_gallery: 'Galería', nav_donate: 'Donar', nav_contact: 'Contacto',
  admin_login: 'Acceso admin', search_aria: 'Ver eventos', toggle_nav: 'Abrir o cerrar el menú', choose_language: 'Elegir idioma',
  brand_name: 'Templo Ramakrishna, Dhoom', tag_worship: 'Culto', tag_service: 'Servicio', tag_harmony: 'Armonía',
  quote_1: '“Tantas creencias,', quote_2: 'tantos caminos.”', quote_by: '— Sri Ramakrishna',
  f_about_t: 'Nuestro templo', f_about_c: 'Conozca la historia, la visión y el legado espiritual del Templo Ramakrishna de Dhoom.', f_about_a: 'Leer más',
  f_worship_t: 'Culto diario', f_worship_c: 'Consulte el horario de culto diario, las horas de puja y los rituales especiales.', f_worship_a: 'Ver horario',
  f_events_t: 'Eventos y programas', f_events_c: 'Manténgase al día sobre próximos festivales, charlas espirituales y eventos especiales.', f_events_a: 'Ver eventos',
  f_gallery_t: 'Galería', f_gallery_c: 'Explore fotos del templo, los festivales y las actividades espirituales.', f_gallery_a: 'Ver galería',
  f_donate_t: 'Donar', f_donate_c: 'Apoye nuestra misión de crecimiento espiritual y servicio a la humanidad.', f_donate_a: 'Contribuir',
  welcome_eyebrow: 'NUESTRO TEMPLO', welcome_title: 'Bienvenido al Templo Ramakrishna de Dhoom',
  welcome_p1: 'El Templo Ramakrishna de Dhoom es un lugar sagrado dedicado a Sri Ramakrishna, la Santa Madre Sri Sarada Devi y Swami Vivekananda. El templo es un faro de armonía espiritual, amor y servicio.',
  welcome_p2: 'Le invitamos a visitarnos, asistir a nuestro culto diario, participar en nuestros programas y formar parte de nuestro camino espiritual.',
  blessing: 'Que las bendiciones de Sri Ramakrishna estén con todos.', welcome_img_alt: 'Templo Ramakrishna, Dhoom',
  worship_eyebrow: 'CULTO DIARIO', worship_title: 'Oración, reflexión y comunidad', worship_p: 'La administración del templo comunica los horarios de culto diario y los rituales especiales.',
  events_eyebrow: 'PRÓXIMOS PROGRAMAS', events_title: 'Eventos y programas', events_p: 'La administración del templo comparte directamente los eventos publicados.',
  events_loading: 'Cargando eventos publicados…', events_unavailable: 'Los eventos no están disponibles en este momento. Vuelva a consultar pronto.', events_none: 'Todavía no se ha publicado ningún evento.', date_tba: 'Fecha por anunciar',
  gallery_eyebrow: 'MOMENTOS Y RECUERDOS', gallery_title: 'Galería del templo', gallery_p: 'Aquí se mostrarán fotos de la vida del templo y de sus actividades espirituales.',
  notices_eyebrow: 'AVISOS DEL TEMPLO', notices_title: 'Anuncios',
  donate_title: 'Apoye al templo', donate_p: 'La información sobre donaciones está disponible a través del comité del templo.',
  contact_title: 'Contacto', contact_p: 'Comuníquese con el comité del templo para obtener información verificada sobre visitas y horarios.',
  rights: 'Todos los derechos reservados'
}

const fr = {
  nav_home: 'Accueil', nav_about: 'À propos', nav_worship: 'Culte quotidien', nav_events: 'Événements', nav_gallery: 'Galerie', nav_donate: 'Faire un don', nav_contact: 'Contact',
  admin_login: 'Connexion admin', search_aria: 'Voir les événements', toggle_nav: 'Ouvrir ou fermer le menu', choose_language: 'Choisir la langue',
  brand_name: 'Temple Ramakrishna, Dhoom', tag_worship: 'Culte', tag_service: 'Service', tag_harmony: 'Harmonie',
  quote_1: '« Autant de croyances,', quote_2: 'autant de chemins. »', quote_by: '— Sri Ramakrishna',
  f_about_t: 'Notre temple', f_about_c: 'Découvrez l’histoire, la vision et l’héritage spirituel du Temple Ramakrishna de Dhoom.', f_about_a: 'En savoir plus',
  f_worship_t: 'Culte quotidien', f_worship_c: 'Consultez l’horaire du culte quotidien, les heures de puja et les rituels spéciaux.', f_worship_a: 'Voir l’horaire',
  f_events_t: 'Événements et programmes', f_events_c: 'Restez informé des prochains festivals, causeries spirituelles et événements spéciaux.', f_events_a: 'Voir les événements',
  f_gallery_t: 'Galerie', f_gallery_c: 'Découvrez des photos du temple, des festivals et des activités spirituelles.', f_gallery_a: 'Voir la galerie',
  f_donate_t: 'Faire un don', f_donate_c: 'Soutenez notre mission de croissance spirituelle et de service à l’humanité.', f_donate_a: 'Contribuer',
  welcome_eyebrow: 'NOTRE TEMPLE', welcome_title: 'Bienvenue au Temple Ramakrishna de Dhoom',
  welcome_p1: 'Le Temple Ramakrishna de Dhoom est un lieu sacré dédié à Sri Ramakrishna, à la Sainte Mère Sri Sarada Devi et à Swami Vivekananda. Le temple est un phare d’harmonie spirituelle, d’amour et de service.',
  welcome_p2: 'Nous vous invitons à nous rendre visite, à assister au culte quotidien, à participer à nos programmes et à prendre part à notre cheminement spirituel.',
  blessing: 'Que les bénédictions de Sri Ramakrishna soient sur tous.', welcome_img_alt: 'Temple Ramakrishna, Dhoom',
  worship_eyebrow: 'CULTE QUOTIDIEN', worship_title: 'Prière, réflexion et communauté', worship_p: 'Les horaires du culte quotidien et des rituels spéciaux sont communiqués par l’administration du temple.',
  events_eyebrow: 'PROCHAINS PROGRAMMES', events_title: 'Événements et programmes', events_p: 'Les événements publiés sont communiqués directement par l’administration du temple.',
  events_loading: 'Chargement des événements publiés…', events_unavailable: 'Les événements sont momentanément indisponibles. Veuillez revenir bientôt.', events_none: 'Aucun événement n’a encore été publié.', date_tba: 'Date à confirmer',
  gallery_eyebrow: 'MOMENTS ET SOUVENIRS', gallery_title: 'Galerie du temple', gallery_p: 'Des photos de la vie du temple et de ses activités spirituelles seront présentées ici.',
  notices_eyebrow: 'AVIS DU TEMPLE', notices_title: 'Annonces',
  donate_title: 'Soutenir le temple', donate_p: 'Les informations sur les dons sont disponibles auprès du comité du temple.',
  contact_title: 'Contact', contact_p: 'Veuillez contacter le comité du temple pour obtenir des informations vérifiées sur les visites et les horaires.',
  rights: 'Tous droits réservés'
}

const ar = {
  nav_home: 'الرئيسية', nav_about: 'من نحن', nav_worship: 'العبادة اليومية', nav_events: 'الفعاليات', nav_gallery: 'المعرض', nav_donate: 'تبرّع', nav_contact: 'اتصل بنا',
  admin_login: 'دخول المشرف', search_aria: 'عرض الفعاليات', toggle_nav: 'فتح القائمة أو إغلاقها', choose_language: 'اختر اللغة',
  brand_name: 'معبد راماكريشنا، دهوم', tag_worship: 'عبادة', tag_service: 'خدمة', tag_harmony: 'وئام',
  quote_1: '«بقدر ما توجد عقائد،', quote_2: 'توجد طرق.»', quote_by: '— سري راماكريشنا',
  f_about_t: 'معبدنا', f_about_c: 'تعرّف على تاريخ معبد راماكريشنا في دهوم ورؤيته وتراثه الروحي.', f_about_a: 'اقرأ المزيد',
  f_worship_t: 'العبادة اليومية', f_worship_c: 'اطّلع على جدول العبادة اليومية ومواعيد البوجا والطقوس الخاصة.', f_worship_a: 'عرض الجدول',
  f_events_t: 'الفعاليات والبرامج', f_events_c: 'تابع أخبار المهرجانات القادمة والمحاضرات الروحية والفعاليات الخاصة.', f_events_a: 'عرض الفعاليات',
  f_gallery_t: 'المعرض', f_gallery_c: 'تصفّح صور المعبد والمهرجانات والأنشطة الروحية.', f_gallery_a: 'عرض المعرض',
  f_donate_t: 'تبرّع', f_donate_c: 'ادعم رسالتنا في النمو الروحي وخدمة الإنسانية.', f_donate_a: 'ساهم الآن',
  welcome_eyebrow: 'معبدنا', welcome_title: 'مرحبًا بكم في معبد راماكريشنا، دهوم',
  welcome_p1: 'معبد راماكريشنا في دهوم مكان مقدّس مكرّس لسري راماكريشنا والأم المقدسة سري سارادا ديفي وسوامي فيفيكاناندا. ويقف المعبد منارةً للوئام الروحي والمحبة والخدمة.',
  welcome_p2: 'ندعوكم لزيارتنا وحضور العبادة اليومية والمشاركة في برامجنا، وأن تكونوا جزءًا من رحلتنا الروحية.',
  blessing: 'لتكن بركات سري راماكريشنا مع الجميع.', welcome_img_alt: 'معبد راماكريشنا، دهوم',
  worship_eyebrow: 'العبادة اليومية', worship_title: 'الصلاة والتأمل والمجتمع', worship_p: 'تُعلن إدارة المعبد جداول العبادة اليومية والطقوس الخاصة.',
  events_eyebrow: 'البرامج القادمة', events_title: 'الفعاليات والبرامج', events_p: 'تُعلن إدارة المعبد الفعاليات المنشورة مباشرةً.',
  events_loading: 'جارٍ تحميل الفعاليات المنشورة…', events_unavailable: 'الفعاليات غير متاحة مؤقتًا. يُرجى المراجعة لاحقًا.', events_none: 'لم تُنشر أي فعاليات بعد.', date_tba: 'سيُعلن الموعد لاحقًا',
  gallery_eyebrow: 'لحظات وذكريات', gallery_title: 'معرض المعبد', gallery_p: 'ستُعرض هنا صور من حياة المعبد وأنشطته الروحية.',
  notices_eyebrow: 'إشعارات المعبد', notices_title: 'الإعلانات',
  donate_title: 'ادعم المعبد', donate_p: 'تتوفر معلومات التبرع لدى لجنة المعبد.',
  contact_title: 'اتصل بنا', contact_p: 'يُرجى التواصل مع لجنة المعبد للحصول على معلومات موثّقة عن الزيارة والمواعيد.',
  rights: 'جميع الحقوق محفوظة'
}

const ru = {
  nav_home: 'Главная', nav_about: 'О нас', nav_worship: 'Богослужения', nav_events: 'События', nav_gallery: 'Галерея', nav_donate: 'Пожертвовать', nav_contact: 'Контакты',
  admin_login: 'Вход для админа', search_aria: 'Смотреть события', toggle_nav: 'Открыть или закрыть меню', choose_language: 'Выбрать язык',
  brand_name: 'Храм Рамакришны, Дхум', tag_worship: 'Поклонение', tag_service: 'Служение', tag_harmony: 'Гармония',
  quote_1: '«Сколько вер,', quote_2: 'столько и путей.»', quote_by: '— Шри Рамакришна',
  f_about_t: 'О нашем храме', f_about_c: 'Узнайте об истории, миссии и духовном наследии храма Рамакришны в Дхуме.', f_about_a: 'Подробнее',
  f_worship_t: 'Ежедневное богослужение', f_worship_c: 'Расписание ежедневных богослужений, время пуджи и особые ритуалы.', f_worship_a: 'Расписание',
  f_events_t: 'События и программы', f_events_c: 'Следите за предстоящими праздниками, духовными беседами и особыми событиями.', f_events_a: 'Смотреть события',
  f_gallery_t: 'Галерея', f_gallery_c: 'Фотографии храма, праздников и духовной жизни.', f_gallery_a: 'Открыть галерею',
  f_donate_t: 'Пожертвования', f_donate_c: 'Поддержите нашу миссию духовного роста и служения человечеству.', f_donate_a: 'Поддержать',
  welcome_eyebrow: 'НАШ ХРАМ', welcome_title: 'Добро пожаловать в храм Рамакришны, Дхум',
  welcome_p1: 'Храм Рамакришны в Дхуме — священное место, посвящённое Шри Рамакришне, Святой Матери Шри Сараде Деви и Свами Вивекананде. Храм служит маяком духовной гармонии, любви и служения.',
  welcome_p2: 'Приглашаем вас посетить храм, прийти на ежедневное богослужение, принять участие в наших программах и стать частью нашего духовного пути.',
  blessing: 'Да пребудет со всеми благословение Шри Рамакришны.', welcome_img_alt: 'Храм Рамакришны, Дхум',
  worship_eyebrow: 'ЕЖЕДНЕВНОЕ БОГОСЛУЖЕНИЕ', worship_title: 'Молитва, размышление и община', worship_p: 'Расписание ежедневных богослужений и особых ритуалов публикует администрация храма.',
  events_eyebrow: 'ПРЕДСТОЯЩИЕ ПРОГРАММЫ', events_title: 'События и программы', events_p: 'Опубликованные события сообщает непосредственно администрация храма.',
  events_loading: 'Загрузка опубликованных событий…', events_unavailable: 'События временно недоступны. Пожалуйста, загляните позже.', events_none: 'Пока не опубликовано ни одного события.', date_tba: 'Дата будет объявлена',
  gallery_eyebrow: 'МГНОВЕНИЯ И ВОСПОМИНАНИЯ', gallery_title: 'Галерея храма', gallery_p: 'Здесь будут опубликованы фотографии из жизни храма и его духовной деятельности.',
  notices_eyebrow: 'ОБЪЯВЛЕНИЯ ХРАМА', notices_title: 'Объявления',
  donate_title: 'Поддержите храм', donate_p: 'Информацию о пожертвованиях можно получить у комитета храма.',
  contact_title: 'Контакты', contact_p: 'Для получения проверенной информации о посещении и расписании обратитесь в комитет храма.',
  rights: 'Все права защищены'
}

const BASE = { en, bn, hi, ko, ja, zh, es, fr, ar, ru }
export const TRANSLATIONS = Object.fromEntries(
  Object.entries(BASE).map(([code, text]) => [code, { ...text, ...DONATION_TEXT[code], ...MANAGEMENT_TEXT[code], ...EXTRAS_TEXT[code], ...ORG_TEXT[code], ...VISITS_TEXT[code] }])
)

const STORAGE_KEY = 'temple-language'

export function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && TRANSLATIONS[saved]) return saved
  } catch { /* storage unavailable */ }
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return TRANSLATIONS[browser] ? browser : 'en'
}

export function saveLanguage(code) {
  try { localStorage.setItem(STORAGE_KEY, code) } catch { /* storage unavailable */ }
}

export function translate(code, key) {
  return TRANSLATIONS[code]?.[key] ?? TRANSLATIONS.en[key] ?? key
}

export function getLanguage(code) {
  return LANGUAGES.find(language => language.code === code) || LANGUAGES[0]
}
