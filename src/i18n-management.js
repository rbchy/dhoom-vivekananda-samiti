// Translations for temple hours, event timings and the contact section
const KEYS = ['hours_title', 'hours_day', 'hours_time', 'hours_closed', 'hours_daily', 'hours_none', 'panjika_btn', 'ev_opens', 'ev_puja', 'ev_closes', 'ev_location',
  'contact_address', 'contact_phone', 'contact_email', 'directions', 'contact_form_btn', 'contact_form_title', 'f_subject', 'f_message_req', 'f_email_req', 'f_send', 'msg_thanks', 'err_message']

const VALUES = {
  en: ['Worship Schedule & Temple Hours', 'Day', 'Time', 'Closed', 'Every day', 'The worship schedule will be published soon.', 'Open Bengali Panjika', 'Temple opens', 'Puja begins', 'Temple closes', 'Location',
    'Address', 'Phone', 'Email', 'Get directions', 'Send us a message', 'Get in touch', 'Subject (optional)', 'Message', 'Email address', 'Send message', 'Thank you! Your message has been sent. The temple committee will get back to you soon.', 'Please write your message (10–2000 characters).'],
  bn: ['পূজার সময়সূচি ও মন্দির খোলার সময়', 'দিন', 'সময়', 'বন্ধ', 'প্রতিদিন', 'পূজার সময়সূচি শীঘ্রই প্রকাশ করা হবে।', 'বাংলা পঞ্জিকা দেখুন', 'মন্দির খোলা', 'পূজা শুরু', 'মন্দির বন্ধ', 'স্থান',
    'ঠিকানা', 'ফোন', 'ইমেইল', 'পথনির্দেশ দেখুন', 'আমাদের বার্তা পাঠান', 'যোগাযোগ করুন', 'বিষয় (ঐচ্ছিক)', 'বার্তা', 'ইমেইল ঠিকানা', 'বার্তা পাঠান', 'ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে। মন্দির কমিটি শীঘ্রই আপনার সঙ্গে যোগাযোগ করবে।', 'আপনার বার্তা লিখুন (১০–২০০০ অক্ষর)।'],
  hi: ['पूजा समय-सारणी और मंदिर का समय', 'दिन', 'समय', 'बंद', 'प्रतिदिन', 'पूजा की समय-सारणी जल्द ही प्रकाशित की जाएगी।', 'बंगाली पंजिका देखें', 'मंदिर खुलेगा', 'पूजा आरंभ', 'मंदिर बंद होगा', 'स्थान',
    'पता', 'फ़ोन', 'ईमेल', 'रास्ता देखें', 'हमें संदेश भेजें', 'संपर्क करें', 'विषय (वैकल्पिक)', 'संदेश', 'ईमेल पता', 'संदेश भेजें', 'धन्यवाद! आपका संदेश भेज दिया गया है। मंदिर समिति जल्द ही आपसे संपर्क करेगी।', 'कृपया अपना संदेश लिखें (10–2000 अक्षर)।'],
  ko: ['예배 일정 및 사원 운영 시간', '요일', '시간', '휴무', '매일', '예배 일정이 곧 공개될 예정입니다.', '벵골 판지카(달력) 보기', '사원 개방', '푸자 시작', '사원 폐장', '장소',
    '주소', '전화', '이메일', '길찾기', '메시지 보내기', '문의하기', '제목 (선택)', '메시지', '이메일 주소', '메시지 보내기', '감사합니다! 메시지가 전송되었습니다. 사원 위원회가 곧 연락드리겠습니다.', '메시지를 입력해 주세요 (10–2000자).'],
  ja: ['礼拝スケジュールと開門時間', '曜日', '時間', '閉門', '毎日', '礼拝スケジュールは近日公開予定です。', 'ベンガル暦（パンジカ）を見る', '開門', 'プージャ開始', '閉門', '場所',
    '住所', '電話', 'メール', '道順を見る', 'メッセージを送る', 'お問い合わせ', '件名（任意）', 'メッセージ', 'メールアドレス', '送信する', 'ありがとうございます。メッセージを送信しました。寺院委員会より追ってご連絡いたします。', 'メッセージを入力してください（10〜2000文字）。'],
  zh: ['礼拜时间表与开放时间', '日期', '时间', '闭馆', '每天', '礼拜时间表即将公布。', '查看孟加拉历（Panjika）', '神庙开放', '普迦开始', '神庙关闭', '地点',
    '地址', '电话', '电子邮箱', '获取路线', '给我们留言', '联系我们', '主题（选填）', '留言内容', '电子邮箱地址', '发送留言', '谢谢！您的留言已发送，神庙委员会将尽快与您联系。', '请填写留言内容（10–2000 个字符）。'],
  es: ['Horario de culto y del templo', 'Día', 'Hora', 'Cerrado', 'Todos los días', 'El horario de culto se publicará pronto.', 'Ver el Panjika bengalí', 'Apertura del templo', 'Inicio de la puja', 'Cierre del templo', 'Lugar',
    'Dirección', 'Teléfono', 'Correo electrónico', 'Cómo llegar', 'Envíenos un mensaje', 'Contáctenos', 'Asunto (opcional)', 'Mensaje', 'Correo electrónico', 'Enviar mensaje', '¡Gracias! Su mensaje ha sido enviado. El comité del templo se pondrá en contacto con usted pronto.', 'Escriba su mensaje (10–2000 caracteres).'],
  fr: ['Horaires du culte et du temple', 'Jour', 'Heure', 'Fermé', 'Tous les jours', 'Les horaires du culte seront bientôt publiés.', 'Voir le Panjika bengali', 'Ouverture du temple', 'Début de la puja', 'Fermeture du temple', 'Lieu',
    'Adresse', 'Téléphone', 'E-mail', 'Itinéraire', 'Envoyez-nous un message', 'Nous contacter', 'Objet (facultatif)', 'Message', 'Adresse e-mail', 'Envoyer le message', 'Merci ! Votre message a été envoyé. Le comité du temple vous répondra bientôt.', 'Veuillez écrire votre message (10 à 2000 caractères).'],
  ar: ['مواعيد العبادة وساعات المعبد', 'اليوم', 'الوقت', 'مغلق', 'يوميًا', 'سيُنشر جدول العبادة قريبًا.', 'عرض التقويم البنغالي (بانجيكا)', 'يفتح المعبد', 'تبدأ البوجا', 'يُغلق المعبد', 'المكان',
    'العنوان', 'الهاتف', 'البريد الإلكتروني', 'الاتجاهات', 'أرسل لنا رسالة', 'تواصل معنا', 'الموضوع (اختياري)', 'الرسالة', 'البريد الإلكتروني', 'إرسال الرسالة', 'شكرًا لك! تم إرسال رسالتك. ستتواصل معك لجنة المعبد قريبًا.', 'يُرجى كتابة رسالتك (من 10 إلى 2000 حرف).'],
  ru: ['Расписание богослужений и часы работы', 'День', 'Время', 'Закрыто', 'Ежедневно', 'Расписание богослужений скоро будет опубликовано.', 'Открыть бенгальский Панджика', 'Храм открывается', 'Начало пуджи', 'Храм закрывается', 'Место',
    'Адрес', 'Телефон', 'Эл. почта', 'Как добраться', 'Написать нам', 'Связаться с нами', 'Тема (необязательно)', 'Сообщение', 'Адрес эл. почты', 'Отправить', 'Спасибо! Ваше сообщение отправлено. Комитет храма скоро свяжется с вами.', 'Напишите сообщение (10–2000 символов).']
}

export const MANAGEMENT_TEXT = Object.fromEntries(
  Object.entries(VALUES).map(([code, values]) => {
    if (values.length !== KEYS.length) throw new Error(`i18n-management: ${code} has ${values.length} values, expected ${KEYS.length}`)
    return [code, Object.fromEntries(KEYS.map((key, index) => [key, values[index]]))]
  })
)
