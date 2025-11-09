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
    },
    uk: {
      home: '',
      about: 'about',
      blog: 'posts',
      notes: 'notes',
    },
  } as const;

export const ui = {
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.blog': 'Blog',
      'nav.notes': 'Notes',
    },
    uk: {
      'nav.home': 'Головна',
      'nav.about': 'Про мене',
      'nav.blog': 'Блог',
      'nav.notes': 'Записи',
    },
  } as const;