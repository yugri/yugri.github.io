export const languages = {
    en: "en",
    uk: "uk",
  };

export const showDefaultLang = false;
  
export const defaultLang = 'en';

export const routes = {
    en: {
      home: '',
      about: 'about',
      blog: 'posts',
      notes: 'notes',
      tags: 'tags',
    },
    uk: {
      home: '',
      about: 'about',
      blog: 'posts',
      notes: 'notes',
      tags: 'tags',
    },
  } as const;

export const ui = {
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.blog': 'Blog',
      'nav.notes': 'Notes',
      'nav.tags': 'Tags',
      'home.metaTitle': 'Home',
      'home.heading': 'Hi! I’m Yuri.',
      'home.intro.p1': "AI prototypes are easy. Production systems are not.",
      'home.intro.p2': "I help teams move from fragile demos to dependable automation and agent workflows they can trust.",
      'home.intro.p3': "",
      'home.sections.pinned': 'Pinned Posts',
      'home.sections.posts': 'Posts',
      'home.sections.notes': 'Notes',
    },
    uk: {
      'nav.home': 'Головна',
      'nav.about': 'Про мене',
      'nav.blog': 'Блог',
      'nav.notes': 'Нотатки',
      'nav.tags': 'Теги',
      'home.metaTitle': 'Головна',
      'home.heading': 'Вітаю! Я Юрій.',
      'home.intro.p1': "AI прототипи зробити легко. Продуктивні системи — ні.",
      'home.intro.p2': "Я допомагаю командам перетворювати хаотичні, ручні процеси у надійну автоматизацію та системи на базі агентів, які працюють стабільно в продакшні.",
      'home.intro.p3': "",
      'home.sections.pinned': 'Закріплені дописи',
      'home.sections.posts': 'Пости',
      'home.sections.notes': 'Нотатки',
    },
  } as const;
