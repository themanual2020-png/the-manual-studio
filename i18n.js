// Lightweight client-side TH/EN switcher for the public site.
// Language choice persists in localStorage; content swaps in place with no page reload.
(function () {
  const STORAGE_KEY = 'tms_lang';

  const DICT = {
    home_intro_desc: {
      th: 'เราเชี่ยวชาญด้านการถ่ายภาพและวิดีโออสังหาริมทรัพย์และสารคดี — บันทึกพื้นที่ ผู้คน และช่วงเวลาที่มีความหมาย ทุกโปรเจกต์ถูกสร้างสรรค์ให้กลายเป็นบันทึกที่คงอยู่ สะท้อนตัวตนและบอกเล่าเรื่องราวเฉพาะของคุณ',
      en: 'We specialize in real estate and documentary photography and video — capturing spaces, people, and moments with meaning. Every project is crafted to become a lasting record that reflects your identity and tells your unique story.',
    },
    home_intro_memo: {
      th: 'จุดเริ่มต้นของทุกเรื่องราว เราสังเกต บันทึก และรักษาช่วงเวลาไว้อย่างตรงไปตรงมา เหมือนที่มันเป็นจริงๆ',
      en: 'The beginning of every story. We observe, document, and preserve moments with honesty, just as they are.',
    },
    home_intro_memories: {
      th: 'ทุกบันทึกกลายเป็นความทรงจำ ที่บรรจุอารมณ์ ประสบการณ์ และตัวตนของช่วงเวลานั้นไว้',
      en: 'Every record becomes a memory, carrying the emotions, experiences, and identity of a particular moment.',
    },
    home_intro_memorial: {
      th: 'ความทรงจำดำรงอยู่เกินกว่าปัจจุบัน กลายเป็นบันทึกที่มีความหมาย เชื่อมโยงคนรุ่นต่างๆ และรักษาเรื่องราวไว้เพื่ออนาคต',
      en: 'Memories endure beyond the present, becoming meaningful records that connect generations and preserve stories for the future.',
    },

    home_hero_subtitle: {
      th: 'บันทึกของเวลา — เปลี่ยนทุกพื้นที่และทุกช่วงเวลา ให้กลายเป็นความทรงจำที่คงอยู่ตลอดไป',
      en: 'A record of time — transforming every space and every moment into memories that last forever.',
    },
    home_work_heading: { th: 'ผลงานทั้งหมดของเรา', en: 'All Our Work' },
    home_work_desc: {
      th: 'รวมผลงานถ่ายภาพและวิดีโอทั้งหมด ตั้งแต่งานอินทีเรียดีไซน์ อีเว้นท์ สารคดี ไปจนถึงงานนำเสนอแบรนด์',
      en: 'A complete collection of our photography and video work — from interior design to events, documentaries, and brand presentations.',
    },
    home_work_cta: { th: 'ดูผลงานทั้งหมด →', en: 'View All Work →' },

    contact_name_ph: { th: 'ชื่อ', en: 'Name' },
    contact_phone_ph: { th: 'เบอร์โทร', en: 'Phone' },
    contact_email_ph: { th: 'อีเมล', en: 'Email' },
    contact_message_ph: { th: 'รายละเอียด', en: 'Message' },
    contact_submit: { th: 'ส่งข้อความ →', en: 'SEND MESSAGE →' },
    contact_sending: { th: 'กำลังส่ง...', en: 'Sending...' },
    contact_success: {
      th: '✓ ส่งข้อความแล้ว ขอบคุณครับ เราจะติดต่อกลับเร็วๆ นี้',
      en: '✓ Message sent! Thank you, we will get back to you soon.',
    },
    contact_error: {
      th: '✗ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      en: '✗ Something went wrong. Please try again.',
    },

    about_intro: {
      th: 'The Manual Studio คือสตูดิโอสร้างสรรค์งานถ่ายภาพและวิดีโอคุณภาพสูง ในกรุงเทพฯ',
      en: 'The Manual Studio is a creative photography and videography studio based in Bangkok.',
    },
    about_cta_heading: { th: 'พร้อมเริ่มต้นโปรเจกต์กับเรา?', en: 'Ready to start a project with us?' },
    about_faq_heading: { th: 'คำถามที่พบบ่อย', en: 'Frequently Asked Questions' },
    about_faq_q1: { th: 'ช่างภาพอินทีเรียดีไซน์ที่กรุงเทพ ควรเลือกอย่างไร?', en: 'How should I choose an interior design photographer in Bangkok?' },
    about_faq_a1: {
      th: 'The Manual Studio เป็นสตูดิโอที่เชี่ยวชาญเฉพาะทางถ่ายภาพงานอินทีเรียดีไซน์และสถาปัตยกรรมโดยตรง ไม่ใช่ช่างภาพทั่วไป เข้าใจการจัดแสง มุมมอง และรายละเอียดของงานดีไซน์ที่นักออกแบบภายในต้องการนำไปใช้ทำพอร์ตโฟลิโอหรือประชาสัมพันธ์โครงการ',
      en: 'The Manual Studio specializes exclusively in interior design and architectural photography — not general photography. We understand lighting, angles, and the design details interior designers need for their portfolios or project promotion.',
    },
    about_faq_q2: { th: 'ก่อนถ่ายภาพผลงานอินทีเรีย ต้องเตรียมอะไรบ้าง?', en: 'What should I prepare before an interior photoshoot?' },
    about_faq_a2: {
      th: 'แนะนำให้เตรียมพื้นที่ให้พร้อมก่อนวันถ่าย (จัดของ ทำความสะอาด) แจ้งช่วงเวลาที่แสงธรรมชาติเข้าดีที่สุด และสไตล์หรือโทนภาพที่ต้องการล่วงหน้า ทีมงานจะช่วยให้คำแนะนำเพิ่มเติมก่อนวันถ่ายจริง เพื่อให้ได้ภาพที่ตรงกับความต้องการมากที่สุด',
      en: 'We recommend preparing the space beforehand (tidying, cleaning), letting us know the best time for natural light, and sharing your preferred style or tone in advance. Our team will provide further guidance before the shoot to ensure the results match your vision.',
    },
    about_faq_q3: { th: 'ค่าบริการถ่ายภาพอินทีเรียดีไซน์เริ่มต้นเท่าไหร่?', en: 'How much does interior design photography cost?' },
    about_faq_a3: {
      th: 'ราคาขึ้นอยู่กับขนาดพื้นที่ จำนวนภาพ และรูปแบบงาน (ภาพนิ่งหรือวิดีโอ) ติดต่อทีมงานเพื่อขอใบเสนอราคาที่เหมาะกับโปรเจกต์ของคุณได้โดยตรง',
      en: 'Pricing depends on the size of the space, number of photos, and format (stills or video). Contact our team directly for a quote tailored to your project.',
    },

    work_heading: { th: 'ผลงานทั้งหมด', en: 'All Work' },
    work_filter_all: { th: 'ALL · ทั้งหมด', en: 'ALL' },
    work_loading: { th: 'กำลังโหลดผลงาน...', en: 'Loading work...' },
    work_empty_all: { th: 'ยังไม่มีผลงาน', en: 'No work yet' },
    work_empty_filtered: { th: 'ยังไม่มีผลงานในหมวดนี้', en: 'No work in this category yet' },

    project_lb_close: { th: 'ปิด', en: 'Close' },
    project_lb_prev: { th: 'ก่อนหน้า', en: 'Previous' },
    project_lb_next: { th: 'ถัดไป', en: 'Next' },
    project_photo_word: { th: 'ภาพที่', en: 'Photo' },
    project_gallery_word: { th: 'แกลเลอรี', en: 'Gallery photo' },
    project_meta_fallback: { th: '— ผลงานโดย The Manual Studio', en: '— by The Manual Studio' },

    cookie_notice: {
      th: 'เว็บไซต์นี้ใช้คุกกี้และเก็บข้อมูลการเข้าชม (เช่น หน้าที่เข้าชม อุปกรณ์ และที่มาของการเข้าชม) เพื่อพัฒนาประสบการณ์การใช้งานและวิเคราะห์ผลการเข้าชมเว็บไซต์',
      en: 'This site uses cookies and collects visit data (such as pages viewed, device, and traffic source) to improve your experience and analyze site performance.',
    },
    cookie_more: { th: 'ดูรายละเอียด', en: 'Learn more' },
    cookie_decline: { th: 'ปฏิเสธ', en: 'Decline' },
    cookie_accept: { th: 'ยอมรับทั้งหมด', en: 'Accept All' },
    cookie_details_label: { th: 'ข้อมูลที่เราเก็บ:', en: 'What we collect:' },
    cookie_details_text: {
      th: 'รหัสผู้เข้าชมแบบไม่ระบุตัวตน (เก็บใน localStorage), หน้าที่เข้าชม, แหล่งที่มาของการเข้าชม (เช่น Google, Facebook), ประเภทอุปกรณ์ และจังหวัด/ประเทศโดยประมาณจาก IP — ใช้เพื่อวิเคราะห์และปรับปรุงเว็บไซต์เท่านั้น ไม่ขายหรือแบ่งปันข้อมูลนี้ให้บุคคลที่สาม หากกด "ปฏิเสธ" เราจะไม่เก็บข้อมูลการเข้าชมเพื่อการวิเคราะห์ (คุกกี้ที่จำเป็นต่อระบบ เช่น การเข้าสู่ระบบผู้ดูแล ยังคงต้องใช้งานตามปกติ)',
      en: 'An anonymous visitor ID (stored in localStorage), pages viewed, traffic source (e.g. Google, Facebook), device type, and an approximate region/country from your IP — used only to analyze and improve the site. We never sell or share this data with third parties. If you choose "Decline," we won’t collect analytics data (essential cookies, like admin login, still work as normal).',
    },
  };

  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'th';
  }

  function t(key) {
    const entry = DICT[key];
    if (!entry) return '';
    return entry[getLang()] || entry.th || '';
  }

  // Pick a language-aware value off a Supabase record, e.g. field(project, 'title')
  // reads project.title_en when EN is selected and a translation exists, else falls
  // back to the Thai/default column.
  function field(obj, key) {
    if (!obj) return '';
    if (getLang() === 'en') {
      const enVal = obj[key + '_en'];
      if (enVal) return enVal;
    }
    return obj[key] || '';
  }

  function applyI18n() {
    const lang = getLang();
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.querySelectorAll('[data-lang-toggle]').forEach(el => {
      el.textContent = lang === 'th' ? 'EN' : 'TH';
    });

    document.dispatchEvent(new CustomEvent('tms:langchange', { detail: { lang } }));
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'th');
    applyI18n();
  }

  function toggleLang() {
    setLang(getLang() === 'th' ? 'en' : 'th');
  }

  window.tmsI18n = { getLang, t, field, applyI18n, setLang, toggleLang };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-lang-toggle]');
    if (btn) toggleLang();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyI18n);
  } else {
    applyI18n();
  }
})();
