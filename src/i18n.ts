export type Lang = 'ar' | 'en';

export const SITE_URL = 'https://jedra.properties';
export const DEMO_URL = 'https://forms.gle/c8QbDjwp2AUgQB9B6';

export const langPath = (lang: Lang) => (lang === 'ar' ? '/' : '/en/');

export const detectLang = (pathname: string): Lang =>
  pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'ar';

const ar = {
  meta: {
    title: 'جدرا | ابحث عن عقارك في السعودية بالذكاء الاصطناعي',
    description:
      'جدرا منصة عقارية سعودية تفهم طلبك بلغتك: الميزانية والحي والمساحة ونمط الحياة، ثم تعرض لك أنسب العقارات من بيانات السوق.',
  },
  nav: {
    about: 'عن جدرا',
    how: 'كيف تعمل',
    service: 'البحث الذكي',
    faq: 'الأسئلة الشائعة',
    contact: 'تواصل معنا',
    demo: 'اطلب عرضاً تجريبياً',
    switchLabel: 'English',
    switchAria: 'Switch to English',
    menu: 'القائمة',
    close: 'إغلاق القائمة',
    home: 'جدرا، الصفحة الرئيسية',
  },
  hero: {
    title: 'نعيد تعريف طريقة بحثك عن منزلك',
    lead: 'اكتب ما تبحث عنه كما تقوله لصديق، وجدرا تفهم ميزانيتك والحي الذي تفضله والمساحة التي تحتاجها، ثم تعرض لك الخيارات الأنسب من السوق.',
    examplesCaption: 'أمثلة لما يمكنك أن تطلبه من جدرا',
    examples: [
      'شقة ٣ غرف في حي الملقا بميزانية مليون ريال',
      'فيلا بمسبح خاص شمال الرياض',
      'بنتهاوس فاخر في حي النرجس قريب من المدارس',
      'أرض سكنية للاستثمار شرق الرياض',
    ],
    primary: 'اطلب عرضاً تجريبياً',
    secondary: 'تعرّف على طريقة العمل',
  },
  about: {
    title: 'منصة عقارية من الجيل الجديد',
    body: [
      'جدرا منصة عقارية تجعل اكتشاف العقار في المملكة العربية السعودية سهلاً وذكياً. نجمع بين بيانات سوق موثوقة ومحادثة مدعومة بالذكاء الاصطناعي لنساعد المشترين والمستثمرين والمستأجرين على الوصول إلى العقار المناسب بسرعة وثقة.',
      'مهمتنا تبسيط البحث العقاري بالتقنية، لتكون كل خطوة في قرارك العقاري أوضح وأسرع وأكثر موثوقية.',
    ],
    audiencesTitle: 'لمن صُممت جدرا',
    audiences: [
      { title: 'المشترون', text: 'ابحث عن منزلك الأول أو التالي دون التنقل بين عشرات الإعلانات.' },
      { title: 'المستثمرون', text: 'قارن الفرص حسب الموقع والسعر والمساحة في مكان واحد.' },
      { title: 'المستأجرون', text: 'صف ما تحتاجه، ودع جدرا تختصر عليك البحث.' },
    ],
  },
  how: {
    title: 'كيف تعمل جدرا',
    lead: 'ثلاث خطوات من الفكرة إلى العقار المناسب.',
    steps: [
      { title: 'اكتب طلبك بلغتك', text: 'بالعربية أو الإنجليزية، وبالطريقة التي تتحدث بها. لا حاجة لقوائم وفلاتر معقدة.' },
      { title: 'جدرا تفهم وتحلل', text: 'تستخرج من طلبك الميزانية والحي والمساحة ونمط الحياة، وتطابقها مع بيانات السوق.' },
      { title: 'قارن وقرّر بثقة', text: 'تصلك خيارات مرتبة حسب ملاءمتها لك، مع التفاصيل التي تحتاجها لاتخاذ قرارك.' },
    ],
  },
  service: {
    title: 'البحث الذكي',
    lead: 'محرك بحث مدعوم بالذكاء الاصطناعي يفهم تفضيلاتك ويعرض لك أفضل الخيارات فوراً، بتوصيات شخصية ومحدّثة من السوق.',
    features: [
      'يفهم الميزانية والحي والمساحة ونمط الحياة من جملة واحدة',
      'توصيات شخصية تتحسن مع كل سؤال',
      'بيانات سوق محدّثة وموثوقة',
      'يعمل بالعربية والإنجليزية',
    ],
    cta: 'اطلب عرضاً تجريبياً',
    imageAlt: 'واجهة البحث الذكي في تطبيق جدرا على الجوال',
  },
  faq: {
    title: 'الأسئلة الشائعة',
    items: [
      {
        q: 'ما هي جدرا؟',
        a: 'جدرا منصة عقارية سعودية تستخدم الذكاء الاصطناعي لمساعدتك في العثور على العقار المناسب. تكتب ما تبحث عنه بأسلوبك، وتعرض لك المنصة الخيارات الأنسب من بيانات السوق.',
      },
      {
        q: 'كيف يختلف البحث الذكي عن مواقع الإعلانات العقارية؟',
        a: 'بدلاً من الفلاتر والقوائم الطويلة، تصف ما تحتاجه في جملة، فتفهم جدرا الميزانية والحي والمساحة ونمط الحياة معاً، وترتب لك النتائج حسب ملاءمتها لك.',
      },
      {
        q: 'هل أستطيع البحث باللغة العربية؟',
        a: 'نعم. جدرا تفهم الطلبات بالعربية والإنجليزية.',
      },
      {
        q: 'لمن صُممت جدرا؟',
        a: 'للمشترين والمستثمرين والمستأجرين الذين يريدون الوصول إلى العقار المناسب في السعودية بسرعة وثقة.',
      },
      {
        q: 'كيف أجرّب جدرا؟',
        a: 'اطلب عرضاً تجريبياً من خلال زر "اطلب عرضاً تجريبياً"، أو أرسل لنا رسالة عبر نموذج التواصل وسنعود إليك.',
      },
    ],
  },
  contact: {
    title: 'تواصل معنا',
    lead: 'لديك سؤال أو ترغب بشراكة؟ أرسل لنا رسالة وسنرد عليك في أقرب وقت.',
    name: 'الاسم',
    namePh: 'اكتب اسمك',
    email: 'البريد الإلكتروني',
    emailPh: 'name@example.com',
    phone: 'رقم الجوال',
    phoneOptional: '(اختياري)',
    phonePh: '+9665XXXXXXXX',
    message: 'رسالتك',
    messagePh: 'كيف يمكننا مساعدتك؟',
    send: 'أرسل الرسالة',
    sending: 'جارٍ الإرسال…',
    sent: 'وصلتنا رسالتك. سنتواصل معك قريباً.',
    failed: 'لم تُرسل الرسالة. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',
    notConfigured: 'نموذج التواصل غير مفعّل حالياً. يرجى المحاولة لاحقاً.',
    subject: 'رسالة جديدة من موقع جدرا',
  },
  footer: {
    tagline: 'نعيد تعريف طريقة بحثك عن منزلك.',
    explore: 'روابط',
    rights: 'جميع الحقوق محفوظة.',
  },
};

export type Copy = typeof ar;

const en: Copy = {
  meta: {
    title: 'Jedra | AI-powered property search in Saudi Arabia',
    description:
      'Jedra is a Saudi real estate platform that understands what you ask for in your own words: budget, district, size and lifestyle, then shows the best-matching properties from the market.',
  },
  nav: {
    about: 'About',
    how: 'How it works',
    service: 'Smart Search',
    faq: 'FAQ',
    contact: 'Contact',
    demo: 'Request a demo',
    switchLabel: 'عربي',
    switchAria: 'التبديل إلى العربية',
    menu: 'Menu',
    close: 'Close menu',
    home: 'Jedra home',
  },
  hero: {
    title: 'Redefining how you find home',
    lead: 'Describe what you are looking for the way you would tell a friend. Jedra understands your budget, preferred district and the space you need, then shows the best options on the market.',
    examplesCaption: 'Examples of what you can ask Jedra',
    examples: [
      '3-bedroom apartment in Al Malqa under 1M SAR',
      'Villa with a private pool in north Riyadh',
      'Luxury penthouse in Al Narjis near schools',
      'Residential land for investment in east Riyadh',
    ],
    primary: 'Request a demo',
    secondary: 'See how it works',
  },
  about: {
    title: 'A next-generation real estate platform',
    body: [
      'Jedra makes property discovery in Saudi Arabia effortless and intelligent. We combine trusted market data with AI-driven conversation to help homebuyers, investors and tenants find the right property faster, smarter and with full confidence.',
      'Our mission is to simplify property search through technology, bringing transparency, speed and reliability to every real estate decision.',
    ],
    audiencesTitle: 'Who Jedra is for',
    audiences: [
      { title: 'Buyers', text: 'Find your first or next home without scrolling through endless listings.' },
      { title: 'Investors', text: 'Compare opportunities by location, price and size in one place.' },
      { title: 'Tenants', text: 'Describe what you need and let Jedra shorten the search.' },
    ],
  },
  how: {
    title: 'How Jedra works',
    lead: 'Three steps from an idea to the right property.',
    steps: [
      { title: 'Ask in your own words', text: 'In Arabic or English, the way you naturally speak. No complicated filters or menus.' },
      { title: 'Jedra understands', text: 'It picks out your budget, district, size and lifestyle, and matches them against market data.' },
      { title: 'Compare and decide', text: 'You get options ranked by how well they fit, with the details you need to decide.' },
    ],
  },
  service: {
    title: 'Smart Search',
    lead: 'An AI-powered search engine that understands your preferences and instantly shows the best options, with personalized, up-to-date recommendations from the market.',
    features: [
      'Understands budget, district, size and lifestyle from a single sentence',
      'Personalized recommendations that improve with every question',
      'Up-to-date, reliable market data',
      'Works in Arabic and English',
    ],
    cta: 'Request a demo',
    imageAlt: 'Jedra Smart Search on a mobile phone',
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What is Jedra?',
        a: 'Jedra is a Saudi real estate platform that uses AI to help you find the right property. You describe what you want in your own words, and Jedra shows the best-matching options from market data.',
      },
      {
        q: 'How is Smart Search different from listing websites?',
        a: 'Instead of filters and long lists, you describe what you need in a sentence. Jedra understands budget, district, size and lifestyle together, and ranks results by how well they fit you.',
      },
      {
        q: 'Can I search in Arabic?',
        a: 'Yes. Jedra understands requests in both Arabic and English.',
      },
      {
        q: 'Who is Jedra for?',
        a: 'Homebuyers, investors and tenants who want to find the right property in Saudi Arabia quickly and with confidence.',
      },
      {
        q: 'How can I try Jedra?',
        a: 'Use the "Request a demo" button, or send us a message through the contact form and we will get back to you.',
      },
    ],
  },
  contact: {
    title: 'Contact us',
    lead: 'Have a question or interested in partnering? Send us a message and we will reply soon.',
    name: 'Name',
    namePh: 'Your name',
    email: 'Email',
    emailPh: 'name@example.com',
    phone: 'Phone',
    phoneOptional: '(optional)',
    phonePh: '+9665XXXXXXXX',
    message: 'Message',
    messagePh: 'How can we help?',
    send: 'Send message',
    sending: 'Sending…',
    sent: 'Message received. We will be in touch soon.',
    failed: 'Your message was not sent. Check your connection and try again.',
    notConfigured: 'The contact form is not available right now. Please try again later.',
    subject: 'New message from the Jedra website',
  },
  footer: {
    tagline: 'Redefining how you find home.',
    explore: 'Explore',
    rights: 'All rights reserved.',
  },
};

export const copy: Record<Lang, Copy> = { ar, en };
