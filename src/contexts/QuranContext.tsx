import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { 
  QuranContextType, 
  QuranState, 
  QuranSettings,
  QuranBookmark,
  QuranReadingSession,
  QuranMemorizationProgress,
  QuranReadingPlan,
  QuranSearchResult,
  QuranWordAnalysis,
  QuranSurah,
  QuranTranslation,
  QuranReciter,
  QuranTafsir
} from '../types';
import { secureLogger } from '../utils/secureLogger';
import { storage } from '../utils/storage';
import { hapticFeedback } from '../utils/haptics';
import { quranApi, AVAILABLE_TRANSLATIONS, AVAILABLE_RECITERS, SURAH_METADATA } from '../utils/quranApi';

// Initial state
const initialState: QuranState = {
  // Current reading state
  currentSurah: 1,
  currentVerse: 1,
  currentPage: 1,
  currentJuz: 1,
  
  // Data
  surahs: [],
  translations: [],
  reciters: [],
  tafsirs: [],
  
  // User data
  bookmarks: [],
  readingSessions: [],
  memorationProgress: [],
  readingPlans: [],
  
  // Settings
  settings: {
    // Display settings
    arabicFont: 'uthmani',
    arabicFontSize: 18,
    translationFontSize: 16,
    showTranslation: true, // Enable translations by default
    showTransliteration: false,
    showWordByWord: false,
    showVerseNumbers: true,
    
    // Reading settings
    defaultTranslation: 'en_sahih',
    defaultReciter: 'mishary',
    
    // Audio settings
    audioPlaybackSpeed: 1.0,
    autoAdvanceVerse: false,
    repeatMode: 'none',
    repeatCount: 1,
    
    // Memorization settings
    memorationMode: false,
    hideArabicText: false,
    hideTranslation: false,
    showMistakeHighlights: true,
    
    // Reading plan settings
    dailyReadingReminder: false,
    reminderTime: '09:00',
    weeklyGoalEnabled: false,
    monthlyGoalEnabled: false,
    
    // Accessibility
    voiceoverEnabled: false,
    highContrastMode: false,
    reducedMotion: false,
    
    // Offline settings
    downloadedRecitations: [],
    downloadedTranslations: ['en_sahih'],
    offlineModeEnabled: false,
  },
  
  // App state
  isLoading: true,
  error: null,
  
  // Audio state
  isPlaying: false,
  currentAudio: undefined,
  
  // Search state
  searchResults: [],
  searchHistory: [],
  
  // Reading mode
  readingMode: 'normal',
  isFullscreen: false,
  
  // Last read position
  lastReadPosition: {
    surah: 1,
    verse: 1,
    timestamp: new Date().toISOString(),
  },
};

// Action types
type QuranAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_POSITION'; payload: { surah: number; verse: number; page?: number; juz?: number } }
  | { type: 'SET_SURAHS'; payload: QuranSurah[] }
  | { type: 'SET_TRANSLATIONS'; payload: QuranTranslation[] }
  | { type: 'SET_RECITERS'; payload: QuranReciter[] }
  | { type: 'SET_BOOKMARKS'; payload: QuranBookmark[] }
  | { type: 'ADD_BOOKMARK'; payload: QuranBookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: string }
  | { type: 'UPDATE_BOOKMARK'; payload: { id: string; updates: Partial<QuranBookmark> } }
  | { type: 'SET_READING_SESSIONS'; payload: QuranReadingSession[] }
  | { type: 'ADD_READING_SESSION'; payload: QuranReadingSession }
  | { type: 'END_READING_SESSION'; payload: string }
  | { type: 'SET_MEMORIZATION_PROGRESS'; payload: QuranMemorizationProgress[] }
  | { type: 'UPDATE_MEMORIZATION_PROGRESS'; payload: QuranMemorizationProgress }
  | { type: 'SET_READING_PLANS'; payload: QuranReadingPlan[] }
  | { type: 'ADD_READING_PLAN'; payload: QuranReadingPlan }
  | { type: 'UPDATE_READING_PLAN'; payload: { id: string; updates: Partial<QuranReadingPlan> } }
  | { type: 'DELETE_READING_PLAN'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<QuranSettings> }
  | { type: 'SET_AUDIO_STATE'; payload: { isPlaying: boolean; currentAudio?: any } }
  | { type: 'SET_SEARCH_RESULTS'; payload: QuranSearchResult[] }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'SET_READING_MODE'; payload: 'normal' | 'night' | 'focus' | 'memorization' }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'UPDATE_LAST_READ'; payload: { surah: number; verse: number } };

// Reducer
const quranReducer = (state: QuranState, action: QuranAction): QuranState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CURRENT_POSITION':
      return { 
        ...state, 
        currentSurah: action.payload.surah,
        currentVerse: action.payload.verse,
        currentPage: action.payload.page || state.currentPage,
        currentJuz: action.payload.juz || state.currentJuz,
      };
    
    case 'SET_SURAHS':
      return { ...state, surahs: action.payload };
    
    case 'SET_TRANSLATIONS':
      return { ...state, translations: action.payload };
    
    case 'SET_RECITERS':
      return { ...state, reciters: action.payload };
    
    case 'SET_BOOKMARKS':
      return { ...state, bookmarks: action.payload };
    
    case 'ADD_BOOKMARK':
      return { ...state, bookmarks: [...state.bookmarks, action.payload] };
    
    case 'REMOVE_BOOKMARK':
      return { 
        ...state, 
        bookmarks: state.bookmarks.filter(b => b.id !== action.payload) 
      };
    
    case 'UPDATE_BOOKMARK':
      return {
        ...state,
        bookmarks: state.bookmarks.map(b => 
          b.id === action.payload.id ? { ...b, ...action.payload.updates } : b
        )
      };
    
    case 'SET_READING_SESSIONS':
      return { ...state, readingSessions: action.payload };
    
    case 'ADD_READING_SESSION':
      return { ...state, readingSessions: [...state.readingSessions, action.payload] };
    
    case 'END_READING_SESSION':
      return {
        ...state,
        readingSessions: state.readingSessions.map(session =>
          session.id === action.payload 
            ? { ...session, endTime: new Date().toISOString() }
            : session
        )
      };
    
    case 'SET_MEMORIZATION_PROGRESS':
      return { ...state, memorationProgress: action.payload };
    
    case 'UPDATE_MEMORIZATION_PROGRESS':
      const existingIndex = state.memorationProgress.findIndex(
        p => p.surahNumber === action.payload.surahNumber && 
            p.verseNumber === action.payload.verseNumber
      );
      
      if (existingIndex >= 0) {
        return {
          ...state,
          memorationProgress: state.memorationProgress.map((p, i) =>
            i === existingIndex ? action.payload : p
          )
        };
      } else {
        return {
          ...state,
          memorationProgress: [...state.memorationProgress, action.payload]
        };
      }
    
    case 'SET_READING_PLANS':
      return { ...state, readingPlans: action.payload };
    
    case 'ADD_READING_PLAN':
      return { ...state, readingPlans: [...state.readingPlans, action.payload] };
    
    case 'UPDATE_READING_PLAN':
      return {
        ...state,
        readingPlans: state.readingPlans.map(plan =>
          plan.id === action.payload.id ? { ...plan, ...action.payload.updates } : plan
        )
      };
    
    case 'DELETE_READING_PLAN':
      return {
        ...state,
        readingPlans: state.readingPlans.filter(plan => plan.id !== action.payload)
      };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'SET_AUDIO_STATE':
      return { 
        ...state, 
        isPlaying: action.payload.isPlaying,
        currentAudio: action.payload.currentAudio 
      };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    
    case 'CLEAR_SEARCH':
      return { ...state, searchResults: [], searchHistory: [] };
    
    case 'SET_READING_MODE':
      return { ...state, readingMode: action.payload };
    
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    
    case 'UPDATE_LAST_READ':
      return {
        ...state,
        lastReadPosition: {
          surah: action.payload.surah,
          verse: action.payload.verse,
          timestamp: new Date().toISOString(),
        }
      };
    
    default:
      return state;
  }
};

// Create context
const QuranContext = createContext<QuranContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  QURAN_STATE: 'quran_state',
  BOOKMARKS: 'quran_bookmarks',
  READING_SESSIONS: 'quran_reading_sessions',
  MEMORIZATION_PROGRESS: 'quran_memorization_progress',
  READING_PLANS: 'quran_reading_plans',
  SETTINGS: 'quran_settings',
  LAST_READ_POSITION: 'quran_last_read_position',
};

// Provider component
export const QuranProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quranReducer, initialState);

  // Load data from storage
  const loadFromStorage = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [
        bookmarks,
        readingSessions,
        memorationProgress,
        readingPlans,
        settings,
        lastReadPosition,
      ] = await Promise.all([
        storage.getData(STORAGE_KEYS.BOOKMARKS),
        storage.getData(STORAGE_KEYS.READING_SESSIONS),
        storage.getData(STORAGE_KEYS.MEMORIZATION_PROGRESS),
        storage.getData(STORAGE_KEYS.READING_PLANS),
        storage.getData(STORAGE_KEYS.SETTINGS),
        storage.getData(STORAGE_KEYS.LAST_READ_POSITION),
      ]);

      if (bookmarks) dispatch({ type: 'SET_BOOKMARKS', payload: bookmarks });
      if (readingSessions) dispatch({ type: 'SET_READING_SESSIONS', payload: readingSessions });
      if (memorationProgress) dispatch({ type: 'SET_MEMORIZATION_PROGRESS', payload: memorationProgress });
      if (readingPlans) dispatch({ type: 'SET_READING_PLANS', payload: readingPlans });
      if (settings) dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      if (lastReadPosition) dispatch({ type: 'UPDATE_LAST_READ', payload: lastReadPosition });

      // Load basic Quran data (this would typically come from an API or local database)
      await loadQuranData();
      
    } catch (error) {
      secureLogger.error('Error loading Quran data from storage', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load Quran data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load basic Quran data (surahs, translations, reciters)
  const loadQuranData = useCallback(async () => {
    try {
      secureLogger.info('Loading Quran data from API');
      
      // Load data from Quran API
      const surahs = await quranApi.getSurahs();
      const translations = await quranApi.getTranslations();

      dispatch({ type: 'SET_SURAHS', payload: surahs });
      dispatch({ type: 'SET_TRANSLATIONS', payload: translations });
      dispatch({ type: 'SET_RECITERS', payload: AVAILABLE_RECITERS });

      secureLogger.info('Quran data loaded successfully', {
        surahs: surahs.length,
        translations: translations.length,
        reciters: AVAILABLE_RECITERS.length,
      });
    } catch (error) {
      secureLogger.error('Error loading Quran data from API, using fallback', error);
      
      // Fallback to static data
      const fallbackSurahs = SURAH_METADATA.map(surah => ({ ...surah, verses: [] }));
      dispatch({ type: 'SET_SURAHS', payload: fallbackSurahs });
      dispatch({ type: 'SET_TRANSLATIONS', payload: AVAILABLE_TRANSLATIONS });
      dispatch({ type: 'SET_RECITERS', payload: AVAILABLE_RECITERS });
      
      secureLogger.info('Fallback Quran data loaded', {
        surahs: fallbackSurahs.length,
        translations: AVAILABLE_TRANSLATIONS.length,
        reciters: AVAILABLE_RECITERS.length,
      });
    }
  }, []);

  // Save data to storage
  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await storage.storeData(key, data);
    } catch (error) {
      secureLogger.error(`Error saving ${key} to storage`, error);
    }
  }, []);

  // Navigation functions
  const navigateToSurah = useCallback(async (surahNumber: number, verseNumber: number = 1) => {
    dispatch({ 
      type: 'SET_CURRENT_POSITION', 
      payload: { surah: surahNumber, verse: verseNumber } 
    });
    dispatch({ type: 'UPDATE_LAST_READ', payload: { surah: surahNumber, verse: verseNumber } });
    await saveToStorage(STORAGE_KEYS.LAST_READ_POSITION, { surah: surahNumber, verse: verseNumber });
    hapticFeedback.light();
    secureLogger.info('Navigated to surah and verse', { surah: surahNumber, verse: verseNumber });
  }, [saveToStorage]);

  const navigateToPage = useCallback(async (pageNumber: number) => {
    // This would calculate the surah and verse from page number
    // For now, just updating the page
    dispatch({ 
      type: 'SET_CURRENT_POSITION', 
      payload: { surah: state.currentSurah, verse: state.currentVerse, page: pageNumber } 
    });
  }, [state.currentSurah, state.currentVerse]);

  const navigateToJuz = useCallback(async (juzNumber: number) => {
    // This would calculate the surah and verse from juz number
    dispatch({ 
      type: 'SET_CURRENT_POSITION', 
      payload: { surah: state.currentSurah, verse: state.currentVerse, juz: juzNumber } 
    });
  }, [state.currentSurah, state.currentVerse]);

  const navigateToLastRead = useCallback(async () => {
    const { surah, verse } = state.lastReadPosition;
    secureLogger.info('Continuing reading from last position', { surah, verse });
    await navigateToSurah(surah, verse);
  }, [state.lastReadPosition, navigateToSurah]);

  // Reading functions
  const markAsRead = useCallback(async (surah: number, verse: number) => {
    dispatch({ type: 'UPDATE_LAST_READ', payload: { surah, verse } });
    await saveToStorage(STORAGE_KEYS.LAST_READ_POSITION, { surah, verse });
    
    // Also update current position
    dispatch({ 
      type: 'SET_CURRENT_POSITION', 
      payload: { surah, verse } 
    });
    
    secureLogger.info('Marked verse as read and updated position', { surah, verse });
  }, [saveToStorage]);

  const getCurrentReadingProgress = useCallback((surahNumber: number) => {
    // Get the current reading progress for a specific surah
    const sessions = state.readingSessions.filter(s => s.startSurah === surahNumber);
    if (sessions.length === 0) return { lastReadVerse: 0, completionPercentage: 0 };
    
    const latestSession = sessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];
    
    const lastReadVerse = latestSession.endVerse || latestSession.startVerse || 0;
    const surahMetadata = SURAH_METADATA.find(s => s.id === surahNumber);
    const totalVerses = surahMetadata?.totalVerses || 1;
    const completionPercentage = (lastReadVerse / totalVerses) * 100;
    
    return { 
      lastReadVerse, 
      completionPercentage: Math.round(completionPercentage),
      totalVerses 
    };
  }, [state.readingSessions]);

  const startReadingSession = useCallback(async (mode: 'reading' | 'listening' | 'memorizing') => {
    const session: QuranReadingSession = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      startSurah: state.currentSurah,
      startVerse: state.currentVerse,
      duration: 0,
      versesRead: 0,
      mode,
    };
    
    dispatch({ type: 'ADD_READING_SESSION', payload: session });
    await saveToStorage(STORAGE_KEYS.READING_SESSIONS, [...state.readingSessions, session]);
  }, [state.currentSurah, state.currentVerse, state.readingSessions, saveToStorage]);

  const endReadingSession = useCallback(async () => {
    const activeSession = state.readingSessions.find(s => !s.endTime);
    if (activeSession) {
      dispatch({ type: 'END_READING_SESSION', payload: activeSession.id });
      await saveToStorage(STORAGE_KEYS.READING_SESSIONS, state.readingSessions);
      hapticFeedback.success();
    }
  }, [state.readingSessions, saveToStorage]);

  // Bookmark functions
  const addBookmark = useCallback(async (
    surah: number, 
    verse: number, 
    label?: string, 
    notes?: string
  ) => {
    try {
      const bookmark: QuranBookmark = {
        id: Date.now().toString(),
        surahNumber: surah,
        verseNumber: verse,
        label,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_BOOKMARK', payload: bookmark });
      await saveToStorage(STORAGE_KEYS.BOOKMARKS, [...state.bookmarks, bookmark]);
      hapticFeedback.success();
      secureLogger.info('Bookmark added successfully', { surah, verse });
    } catch (error) {
      secureLogger.error('Error adding bookmark', error);
      throw error;
    }
  }, [state.bookmarks, saveToStorage]);

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    try {
      dispatch({ type: 'REMOVE_BOOKMARK', payload: bookmarkId });
      await saveToStorage(
        STORAGE_KEYS.BOOKMARKS, 
        state.bookmarks.filter(b => b.id !== bookmarkId)
      );
      secureLogger.info('Bookmark removed successfully', { bookmarkId });
    } catch (error) {
      secureLogger.error('Error removing bookmark', error);
      throw error;
    }
  }, [state.bookmarks, saveToStorage]);

  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<QuranBookmark>) => {
    const updatedBookmark = { ...updates, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_BOOKMARK', payload: { id: bookmarkId, updates: updatedBookmark } });
    
    const updatedBookmarks = state.bookmarks.map(b => 
      b.id === bookmarkId ? { ...b, ...updatedBookmark } : b
    );
    await saveToStorage(STORAGE_KEYS.BOOKMARKS, updatedBookmarks);
  }, [state.bookmarks, saveToStorage]);

  // Audio functions
  const playAudio = useCallback(async (surah: number, verse?: number, reciter?: string) => {
    try {
      secureLogger.info('Starting audio playback', { surah, verse, reciter });
      
      // Update state to show that audio is being requested
      dispatch({ 
        type: 'SET_AUDIO_STATE', 
        payload: { 
          isPlaying: true, 
          currentAudio: { 
            surah, 
            verse: verse || 1, 
            reciter: reciter || state.settings.defaultReciter, 
            position: 0, 
            duration: 0,
            url: quranApi.getAudioUrl(surah, verse || 1, reciter || state.settings.defaultReciter)
          }
        } 
      });

      // Provide haptic feedback
      hapticFeedback.light();
      
      secureLogger.info('Audio playback request processed - UI should handle actual playback', { 
        surah, 
        verse: verse || 1,
        reciter: reciter || state.settings.defaultReciter
      });
      
    } catch (error) {
      secureLogger.error('Error processing audio playback request', { 
        error: error instanceof Error ? error.message : String(error),
        surah, 
        verse 
      });
      
      // Ensure state is updated even on error
      dispatch({ type: 'SET_AUDIO_STATE', payload: { isPlaying: false } });
    }
  }, [state.settings.defaultReciter]);

  const pauseAudio = useCallback(async () => {
    dispatch({ type: 'SET_AUDIO_STATE', payload: { isPlaying: false } });
  }, []);

  const stopAudio = useCallback(async () => {
    dispatch({ type: 'SET_AUDIO_STATE', payload: { isPlaying: false, currentAudio: undefined } });
  }, []);

  const seekAudio = useCallback(async (position: number) => {
    if (state.currentAudio) {
      dispatch({ 
        type: 'SET_AUDIO_STATE', 
        payload: { 
          isPlaying: state.isPlaying,
          currentAudio: { ...state.currentAudio, position }
        } 
      });
    }
  }, [state.currentAudio, state.isPlaying]);

  const setPlaybackSpeed = useCallback(async (speed: number) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { audioPlaybackSpeed: speed } });
    await saveToStorage(STORAGE_KEYS.SETTINGS, { ...state.settings, audioPlaybackSpeed: speed });
  }, [state.settings, saveToStorage]);

  // Search functions
  const searchQuran = useCallback(async (
    query: string, 
    options?: {
      includeTranslation?: boolean;
      includeTransliteration?: boolean;
      surahFilter?: number[];
      limit?: number;
    }
  ): Promise<QuranSearchResult[]> => {
    try {
      // This would implement actual search functionality
      // For now, return empty results
      const results: QuranSearchResult[] = [];
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      return results;
    } catch (error) {
      secureLogger.error('Error searching Quran', error);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH' });
  }, []);

  // Settings functions
  const updateQuranSettings = useCallback(async (updates: Partial<QuranSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
    await saveToStorage(STORAGE_KEYS.SETTINGS, { ...state.settings, ...updates });
  }, [state.settings, saveToStorage]);

  // Placeholder implementations for other functions
  const startMemorization = useCallback(async (surah: number, verse: number) => {
    // Implementation for memorization mode
  }, []);

  const recordMemorizationAttempt = useCallback(async (
    surah: number, 
    verse: number, 
    accuracy: number, 
    mistakes: string[]
  ) => {
    // Implementation for recording memorization attempts
  }, []);

  const getMemorizationStats = useCallback(() => {
    return {
      totalVerses: state.memorationProgress.length,
      mastered: state.memorationProgress.filter(p => p.status === 'mastered').length,
      learning: state.memorationProgress.filter(p => p.status === 'learning').length,
      reviewing: state.memorationProgress.filter(p => p.status === 'reviewing').length,
    };
  }, [state.memorationProgress]);

  const createReadingPlan = useCallback(async (plan: Omit<QuranReadingPlan, 'id' | 'progress'>) => {
    const newPlan: QuranReadingPlan = {
      ...plan,
      id: Date.now().toString(),
      progress: {
        currentSurah: 1,
        currentVerse: 1,
        completedDays: 0,
        streakDays: 0,
      },
    };
    
    dispatch({ type: 'ADD_READING_PLAN', payload: newPlan });
    await saveToStorage(STORAGE_KEYS.READING_PLANS, [...state.readingPlans, newPlan]);
  }, [state.readingPlans, saveToStorage]);

  const updateReadingPlan = useCallback(async (planId: string, updates: Partial<QuranReadingPlan>) => {
    dispatch({ type: 'UPDATE_READING_PLAN', payload: { id: planId, updates } });
    const updatedPlans = state.readingPlans.map(plan =>
      plan.id === planId ? { ...plan, ...updates } : plan
    );
    await saveToStorage(STORAGE_KEYS.READING_PLANS, updatedPlans);
  }, [state.readingPlans, saveToStorage]);

  const deleteReadingPlan = useCallback(async (planId: string) => {
    dispatch({ type: 'DELETE_READING_PLAN', payload: planId });
    await saveToStorage(
      STORAGE_KEYS.READING_PLANS,
      state.readingPlans.filter(plan => plan.id !== planId)
    );
  }, [state.readingPlans, saveToStorage]);

  const markPlanProgress = useCallback(async (planId: string, surah: number, verse: number) => {
    // Implementation for marking reading plan progress
  }, []);

  const downloadRecitation = useCallback(async (reciterId: string, surahNumbers?: number[]) => {
    // Implementation for downloading recitations
  }, []);

  const downloadTranslation = useCallback(async (translationId: string) => {
    // Implementation for downloading translations
  }, []);

  const checkOfflineContent = useCallback(async () => {
    return { available: false, size: '0 MB' };
  }, []);

  const getWordAnalysis = useCallback(async (
    surah: number, 
    verse: number, 
    wordIndex: number
  ): Promise<QuranWordAnalysis> => {
    // Implementation for word analysis
    return {
      text: '',
      translation: '',
      transliteration: '',
      root: '',
      grammar: '',
      morphology: '',
    };
  }, []);

  const getTafsir = useCallback(async (surah: number, verse: number, tafsirId?: string) => {
    // Implementation for getting tafsir
    return '';
  }, []);

  const getReadingStats = useCallback(() => {
    return {
      totalTimeSpent: state.readingSessions.reduce((acc, session) => acc + session.duration, 0),
      versesRead: state.readingSessions.reduce((acc, session) => acc + session.versesRead, 0),
      surahs: new Set(state.readingSessions.map(s => s.startSurah)).size,
      currentStreak: 0,
      longestStreak: 0,
      memorizedVerses: state.memorationProgress.filter(p => p.status === 'mastered').length,
    };
  }, [state.readingSessions, state.memorationProgress]);

  // Load data on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const contextValue: QuranContextType = {
    ...state,
    
    // Navigation
    navigateToSurah,
    navigateToPage,
    navigateToJuz,
    navigateToLastRead,
    
    // Reading
    markAsRead,
    startReadingSession,
    endReadingSession,
    getCurrentReadingProgress,
    
    // Bookmarks
    addBookmark,
    removeBookmark,
    updateBookmark,
    
    // Memorization
    startMemorization,
    recordMemorizationAttempt,
    getMemorizationStats,
    
    // Audio
    playAudio,
    pauseAudio,
    stopAudio,
    seekAudio,
    setPlaybackSpeed,
    
    // Search
    searchQuran,
    clearSearch,
    
    // Reading Plans
    createReadingPlan,
    updateReadingPlan,
    deleteReadingPlan,
    markPlanProgress,
    
    // Settings
    updateQuranSettings,
    
    // Offline/Download
    downloadRecitation,
    downloadTranslation,
    checkOfflineContent,
    
    // Word analysis
    getWordAnalysis,
    
    // Tafsir
    getTafsir,
    
    // Statistics
    getReadingStats,
  };

  return (
    <QuranContext.Provider value={contextValue}>
      {children}
    </QuranContext.Provider>
  );
};

// Hook to use the context
export const useQuranContext = () => {
  const context = useContext(QuranContext);
  if (context === undefined) {
    throw new Error('useQuranContext must be used within a QuranProvider');
  }
  return context;
}; 