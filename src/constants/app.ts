/**
 * Application Constants
 * Centralized configuration and constants for the Tasbeeh app
 */

export const APP_CONSTANTS = {
  // Storage Keys
  STORAGE_KEYS: {
    COUNTERS: 'tasbeeh_counters',
    SESSIONS: 'tasbeeh_sessions',
    SETTINGS: 'tasbeeh_settings',
    USER: 'tasbeeh_user',
    ACTIVE_SESSION: 'tasbeeh_active_session',
    CURRENT_COUNTER: 'tasbeeh_current_counter',
  } as const,

  // Application Limits
  LIMITS: {
    MAX_COUNTERS: 50,
    MAX_SESSIONS_STORED: 1000,
    MAX_COUNTER_NAME_LENGTH: 100,
    MAX_COUNTER_COUNT: 10000000, // 10 million
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MAX_EMAIL_LENGTH: 254,
    SESSION_HISTORY_DAYS: 365,
  } as const,

  // Performance Configuration
  PERFORMANCE: {
    DEBOUNCE_DELAYS: {
      SAVE_STORAGE: 500,
      SEARCH: 300,
      ACHIEVEMENT_CHECK: 5000,
    },
    CACHE_DURATION: {
      STATS: 60000, // 1 minute
      ACHIEVEMENTS: 30000, // 30 seconds
      USER_RANKING: 300000, // 5 minutes
    },
    ANIMATION_DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
  } as const,

  // Network Configuration
  NETWORK: {
    TIMEOUTS: {
      REQUEST: 30000, // 30 seconds
      AUTHENTICATION: 45000, // 45 seconds
      SYNC: 60000, // 1 minute
    },
    RETRY: {
      MAX_ATTEMPTS: 3,
      INITIAL_DELAY: 1000,
      MAX_DELAY: 10000,
      BACKOFF_FACTOR: 2,
    },
    RATE_LIMITING: {
      MAX_AUTH_ATTEMPTS: 5,
      AUTH_LOCKOUT_DURATION: 300000, // 5 minutes
      NOTIFICATION_COOLDOWN: 30000, // 30 seconds
    },
  } as const,

  // UI Configuration
  UI: {
    HAPTIC_MIN_INTERVAL: 50, // Minimum time between haptic feedback
    NOTIFICATION_DISPLAY_DURATION: 3000,
    TOAST_DURATION: 2000,
    SKELETON_ANIMATION_DURATION: 1000,
    TAB_BAR_HEIGHT: 84,
    HEADER_HEIGHT: 56,
  } as const,

  // Timer Configuration
  TIMERS: {
    SESSION_UPDATE_INTERVAL: 1000, // 1 second for session timer updates
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds for auto-save
    ACHIEVEMENT_CHECK_INTERVAL: 2000, // 2 seconds for achievement checks
  } as const,

  // Achievement Configuration
  ACHIEVEMENTS: {
    TASBIH_COUNT: 33,
    ASMA_UL_HUSNA_COUNT: 99,
    MAJOR_MILESTONES: [100, 500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 250000, 500000, 1000000],
    NOTIFICATION_PATTERNS: {
      LEVEL_UP: { repeat: 2, delay: 100 },
      MILESTONE: { repeat: 1, delay: 0 },
      TARGET: { repeat: 3, delay: 80 },
      STREAK: { repeat: 2, delay: 120 },
    },
  } as const,

  // Security Configuration
  SECURITY: {
    SECURE_STORE_SIZE_LIMIT: 2048, // 2KB limit for SecureStore
    LOG_LEVELS: ['error', 'warn', 'info', 'debug'] as const,
    SENSITIVE_DATA_PATTERNS: [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'email', 'mail', 'phone', 'mobile'
    ],
    PASSWORD_REQUIREMENTS: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
      REQUIRE_SPECIAL_CHAR: false, // Optional for spiritual app
    },
  } as const,

  // Islamic/Religious Constants
  ISLAMIC: {
    PRAYER_COUNTS: {
      TASBIH: 33,
      TAHMID: 33,
      TAKBIR: 34,
      ASMA_UL_HUSNA: 99,
      ISTIGHFAR: 100,
      SALAWAT: 100,
    },
    RECOMMENDED_TARGETS: [33, 99, 100, 300, 500, 1000],
    SPIRITUAL_MILESTONES: {
      DAILY_MINIMUM: 100,
      WEEKLY_GOAL: 1000,
      MONTHLY_GOAL: 5000,
      YEARLY_GOAL: 50000,
    },
    // Individual milestone constants for easy access
    TASBIH_COUNT: 33,
    ASMA_UL_HUSNA: 99, // Fixed to match usage in CounterScreen
    ASMA_UL_HUSNA_COUNT: 99, // Keep both for compatibility
    MILESTONE_100: 100,
    MILESTONE_300: 300,
    MILESTONE_500: 500,
    MILESTONE_1000: 1000,
  } as const,

  // Date and Time
  DATETIME: {
    FORMATS: {
      DATE: 'YYYY-MM-DD',
      TIME: 'HH:mm:ss',
      DATETIME: 'YYYY-MM-DD HH:mm:ss',
      DISPLAY_DATE: 'MMM DD, YYYY',
      DISPLAY_TIME: 'h:mm A',
    },
    DURATIONS: {
      SECOND: 1000,
      MINUTE: 60 * 1000,
      HOUR: 60 * 60 * 1000,
      DAY: 24 * 60 * 60 * 1000,
      WEEK: 7 * 24 * 60 * 60 * 1000,
      MONTH: 30 * 24 * 60 * 60 * 1000,
    },
  } as const,

  // Error Messages
  ERROR_MESSAGES: {
    NETWORK: {
      NO_CONNECTION: 'No internet connection. Please check your network settings.',
      TIMEOUT: 'Request timed out. Please try again.',
      SERVER_ERROR: 'Server error. Please try again in a moment.',
      RATE_LIMITED: 'Too many requests. Please wait a moment.',
    },
    AUTHENTICATION: {
      INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials.',
      EMAIL_NOT_CONFIRMED: 'Please check your email and click the verification link.',
      ACCOUNT_LOCKED: 'Account temporarily locked. Please try again later.',
      WEAK_PASSWORD: 'Password does not meet security requirements.',
    },
    VALIDATION: {
      REQUIRED_FIELD: 'This field is required.',
      INVALID_EMAIL: 'Please enter a valid email address.',
      INVALID_NAME: 'Name must be between 1 and 100 characters.',
      INVALID_COUNT: 'Count must be a positive number.',
    },
    STORAGE: {
      SAVE_FAILED: 'Failed to save data. Please try again.',
      LOAD_FAILED: 'Failed to load data.',
      QUOTA_EXCEEDED: 'Storage quota exceeded. Please free up space.',
    },
  } as const,

  // Success Messages
  SUCCESS_MESSAGES: {
    AUTHENTICATION: {
      SIGNED_IN: 'Successfully signed in!',
      SIGNED_UP: 'Account created successfully!',
      SIGNED_OUT: 'Successfully signed out.',
    },
    DATA: {
      SAVED: 'Data saved successfully.',
      SYNCED: 'Data synced to cloud.',
      EXPORTED: 'Data exported successfully.',
      IMPORTED: 'Data imported successfully.',
    },
    COUNTER: {
      CREATED: 'Counter created successfully.',
      UPDATED: 'Counter updated successfully.',
      DELETED: 'Counter deleted successfully.',
      TARGET_REACHED: 'Congratulations! Target reached!',
    },
  } as const,

  // Feature Flags
  FEATURES: {
    CLOUD_SYNC: true,
    ACHIEVEMENTS: true,
    NOTIFICATIONS: true,
    HAPTIC_FEEDBACK: true,
    DARK_MODE: true,
    EXPORT_IMPORT: true,
    GUEST_MODE: true,
    BIOMETRIC_AUTH: false, // Future feature
    VOICE_COMMANDS: false, // Future feature
    WIDGETS: false, // Future feature
  } as const,

  // App Metadata
  METADATA: {
    APP_NAME: 'Tasbeeh',
    APP_DESCRIPTION: 'Digital Islamic Prayer Counter',
    VERSION: '1.0.0',
    BUILD_NUMBER: 1,
    DEVELOPER: 'Your Development Team',
    SUPPORT_EMAIL: 'support@tasbeeh-app.com',
    PRIVACY_POLICY_URL: 'https://tasbeeh-app.com/privacy',
    TERMS_OF_SERVICE_URL: 'https://tasbeeh-app.com/terms',
  } as const,
} as const;

// Type exports for better TypeScript support
export type StorageKey = keyof typeof APP_CONSTANTS.STORAGE_KEYS;
export type ErrorMessageCategory = keyof typeof APP_CONSTANTS.ERROR_MESSAGES;
export type SuccessMessageCategory = keyof typeof APP_CONSTANTS.SUCCESS_MESSAGES;
export type FeatureFlag = keyof typeof APP_CONSTANTS.FEATURES;
export type IslamicPrayerType = keyof typeof APP_CONSTANTS.ISLAMIC.PRAYER_COUNTS;

// Utility functions for working with constants
export const getStorageKey = (key: StorageKey): string => {
  return APP_CONSTANTS.STORAGE_KEYS[key];
};

export const getErrorMessage = (category: ErrorMessageCategory, key: string): string => {
  const messages = APP_CONSTANTS.ERROR_MESSAGES[category] as Record<string, string>;
  return messages[key] || 'An unexpected error occurred.';
};

export const getSuccessMessage = (category: SuccessMessageCategory, key: string): string => {
  const messages = APP_CONSTANTS.SUCCESS_MESSAGES[category] as Record<string, string>;
  return messages[key] || 'Operation completed successfully.';
};

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return APP_CONSTANTS.FEATURES[feature];
};

export const getIslamicCount = (type: IslamicPrayerType): number => {
  return APP_CONSTANTS.ISLAMIC.PRAYER_COUNTS[type];
};

export const isMajorMilestone = (count: number): boolean => {
  return APP_CONSTANTS.ACHIEVEMENTS.MAJOR_MILESTONES.includes(count);
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.EXPO_PUBLIC_APP_ENV === 'development';
  const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    enableLogging: isDevelopment || process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
    logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'error',
    apiTimeout: isDevelopment ? 10000 : APP_CONSTANTS.NETWORK.TIMEOUTS.REQUEST,
  };
};

export default APP_CONSTANTS; 