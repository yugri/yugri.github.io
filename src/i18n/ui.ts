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
      'home.heading': 'Hey there! 👋',
      'home.intro.p1': "I'm Yuri, a Senior Software Engineer who loves diving deep into full-stack development. I spend most of my time crafting web applications, optimizing performance, and exploring new technologies that make developers' lives easier.",
      'home.intro.p2': "When I'm not coding, you'll find me sharing my thoughts on remote work, system architecture, and the occasional debugging adventure. Feel free to reach out if you want to chat about anything tech-related or just say hello!",
      'home.sections.pinned': 'Pinned Posts',
      'home.sections.posts': 'Posts',
      'home.sections.notes': 'Notes',
    },
    uk: {
      'nav.home': 'Головна',
      'nav.about': 'Про мене',
      'nav.blog': 'Блог',
      'nav.notes': 'Записи',
      'nav.tags': 'Теги',
      'home.metaTitle': 'Головна',
      'home.heading': 'Вітаю! 👋',
      'home.intro.p1': "Я Юрій, Senior Software Engineer, який обожнює працювати з повним циклом розробки. Більшість часу присвячую веб-додаткам, продуктивності та інструментам, що полегшують життя розробників.",
      'home.intro.p2': "Коли не пишу код — ділюся думками про віддалену роботу, архітектуру систем і пригоди з дебагінгом. Пишіть, якщо хочете поговорити про технології або просто привітатися!",
      'home.sections.pinned': 'Закріплені дописи',
      'home.sections.posts': 'Пости',
      'home.sections.notes': 'Нотатки',
    },
  } as const;
