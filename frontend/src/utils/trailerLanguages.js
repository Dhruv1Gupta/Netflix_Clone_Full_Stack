// Mirrors movies.models.TRAILER_LANGUAGE_LABELS on the backend — this list
// only drives the <select> in MovieForm's trailer manager; the backend
// accepts any well-formed language code, not just these.
export const TRAILER_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'ru', label: 'Russian' },
  { code: 'it', label: 'Italian' },
];
