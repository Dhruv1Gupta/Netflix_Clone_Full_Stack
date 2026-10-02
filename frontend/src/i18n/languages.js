// Adding a language: create dictionaries/<code>.js with the same keys as
// dictionaries/en.js, then add one line here. LanguageContext picks it up
// automatically (nav + footer language menus, <html lang>, localStorage).
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
];

export const DEFAULT_LANGUAGE = 'en';
