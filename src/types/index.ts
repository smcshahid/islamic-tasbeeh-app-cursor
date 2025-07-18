export interface Counter {
  id: string;
  name: string;
  count: number;
  target?: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  counterId: string;
  counterName: string;
  startTime: string;
  endTime?: string;
  startCount: number;
  endCount: number;
  duration: number; // in seconds
  totalCounts: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto' | 'medina' | 'fzhh-blue' | 'white-gold';
  language: 'en' | 'ar';
  hapticFeedback: boolean;
  notifications: boolean;
  autoSync: boolean;
  defaultCounter?: string;
}

export interface User {
  id: string;
  email?: string;
  isGuest: boolean;
  lastSyncAt?: string;
}

export interface AppState {
  counters: Counter[];
  sessions: Session[];
  settings: Settings;
  user: User | null;
  activeSession: Session | null;
  currentCounter: Counter | null;
  hasLoadedFromStorage: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TasbeehContextType extends AppState {
  // Counter actions
  createCounter: (name: string, color?: string, target?: number) => Promise<void>;
  updateCounter: (id: string, updates: Partial<Counter>) => Promise<void>;
  deleteCounter: (id: string) => Promise<void>;
  incrementCounter: (id: string) => Promise<void>;
  resetCounter: (id: string) => Promise<void>;
  setCurrentCounter: (counter: Counter) => void;
  
  // Session actions
  startSession: (counterId: string) => Promise<void>;
  endSession: () => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  
  // Storage actions
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  
  // Cloud sync actions
  loadFromCloud: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
  
  // Auth actions
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Stats and achievements actions
  getUserStats: () => any; // UserStats type from achievements
  getUserRanking: () => any; // Ranking result
  getNextLevelProgress: () => any; // Level progress
}

export const COLORS = {
  primary: {
    green: '#22C55E',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F97316',
    pink: '#EC4899',
    teal: '#14B8A6',
    indigo: '#6366F1',
    emerald: '#10B981',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
  semantic: {
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
  },
} as const;

export type ColorKey = keyof typeof COLORS.primary;

// Prayer Times Types
export interface PrayerTime {
  name: PrayerName;
  time: string; // HH:MM format
  originalTime: string; // Original API time before adjustments
  adjustment: number; // Minutes adjustment (-30 to +30)
  notificationEnabled: boolean;
  isNotified: boolean; // Whether notification was already sent today
}

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface DayPrayerTimes {
  date: string; // YYYY-MM-DD format
  hijriDate: string;
  prayers: PrayerTime[];
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  method: CalculationMethod;
}

export interface CalculationMethod {
  id: number;
  name: string;
  description: string;
}

export interface PrayerTimesCache {
  [key: string]: DayPrayerTimes; // key: YYYY-MM-DD
}

export interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isPopular?: boolean;
}

export interface AdhanAudio {
  id: string;
  name: string;
  reciter: string;
  url: string;
  duration: number; // in seconds
  isLocal?: boolean; // Whether it's downloaded locally
}

export interface PrayerSettings {
  calculationMethod: CalculationMethod;
  selectedAudio: AdhanAudio;
  enableAdhan: boolean;
  enableVibration: boolean;
  snoozeEnabled: boolean;
  snoozeDuration: 5 | 10 | 15; // minutes
  maxSnoozes: number;
  fadeInDuration: number; // seconds
  fadeOutDuration: number; // seconds
  volume: number; // 0-1
  timeFormat: '12h' | '24h'; // 12-hour (AM/PM) or 24-hour format
  location: {
    type: 'auto' | 'manual';
    selectedCity?: City;
    lastKnownLocation?: {
      latitude: number;
      longitude: number;
      city?: string;
      country?: string;
    };
  };
  timeAdjustments: {
    [key in PrayerName]: number; // -30 to +30 minutes
  };
  notifications: {
    [key in PrayerName]: boolean;
  };
}

export interface PrayerTimesState {
  currentTimes?: DayPrayerTimes;
  cache: PrayerTimesCache;
  settings: PrayerSettings;
  isLoading: boolean;
  error: string | null;
  nextPrayer?: {
    name: PrayerName;
    time: string;
    timeUntil: string;
  };
  availableAudios: AdhanAudio[];
  availableCities: City[];
  availableMethods: CalculationMethod[];
  lastUpdateTime?: string;
  isOnline: boolean;
}

export interface PrayerTimesContextType extends PrayerTimesState {
  // Current state
  currentDate: string;
  
  // Prayer time actions
  fetchPrayerTimes: (date?: string, forceRefresh?: boolean) => Promise<void>;
  updatePrayerAdjustment: (prayer: PrayerName, minutes: number) => Promise<void>;
  applyAllAdjustments: (minutes: number) => Promise<void>;
  togglePrayerNotification: (prayer: PrayerName) => Promise<void>;
  
  // Location actions
  updateLocation: (city?: City) => Promise<void>;
  enableAutoLocation: () => Promise<void>;
  
  // Settings actions
  updateCalculationMethod: (method: CalculationMethod) => Promise<void>;
  updateAdhanAudio: (audio: AdhanAudio) => Promise<void>;
  updatePrayerSettings: (updates: Partial<PrayerSettings>) => Promise<void>;
  
  // Audio actions
  playAdhan: (audio?: AdhanAudio, volume?: number, fadeInDuration?: number) => Promise<void>;
  stopAdhan: () => Promise<void>;
  previewAudio: (audio: AdhanAudio) => Promise<void>;
  
  // Notification actions
  scheduleAllNotifications: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  snoozeNotification: (prayer: PrayerName) => Promise<void>;
  
  // Cache management
  clearCache: () => Promise<void>;
  resetToProduction: () => Promise<void>;
  preloadNextMonth: () => Promise<void>;
  
  // Navigation actions
  navigateToDate: (targetDate: string) => Promise<boolean>;
  getInitialDate: () => string;
  
  // Navigation helpers
  getNextPrayer: () => { name: PrayerName; time: string; timeUntil: string } | null;
  getCurrentPrayer: () => PrayerName | null;
  getTimeUntilPrayer: (prayer: PrayerName) => string;
}

// Comprehensive calculation methods from Aladhan API
export const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 0, name: 'Jafari / Shia Ithna-Ashari', description: 'Shia Ithna-Ashari, Leva Institute, Qum' },
  { id: 1, name: 'University of Islamic Sciences, Karachi', description: 'Hanafi jurisprudence' },
  { id: 2, name: 'Islamic Society of North America', description: 'Used in North America' },
  { id: 3, name: 'Muslim World League', description: 'Used in Europe, Far East, parts of America' },
  { id: 4, name: 'Umm Al-Qura University, Makkah', description: 'Used in Saudi Arabia' },
  { id: 5, name: 'Egyptian General Authority of Survey', description: 'Used in Africa, Syria, Iraq, Lebanon, Malaysia, Brunei' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran', description: 'Used in Iran, some Shia communities' },
  { id: 8, name: 'Gulf Region', description: 'Used in Kuwait, Qatar, Bahrain, Oman, UAE' },
  { id: 9, name: 'Kuwait', description: 'Used in Kuwait' },
  { id: 10, name: 'Qatar', description: 'Used in Qatar' },
  { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore', description: 'Used in Singapore' },
  { id: 12, name: 'Union Organization islamic de France', description: 'Used in France' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', description: 'Used in Turkey' },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia', description: 'Used in Russia' },
  { id: 15, name: 'Moonsighting Committee Worldwide', description: 'Moonsighting Committee Worldwide (also requires shafaq parameter)' },
  { id: 16, name: 'Dubai (experimental)', description: 'Dubai - experimental method' },
  { id: 17, name: 'Jabatan Kemajuan Islam Malaysia (JAKIM)', description: 'Used in Malaysia' },
  { id: 18, name: 'Tunisia', description: 'Used in Tunisia' },
  { id: 19, name: 'Algeria', description: 'Used in Algeria' },
  { id: 20, name: 'KEMENAG - Kementerian Agama Republik Indonesia', description: 'Used in Indonesia' },
  { id: 21, name: 'Morocco', description: 'Used in Morocco' },
  { id: 22, name: 'Comunidade Islamica de Lisboa', description: 'Used in Portugal' },
  { id: 23, name: 'Ministry of Awqaf, Islamic Affairs and Holy Places, Jordan', description: 'Used in Jordan' },
];

// Default Adhan audios (local and remote)
export const DEFAULT_ADHAN_AUDIOS: AdhanAudio[] = [
  {
    id: 'local_adhan',
    name: 'Local Adhan (Development)',
    reciter: 'Local Audio',
    url: './aladhan.mp3',
    duration: 180,
    isLocal: true,
  },
  {
    id: 'mishary',
    name: 'Mishary Rashid Alafasy',
    reciter: 'Mishary Rashid Alafasy',
    url: 'https://www.aladhan.com/adhan/mishary.mp3',
    duration: 180,
  },
  {
    id: 'abdul_basit',
    name: 'Abdul Basit Abdul Samad',
    reciter: 'Abdul Basit Abdul Samad',
    url: 'https://www.aladhan.com/adhan/abdul_basit.mp3',
    duration: 165,
  },
  {
    id: 'madinah',
    name: 'Madinah',
    reciter: 'Madinah Haram',
    url: 'https://www.aladhan.com/adhan/madinah.mp3',
    duration: 195,
  },
  {
    id: 'makkah',
    name: 'Makkah',
    reciter: 'Makkah Haram',
    url: 'https://www.aladhan.com/adhan/makkah.mp3',
    duration: 210,
  },
];

// Popular Islamic cities for manual selection
export const POPULAR_CITIES: City[] = [
  // Middle East
  { id: 'mecca', name: 'Mecca', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh', isPopular: true },
  { id: 'medina', name: 'Medina', country: 'Saudi Arabia', latitude: 24.4539, longitude: 39.6040, timezone: 'Asia/Riyadh', isPopular: true },
  { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh', isPopular: true },
  { id: 'jerusalem', name: 'Jerusalem', country: 'Palestine', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem', isPopular: true },
  { id: 'dubai', name: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai', isPopular: true },
  { id: 'doha', name: 'Doha', country: 'Qatar', latitude: 25.2854, longitude: 51.5310, timezone: 'Asia/Qatar', isPopular: true },
  { id: 'kuwait', name: 'Kuwait City', country: 'Kuwait', latitude: 29.3759, longitude: 47.9774, timezone: 'Asia/Kuwait', isPopular: true },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo', isPopular: true },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul', isPopular: true },
  { id: 'tehran', name: 'Tehran', country: 'Iran', latitude: 35.6892, longitude: 51.3890, timezone: 'Asia/Tehran', isPopular: true },
  
  // South Asia
  { id: 'karachi', name: 'Karachi', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi', isPopular: true },
  { id: 'lahore', name: 'Lahore', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi', isPopular: true },
  { id: 'islamabad', name: 'Islamabad', country: 'Pakistan', latitude: 33.7294, longitude: 73.0931, timezone: 'Asia/Karachi', isPopular: true },
  { id: 'dhaka', name: 'Dhaka', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka', isPopular: true },
  { id: 'mumbai', name: 'Mumbai', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata', isPopular: true },
  { id: 'delhi', name: 'Delhi', country: 'India', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata', isPopular: true },
  
  // Southeast Asia
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta', isPopular: true },
  { id: 'kuala_lumpur', name: 'Kuala Lumpur', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur', isPopular: true },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', isPopular: true },
  
  // North America
  { id: 'new_york', name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York', isPopular: true },
  { id: 'los_angeles', name: 'Los Angeles', country: 'USA', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', isPopular: true },
  { id: 'chicago', name: 'Chicago', country: 'USA', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', isPopular: true },
  { id: 'toronto', name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', isPopular: true },
  
  // Europe
  { id: 'london', name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', isPopular: true },
  { id: 'paris', name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', isPopular: true },
  { id: 'berlin', name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin', isPopular: true },
];

// Prayer name translations
export const PRAYER_NAMES = {
  en: {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  ar: {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  },
} as const;

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: string;
  screen?: string;
  action?: () => void;
  keywords: string[];
}

export interface SearchCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Quran Feature Types
export interface QuranVerse {
  id: number;
  verseNumber: number;
  text: string; // Arabic text
  translation: string;
  transliteration?: string;
  audioUrl?: string;
  page: number;
  juz: number;
  hizb: number;
  rukuNumber: number;
  manzil: number;
  sajda?: boolean; // If this verse requires sajda
}

export interface QuranSurah {
  id: number;
  name: string; // Arabic name
  englishName: string;
  meaning: string;
  verses: QuranVerse[];
  totalVerses: number;
  revelationType: 'meccan' | 'medinan';
  revelationOrder: number;
  bismillahPre: boolean; // Whether Bismillah comes before this surah
}

export interface QuranTranslation {
  id: string;
  name: string;
  author: string;
  language: string;
  languageCode: string;
  isDefault?: boolean;
}

export interface QuranReciter {
  id: string;
  name: string;
  language: string;
  style: 'murattal' | 'muallim' | 'translation';
  audioQuality: 'low' | 'medium' | 'high';
  baseUrl: string;
  isOfflineAvailable?: boolean;
}

export interface QuranBookmark {
  id: string;
  surahNumber: number;
  verseNumber: number;
  label?: string;
  notes?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuranReadingSession {
  id: string;
  startTime: string;
  endTime?: string;
  startSurah: number;
  startVerse: number;
  endSurah?: number;
  endVerse?: number;
  duration: number; // in seconds
  versesRead: number;
  mode: 'reading' | 'listening' | 'memorizing';
}

export interface QuranMemorizationProgress {
  id: string;
  surahNumber: number;
  verseNumber: number;
  status: 'learning' | 'reviewing' | 'mastered';
  accuracy: number; // 0-100
  lastReviewed: string;
  nextReviewDate: string;
  timesReviewed?: number;
  attempts: number;
  mistakes?: string[]; // Common mistakes made
  createdAt: string;
  updatedAt: string;
}

export interface QuranReadingPlan {
  id: string;
  name: string;
  type: 'complete_quran' | 'daily_pages' | 'weekly_surah' | 'custom';
  duration: number; // days
  dailyTarget: {
    pages?: number;
    verses?: number;
    surahs?: number[];
  };
  startDate: string;
  isActive: boolean;
  progress: {
    currentSurah: number;
    currentVerse: number;
    completedDays: number;
    streakDays: number;
  };
}

export interface QuranTafsir {
  id: string;
  name: string;
  author: string;
  language: string;
  languageCode: string;
  description: string;
}

export interface QuranWordAnalysis {
  text: string;
  translation: string;
  transliteration: string;
  root: string;
  grammar: string;
  morphology: string;
}

export interface QuranSearchResult {
  surahNumber: number;
  verseNumber: number;
  text: string;
  transliteration?: string;
  translation?: string;
  arabicText?: string;
  tags?: string[];
  score: number;
  context?: string;
  highlightedText?: string;
}

export interface QuranSettings {
  // Display settings
  arabicFont: 'uthmani' | 'indopak' | 'madani';
  arabicFontSize: number; // 12-32
  translationFontSize: number; // 10-24
  showTranslation: boolean; // Enable/disable translation display
  showTransliteration: boolean;
  showWordByWord: boolean;
  showVerseNumbers: boolean;
  
  // Reading settings
  defaultTranslation: string; // Translation ID
  secondaryTranslation?: string; // Optional second translation
  defaultReciter: string; // Reciter ID
  
  // Audio settings
  audioPlaybackSpeed: number; // 0.5-2.0
  autoAdvanceVerse: boolean;
  repeatMode: 'none' | 'verse' | 'page' | 'surah';
  repeatCount: number; // 1-10
  
  // Memorization settings
  memorationMode: boolean;
  hideArabicText: boolean;
  hideTranslation: boolean;
  showMistakeHighlights: boolean;
  
  // Reading plan settings
  dailyReadingReminder: boolean;
  reminderTime: string; // HH:MM
  weeklyGoalEnabled: boolean;
  monthlyGoalEnabled: boolean;
  
  // Accessibility
  voiceoverEnabled: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  
  // Offline settings
  downloadedRecitations: string[]; // Reciter IDs
  downloadedTranslations: string[]; // Translation IDs
  offlineModeEnabled: boolean;
}

export interface QuranState {
  // Current reading state
  currentSurah: number;
  currentVerse: number;
  currentPage: number;
  currentJuz: number;
  
  // Data
  surahs: QuranSurah[];
  translations: QuranTranslation[];
  reciters: QuranReciter[];
  tafsirs: QuranTafsir[];
  
  // User data
  bookmarks: QuranBookmark[];
  readingSessions: QuranReadingSession[];
  memorationProgress: QuranMemorizationProgress[];
  readingPlans: QuranReadingPlan[];
  
  // Settings
  settings: QuranSettings;
  
  // App state
  isLoading: boolean;
  error: string | null;
  
  // Audio state
  isPlaying: boolean;
  currentAudio?: {
    surah: number;
    verse: number;
    reciter: string;
    position: number; // in seconds
    duration: number;
  };
  
  // Search state
  searchResults: QuranSearchResult[];
  searchHistory: string[];
  
  // Reading mode
  readingMode: 'normal' | 'night' | 'focus' | 'memorization';
  isFullscreen: boolean;
  
  // Last read position
  lastReadPosition: {
    surah: number;
    verse: number;
    timestamp: string;
  };
}

export interface QuranContextType extends QuranState {
  // Navigation
  navigateToSurah: (surahNumber: number, verseNumber?: number) => Promise<void>;
  navigateToPage: (pageNumber: number) => Promise<void>;
  navigateToJuz: (juzNumber: number) => Promise<void>;
  navigateToLastRead: () => Promise<void>;
  
  // Reading
  markAsRead: (surah: number, verse: number) => Promise<void>;
  startReadingSession: (mode: 'reading' | 'listening' | 'memorizing') => Promise<void>;
  endReadingSession: () => Promise<void>;
  getCurrentReadingProgress: (surahNumber: number) => { 
    lastReadVerse: number; 
    completionPercentage: number; 
    totalVerses: number; 
  };
  
  // Bookmarks
  addBookmark: (surah: number, verse: number, label?: string, notes?: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  updateBookmark: (bookmarkId: string, updates: Partial<QuranBookmark>) => Promise<void>;
  
  // Memorization
  startMemorization: (surah: number, verse: number) => Promise<void>;
  recordMemorizationAttempt: (surah: number, verse: number, accuracy: number, mistakes: string[]) => Promise<void>;
  updateMemorizationProgress: (surah: number, verse: number, status: 'learning' | 'reviewing' | 'mastered') => Promise<void>;
  getMemorizationStats: () => any;
  
  // Audio
  playAudio: (surah: number, verse?: number, reciter?: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekAudio: (position: number) => Promise<void>;
  setPlaybackSpeed: (speed: number) => Promise<void>;
  
  // Search
  searchQuran: (query: string, options?: {
    includeTranslation?: boolean;
    includeTransliteration?: boolean;
    surahFilter?: number[];
    limit?: number;
  }) => Promise<QuranSearchResult[]>;
  clearSearch: () => void;
  
  // Reading Plans
  createReadingPlan: (plan: Omit<QuranReadingPlan, 'id' | 'progress'>) => Promise<void>;
  updateReadingPlan: (planId: string, updates: Partial<QuranReadingPlan>) => Promise<void>;
  deleteReadingPlan: (planId: string) => Promise<void>;
  markPlanProgress: (planId: string, surah: number, verse: number) => Promise<void>;
  
  // Settings
  updateQuranSettings: (updates: Partial<QuranSettings>) => Promise<void>;
  
  // Offline/Download
  downloadRecitation: (reciterId: string, surahNumbers?: number[]) => Promise<void>;
  downloadTranslation: (translationId: string) => Promise<void>;
  checkOfflineContent: () => Promise<{ available: boolean; size: string }>;
  
  // Word analysis
  getWordAnalysis: (surah: number, verse: number, wordIndex: number) => Promise<QuranWordAnalysis>;
  
  // Tafsir
  getTafsir: (surah: number, verse: number, tafsirId?: string) => Promise<string>;
  
  // Statistics
  getReadingStats: () => {
    totalTimeSpent: number;
    versesRead: number;
    surahs: number;
    currentStreak: number;
    longestStreak: number;
    memorizedVerses: number;
  };
} 