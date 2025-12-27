export const APP_CONSTANTS = {
  APP_NAME: 'TEO',
  VERSION: '1.0.0',

  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,

  // Debounce times (ms)
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE_DEBOUNCE: 1000,

  // Toast durations (ms)
  TOAST_DURATION_SHORT: 2000,
  TOAST_DURATION_DEFAULT: 3000,
  TOAST_DURATION_LONG: 5000,

  // CSV Import
  CSV_MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  CSV_SUPPORTED_ENCODINGS: ['UTF-8', 'ISO-8859-1'],

  // Attendance
  ATTENDANCE_LATE_TOLERANCE_MINUTES: 15,

  // Session storage keys
  STORAGE_KEYS: {
    USER: 'teo_user',
    TOKEN: 'teo_token',
    THEME: 'teo_theme',
    LAST_SYNC: 'teo_last_sync'
  },

  // Date formats
  DATE_FORMAT: 'dd/MM/yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',

  // Validation
  MAX_BONUS_POINTS: 20,
  MIN_BONUS_POINTS: 0.1,
};
