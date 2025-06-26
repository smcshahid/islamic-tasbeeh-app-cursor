import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Counter, Session, Settings, User, AppState, TasbeehContextType, COLORS } from '../types';
import storage from '../utils/storage';
import { auth, database } from '../utils/supabase';
import { notifications } from '../utils/notifications';
import { secureLogger } from '../utils/secureLogger';
import { achievementManager, Achievement, UserStats, USER_LEVELS, shouldCheckAchievements } from '../utils/achievements';
import { playCountHaptic, setHapticsEnabled } from '../utils/haptics';
import { APP_CONSTANTS } from '../constants/app';

// Default values
const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  language: 'en',
  hapticFeedback: true,
  notifications: true,
  autoSync: false,
};

const DEFAULT_COUNTER: Counter = {
  id: 'default',
  name: 'Default',
  count: 0,
  color: COLORS.primary.green,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INITIAL_STATE: AppState = {
  counters: [DEFAULT_COUNTER],
  sessions: [],
  settings: DEFAULT_SETTINGS,
  user: null,
  activeSession: null,
  currentCounter: DEFAULT_COUNTER,
  hasLoadedFromStorage: false,
  isLoading: false,
  error: null,
};

// Action types
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COUNTERS'; payload: Counter[] }
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ACTIVE_SESSION'; payload: Session | null }
  | { type: 'SET_CURRENT_COUNTER'; payload: Counter | null }
  | { type: 'SET_LOADED_FROM_STORAGE'; payload: boolean }
  | { type: 'UPDATE_COUNTER'; payload: { id: string; updates: Partial<Counter> } }
  | { type: 'ADD_COUNTER'; payload: Counter }
  | { type: 'REMOVE_COUNTER'; payload: string }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_SESSION'; payload: { id: string; updates: Partial<Session> } };

// Reducer function to handle state updates
const tasbeehReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_COUNTERS':
      return { ...state, counters: action.payload };
    
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSession: action.payload };
    
    case 'SET_CURRENT_COUNTER':
      return { ...state, currentCounter: action.payload };
    
    case 'SET_LOADED_FROM_STORAGE':
      return { ...state, hasLoadedFromStorage: action.payload };
    
    case 'UPDATE_COUNTER':
      return {
        ...state,
        counters: state.counters.map(counter =>
          counter.id === action.payload.id
            ? { ...counter, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : counter
        ),
        currentCounter: state.currentCounter?.id === action.payload.id
          ? { ...state.currentCounter, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : state.currentCounter,
      };
    
    case 'ADD_COUNTER':
      return {
        ...state,
        counters: [...state.counters, action.payload],
      };
    
    case 'REMOVE_COUNTER':
      return {
        ...state,
        counters: state.counters.filter(counter => counter.id !== action.payload),
        currentCounter: state.currentCounter?.id === action.payload ? state.counters[0] || null : state.currentCounter,
      };
    
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
      };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
        activeSession: state.activeSession?.id === action.payload.id
          ? { ...state.activeSession, ...action.payload.updates }
          : state.activeSession,
      };
    
    default:
      return state;
  }
};

// Context
const TasbeehContext = createContext<TasbeehContextType | null>(null);

  // Memoized provider component
export const TasbeehProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(tasbeehReducer, INITIAL_STATE);
  
  // Achievement caching for better performance  
  const achievementCache = useMemo(() => new Map<string, any>(), []);
  const [lastAchievementCheck, setLastAchievementCheck] = useState<number>(0);

  // Initialize haptic system when settings are loaded
  useEffect(() => {
    if (state.hasLoadedFromStorage) {
      setHapticsEnabled(state.settings.hapticFeedback);
    }
  }, [state.hasLoadedFromStorage, state.settings.hapticFeedback]);

  // Memoized debounced save function with better performance
  const debouncedSave = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (state.hasLoadedFromStorage) {
          try {
            await Promise.all([
              storage.saveCounters(state.counters),
              storage.saveSessions(state.sessions),
              storage.saveSettings(state.settings),
              storage.saveUser(state.user),
              storage.saveActiveSession(state.activeSession),
              storage.saveCurrentCounter(state.currentCounter),
            ]);
          } catch (error) {
            secureLogger.error('Error saving to storage', error, 'TasbeehContext');
            dispatch({ type: 'SET_ERROR', payload: 'Failed to save data' });
          }
        }
      }, APP_CONSTANTS.PERFORMANCE.DEBOUNCE_DELAYS.SAVE_STORAGE);
    };
  }, []); // Empty dependency array to prevent infinite recreations

  // Load data from storage on app start
  const loadFromStorage = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [counters, sessions, settings, user, activeSession, currentCounter] = await Promise.all([
        storage.getCounters(),
        storage.getSessions(),
        storage.getSettings(),
        storage.getUser(),
        storage.getActiveSession(),
        storage.getCurrentCounter(),
      ]);

      dispatch({ type: 'SET_COUNTERS', payload: counters.length > 0 ? counters : [DEFAULT_COUNTER] });
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      dispatch({ type: 'SET_SETTINGS', payload: settings || DEFAULT_SETTINGS });
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: activeSession });
      dispatch({ type: 'SET_CURRENT_COUNTER', payload: currentCounter || counters[0] || DEFAULT_COUNTER });
      dispatch({ type: 'SET_LOADED_FROM_STORAGE', payload: true });
    } catch (error) {
      secureLogger.error('Error loading from storage', error, 'TasbeehContext');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save data to storage
  const saveToStorage = useCallback(async () => {
    if (!state.hasLoadedFromStorage) return;
    
    try {
      await Promise.all([
        storage.saveCounters(state.counters),
        storage.saveSessions(state.sessions),
        storage.saveSettings(state.settings),
        storage.saveUser(state.user),
        storage.saveActiveSession(state.activeSession),
        storage.saveCurrentCounter(state.currentCounter),
      ]);
    } catch (error) {
      secureLogger.error('Error saving to storage', error, 'TasbeehContext');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save data' });
    }
  }, [state]);

  // Optimized counter actions with useCallback
  const createCounter = useCallback(async (name: string, color?: string, target?: number) => {
    const newCounter: Counter = {
      id: Date.now().toString(),
      name,
      count: 0,
      target,
      color: color || COLORS.primary.blue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    dispatch({ type: 'ADD_COUNTER', payload: newCounter });
    debouncedSave();
  }, [debouncedSave]);

  const updateCounter = useCallback(async (id: string, updates: Partial<Counter>) => {
    dispatch({ type: 'UPDATE_COUNTER', payload: { id, updates } });
    debouncedSave();
  }, [debouncedSave]);

  const deleteCounter = useCallback(async (id: string) => {
    // Don't allow deleting the last counter
    if (state.counters.length <= 1) {
      dispatch({ type: 'SET_ERROR', payload: 'Cannot delete the last counter' });
      return;
    }
    
    // End active session if it belongs to this counter
    if (state.activeSession?.counterId === id) {
      await endSession();
    }
    
    dispatch({ type: 'REMOVE_COUNTER', payload: id });
    debouncedSave();
  }, [state.counters.length, state.activeSession, debouncedSave]);

  // Optimized increment with performance improvements and smart achievement checking
  const incrementCounter = useCallback(async (id: string) => {
    const counter = state.counters.find(c => c.id === id);
    if (!counter) return;

    const previousCount = counter.count;
    const newCount = previousCount + 1;

    // Enhanced contextual haptic feedback
    if (state.settings.hapticFeedback && Platform.OS !== 'web') {
      await playCountHaptic(newCount, counter.target);
    }

    // Start session if not active
    if (!state.activeSession || state.activeSession.counterId !== id) {
      await startSession(id);
    }

    // Increment counter
    dispatch({ type: 'UPDATE_COUNTER', payload: { id, updates: { count: newCount } } });
    
    // Update active session
    if (state.activeSession && state.activeSession.counterId === id) {
      const updatedSession: Partial<Session> = {
        endCount: newCount,
        totalCounts: newCount - state.activeSession.startCount,
        duration: Math.floor((Date.now() - new Date(state.activeSession.startTime).getTime()) / 1000),
      };
      dispatch({ type: 'UPDATE_SESSION', payload: { id: state.activeSession.id, updates: updatedSession } });
    }

    // PERFORMANCE OPTIMIZATION: Smart achievement checking with caching
    // Only check achievements when it makes sense (major milestones, Tasbih completions, etc.)
    if (state.settings.notifications && shouldCheckAchievements(newCount, previousCount)) {
      try {
        // Generate cache key based on relevant data
        const cacheKey = `${id}-${newCount}-${state.sessions.length}-${Date.now()}`;
        
        // Check if we need to recalculate achievements
        const now = Date.now();
        const timeSinceLastCheck = now - lastAchievementCheck;
        const shouldCheck = timeSinceLastCheck > APP_CONSTANTS.PERFORMANCE.CACHE_DURATION.ACHIEVEMENTS;
        
        if (!shouldCheck && achievementCache.has(cacheKey)) {
          // Use cached result
          const cachedResult = achievementCache.get(cacheKey);
          if (cachedResult && cachedResult.length > 0) {
            for (const achievement of cachedResult) {
              await notifications.showSmartAchievementNotification(achievement);
            }
          }
          return;
        }
        
        // Calculate previous and new user stats
        const previousStats = achievementManager.calculateUserStats(
          state.counters.map(c => c.id === id ? { ...c, count: previousCount } : c),
          state.sessions,
          [] // TODO: Add achievements to state
        );
        
        const newStats = achievementManager.calculateUserStats(
          state.counters.map(c => c.id === id ? { ...c, count: newCount } : c),
          state.sessions,
          [] // TODO: Add achievements to state
        );

        // Get user ranking for top 10 checks (simplified for now)
        const userRanking = { percentile: 50, rank: 'Getting Started' as const };

        // Check for triggered achievements
        const triggeredAchievements = achievementManager.shouldNotify(
          previousStats, 
          newStats, 
          userRanking
        );
        
        // Cache the result
        achievementCache.set(cacheKey, triggeredAchievements);
        setLastAchievementCheck(now);
        
        // Clean old cache entries (keep only last 10)
        if (achievementCache.size > 10) {
          const keys = Array.from(achievementCache.keys());
          keys.slice(0, -10).forEach(key => achievementCache.delete(key));
        }
        
        // Send notifications for triggered achievements
        for (const achievement of triggeredAchievements) {
          await notifications.showSmartAchievementNotification(achievement);
        }
      } catch (achievementError) {
        // Silently handle achievement errors to not disrupt counting
        secureLogger.error('Achievement check error', achievementError, 'TasbeehContext');
      }
    }

    debouncedSave();
  }, [state.counters, state.sessions, state.activeSession, state.settings.hapticFeedback, state.settings.notifications, achievementCache, lastAchievementCheck, debouncedSave]);

  const resetCounter = useCallback(async (id: string) => {
    // End active session if exists
    if (state.activeSession?.counterId === id) {
      await endSession();
    }
    
    dispatch({ type: 'UPDATE_COUNTER', payload: { id, updates: { count: 0 } } });
    debouncedSave();
  }, [state.activeSession, debouncedSave]);

  const setCurrentCounter = useCallback((counter: Counter) => {
    dispatch({ type: 'SET_CURRENT_COUNTER', payload: counter });
    debouncedSave();
  }, [debouncedSave]);

  // Session actions with performance optimizations
  const startSession = useCallback(async (counterId: string) => {
    const counter = state.counters.find(c => c.id === counterId);
    if (!counter) return;

    // End existing session if different counter
    if (state.activeSession && state.activeSession.counterId !== counterId) {
      await endSession();
    }

    // Don't start new session if already active for this counter
    if (state.activeSession?.counterId === counterId) return;

    const newSession: Session = {
      id: Date.now().toString(),
      counterId,
      counterName: counter.name,
      startTime: new Date().toISOString(),
      startCount: counter.count,
      endCount: counter.count,
      duration: 0,
      totalCounts: 0,
    };

    dispatch({ type: 'SET_ACTIVE_SESSION', payload: newSession });
    debouncedSave();
  }, [state.counters, state.activeSession, debouncedSave]);

  const endSession = useCallback(async () => {
    if (!state.activeSession) return;

    const endTime = new Date().toISOString();
    const duration = Math.floor((Date.now() - new Date(state.activeSession.startTime).getTime()) / 1000);
    
    const completedSession: Session = {
      ...state.activeSession,
      endTime,
      duration,
    };

    dispatch({ type: 'ADD_SESSION', payload: completedSession });
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: null });

    // Check for legendary streak achievements after completing a session
    if (state.settings.notifications) {
      // Calculate previous and new user stats including the new session
      const previousStats = achievementManager.calculateUserStats(
        state.counters,
        state.sessions, // Without the new session
        []
      );
      
      const newStats = achievementManager.calculateUserStats(
        state.counters,
        [...state.sessions, completedSession], // With the new session
        []
      );

      // Get user ranking for top 10 checks
      const userRanking = getUserRanking();

      // Check for legendary achievements (especially streak-based ones)
      const triggeredAchievements = achievementManager.shouldNotify(
        previousStats, 
        newStats, 
        userRanking
      );
      
      // Send notifications for legendary achievements
      for (const achievement of triggeredAchievements) {
        await notifications.showSmartAchievementNotification(achievement);
      }
    }

    debouncedSave();
  }, [state.activeSession, state.sessions, state.settings.notifications, debouncedSave]);

  // Helper function to calculate consecutive days with sessions
  const calculateStreakDays = (sessions: Session[]) => {
    if (sessions.length === 0) return 0;

    // Group sessions by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(session);
      return acc;
    }, {} as Record<string, Session[]>);

    // Get sorted unique dates
    const sortedDates = Object.keys(sessionsByDate)
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

    if (sortedDates.length === 0) return 0;

    // Calculate streak from today backwards
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === expectedDate.getTime()) {
        streakDays++;
      } else {
        break;
      }
    }

    return streakDays;
  };

  // Settings actions with haptic management integration
  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    // Update haptic manager when haptic feedback setting changes
    if ('hapticFeedback' in updates) {
      setHapticsEnabled(updates.hapticFeedback ?? false);
    }
    
    dispatch({ type: 'SET_SETTINGS', payload: { ...state.settings, ...updates } });
    debouncedSave();
  }, [state.settings, debouncedSave]);

  // Auth actions with Supabase integration
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials or create an account.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the verification link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
        }
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw new Error(errorMessage);
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || undefined,
          isGuest: false,
          lastSyncAt: new Date().toISOString(),
        };
        
        dispatch({ type: 'SET_USER', payload: newUser });
        
        // Try to load cloud data, but don't fail the sign-in if it doesn't work
        try {
          await loadFromCloud();
        } catch (cloudError) {
          secureLogger.error('Failed to load cloud data after sign in', cloudError, 'TasbeehContext');
          // Don't show error to user, they're still signed in
        }
        
        debouncedSave();
        
        // Show success message
        dispatch({ type: 'SET_ERROR', payload: 'Successfully signed in!' });
        setTimeout(() => {
          dispatch({ type: 'SET_ERROR', payload: null });
        }, 2000);
      }
    } catch (error: any) {
      secureLogger.error('Sign in error', error, 'TasbeehContext');
      
      // If it's already a formatted error, just re-throw
      if (error.message && typeof error.message === 'string') {
        throw error;
      }
      
      // Default error message
      const errorMessage = 'Failed to sign in. Please check your credentials and try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadFromCloud, debouncedSave]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await auth.signUp(email, password);
      const { data, error, userState } = response as any;
      
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }

      if (data?.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || undefined,
          isGuest: false,
          lastSyncAt: new Date().toISOString(),
        };
        
        // Only set user state if they have a session (confirmed) or no confirmation needed
        if (userState?.hasSession || !userState?.needsConfirmation) {
          dispatch({ type: 'SET_USER', payload: newUser });
          debouncedSave();
        }
        
        // Show appropriate success message based on user state
        let successMessage = '';
        if (userState?.needsConfirmation) {
          successMessage = 'Account created! Please check your email and click the verification link to complete setup.';
          secureLogger.info('User created but needs email confirmation', { userId: data.user.id }, 'TasbeehContext');
        } else if (userState?.hasSession) {
          successMessage = 'Account created and ready to use!';
          secureLogger.info('User created and auto-signed in', { userId: data.user.id }, 'TasbeehContext');
        } else {
          successMessage = 'Account created successfully! You can now sign in.';
          secureLogger.info('User created, manual sign-in required', { userId: data.user.id }, 'TasbeehContext');
        }
        
        dispatch({ type: 'SET_ERROR', payload: successMessage });
        setTimeout(() => {
          dispatch({ type: 'SET_ERROR', payload: null });
        }, 5000); // 5 seconds for account creation message
      } else {
        secureLogger.error('Sign up completed but no user data returned', response, 'TasbeehContext');
        dispatch({ type: 'SET_ERROR', payload: 'Account creation completed but verification needed. Please try signing in.' });
      }
    } catch (error) {
      secureLogger.error('Sign up error', error, 'TasbeehContext');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create account. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [debouncedSave]);

  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { error } = await auth.signOut();
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }
      
      dispatch({ type: 'SET_USER', payload: null });
      debouncedSave();
    } catch (error) {
      secureLogger.error('Sign out error', error, 'TasbeehContext');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign out' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [debouncedSave]);

  const signInAsGuest = useCallback(async () => {
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      isGuest: true,
    };
    dispatch({ type: 'SET_USER', payload: guestUser });
    debouncedSave();
  }, [debouncedSave]);

  // Get user statistics and level
  const getUserStats = useCallback((): UserStats => {
    return achievementManager.calculateUserStats(
      state.counters,
      state.sessions.filter(s => s.endTime), // Only completed sessions
      [] // TODO: Add achievements tracking to state
    );
  }, [state.counters, state.sessions]);

  // Get user ranking compared to global stats (mock data for now)
  const getUserRanking = useCallback(() => {
    const userStats = getUserStats();
    
    // Mock global stats - in production, this would come from an aggregated database query
    const mockGlobalStats = {
      totalUsers: 10000,
      totalCounts: 5000000,
      averageDailyCounts: 25,
      topPercentileThreshold: 2500, // 90th percentile
      medianCounts: 150,
      averageStreak: 5
    };

    return achievementManager.calculateUserRanking(userStats, mockGlobalStats);
  }, [getUserStats]);

  // Get user level progression
  const getNextLevelProgress = useCallback(() => {
    const userStats = getUserStats();
    const currentLevel = userStats.level;
    const nextLevel = USER_LEVELS.find(
      level => level.minCounts > currentLevel.minCounts
    );

    if (!nextLevel) {
      return {
        isMaxLevel: true,
        progress: 100,
        remaining: 0,
        nextLevel: null
      };
    }

    const progress = Math.min(
      ((userStats.totalCounts - currentLevel.minCounts) / 
       (nextLevel.minCounts - currentLevel.minCounts)) * 100,
      100
    );

    return {
      isMaxLevel: false,
      progress: Math.round(progress),
      remaining: nextLevel.minCounts - userStats.totalCounts,
      nextLevel
    };
  }, [getUserStats]);

  // Load data from cloud
  const loadFromCloud = useCallback(async () => {
    if (!state.user || state.user.isGuest) {
      dispatch({ type: 'SET_ERROR', payload: 'Please sign in to load cloud data' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const [countersResult, sessionsResult] = await Promise.all([
        database.getCounters(state.user.id),
        database.getSessions(state.user.id),
      ]);

      // Check for authentication errors
      if (countersResult.error?.message?.includes('not authenticated')) {
        dispatch({ type: 'SET_ERROR', payload: 'Authentication expired. Please sign in again.' });
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      if (sessionsResult.error?.message?.includes('not authenticated')) {
        dispatch({ type: 'SET_ERROR', payload: 'Authentication expired. Please sign in again.' });
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      // Update data if successful
      if (countersResult.data && countersResult.data.length > 0) {
        dispatch({ type: 'SET_COUNTERS', payload: countersResult.data });
        dispatch({ type: 'SET_CURRENT_COUNTER', payload: countersResult.data[0] });
      }

      if (sessionsResult.data && sessionsResult.data.length > 0) {
        dispatch({ type: 'SET_SESSIONS', payload: sessionsResult.data });
      }

      // Update last sync time
      const updatedUser: User = {
        ...state.user,
        lastSyncAt: new Date().toISOString(),
      };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      debouncedSave();
    } catch (error) {
      secureLogger.error('Load from cloud error', error, 'TasbeehContext');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from cloud. Please check your connection.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, debouncedSave]);

  // Cloud sync implementation
  const syncWithCloud = useCallback(async () => {
    if (!state.user || state.user.isGuest) {
      dispatch({ type: 'SET_ERROR', payload: 'Please sign in to sync data' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Verify current session before attempting sync
      const { data: { session }, error: sessionError } = await auth.getSession();
      
      if (sessionError || !session?.user) {
        secureLogger.error('Session verification failed before sync', sessionError, 'TasbeehContext');
        dispatch({ type: 'SET_ERROR', payload: 'Authentication expired. Please sign in again.' });
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      // Ensure the session user matches our current user
      if (session.user.id !== state.user.id) {
        secureLogger.error('Session user mismatch', { sessionUserId: session.user.id, contextUserId: state.user.id }, 'TasbeehContext');
        dispatch({ type: 'SET_ERROR', payload: 'Authentication mismatch. Please sign in again.' });
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      // Upload local data to cloud with verified session
      const [countersResult, sessionsResult] = await Promise.all([
        database.syncCounters(state.counters, state.user.id),
        database.syncSessions(state.sessions.filter(s => s.endTime), state.user.id), // Only sync completed sessions
      ]);

      // Check for authentication errors
      if (countersResult.error) {
        secureLogger.error('Error syncing counters', countersResult.error, 'TasbeehContext');
        const errorMessage = countersResult.error.message?.includes('not authenticated') 
          ? 'Authentication expired. Please sign in again.'
          : 'Failed to sync counters. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        
        if (countersResult.error.message?.includes('not authenticated')) {
          dispatch({ type: 'SET_USER', payload: null });
        }
        return;
      }

      if (sessionsResult.error) {
        secureLogger.error('Error syncing sessions', sessionsResult.error, 'TasbeehContext');
        const errorMessage = sessionsResult.error.message?.includes('not authenticated')
          ? 'Authentication expired. Please sign in again.'
          : 'Failed to sync sessions. Please try again.';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        
        if (sessionsResult.error.message?.includes('not authenticated')) {
          dispatch({ type: 'SET_USER', payload: null });
        }
        return;
      }

      // Then, load updated data from cloud
      await loadFromCloud();
      
      // Update last sync time
      const updatedUser: User = {
        ...state.user,
        lastSyncAt: new Date().toISOString(),
      };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      // Show success message temporarily
      dispatch({ type: 'SET_ERROR', payload: 'Sync completed successfully!' });
      setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 2000);
      
    } catch (error) {
      secureLogger.error('Sync error', error, 'TasbeehContext');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync with cloud. Please check your connection.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, state.counters, state.sessions, loadFromCloud]);

  // Listen to auth changes
  useEffect(() => {
    const { data: authListener } = auth.onAuthStateChange(async (event, session) => {
      secureLogger.info(`Auth state changed: ${event}`, session?.user?.id, 'TasbeehContext');
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Only update user state if not already set or different user
        if (!state.user || state.user.id !== session.user.id) {
          const newUser: User = {
            id: session.user.id,
            email: session.user.email || undefined,
            isGuest: false,
            lastSyncAt: new Date().toISOString(),
          };
          dispatch({ type: 'SET_USER', payload: newUser });
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear user state
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [state.user]);

  // Load data on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Auto-save when state changes
  useEffect(() => {
    if (state.hasLoadedFromStorage) {
      debouncedSave();
    }
  }, [state, debouncedSave]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<TasbeehContextType>(() => ({
    ...state,
    createCounter,
    updateCounter,
    deleteCounter,
    incrementCounter,
    resetCounter,
    setCurrentCounter,
    startSession,
    endSession,
    updateSettings,
    saveToStorage,
    loadFromStorage,
    loadFromCloud,
    syncWithCloud,
    signUp,
    signIn,
    signOut,
    signInAsGuest,
    getUserStats,
    getUserRanking,
    getNextLevelProgress,
  }), [
    state,
    createCounter,
    updateCounter,
    deleteCounter,
    incrementCounter,
    resetCounter,
    setCurrentCounter,
    startSession,
    endSession,
    updateSettings,
    saveToStorage,
    loadFromStorage,
    loadFromCloud,
    syncWithCloud,
    signUp,
    signIn,
    signOut,
    signInAsGuest,
    getUserStats,
    getUserRanking,
    getNextLevelProgress,
  ]);

  return (
    <TasbeehContext.Provider value={contextValue}>
      {children}
    </TasbeehContext.Provider>
  );
});

export function useTasbeeh() {
  const context = useContext(TasbeehContext);
  if (!context) {
    throw new Error('useTasbeeh must be used within a TasbeehProvider');
  }
  return context;
}

export default TasbeehContext; 