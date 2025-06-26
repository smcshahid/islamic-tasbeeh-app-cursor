import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Counter, Session, Settings, User, AppState, TasbeehContextType, COLORS } from '../types';
import storage from '../utils/storage';
import { auth, database } from '../utils/supabase';
import { notifications } from '../utils/notifications';

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

// Reducer
function tasbeehReducer(state: AppState, action: Action): AppState {
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
}

// Context
const TasbeehContext = createContext<TasbeehContextType | null>(null);

export function TasbeehProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tasbeehReducer, INITIAL_STATE);

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (state.hasLoadedFromStorage) {
            await saveToStorage();
          }
        }, 500);
      };
    })(),
    [state.hasLoadedFromStorage]
  );

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
      console.error('Error loading from storage:', error);
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
      console.error('Error saving to storage:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save data' });
    }
  }, [state]);

  // Counter actions
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

  const incrementCounter = useCallback(async (id: string) => {
    const counter = state.counters.find(c => c.id === id);
    if (!counter) return;

    const newCount = counter.count + 1;

    // Haptic feedback
    if (state.settings.hapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    // Check for achievements and notifications
    if (state.settings.notifications) {
      // Check if target reached
      if (counter.target && newCount >= counter.target && counter.count < counter.target) {
        await notifications.showAchievementNotification(counter.name, counter.target, newCount);
      }

      // Check for milestones
      await notifications.showMilestoneNotification(counter.name, newCount);
    }

    debouncedSave();
  }, [state.counters, state.settings.hapticFeedback, state.settings.notifications, state.activeSession, debouncedSave]);

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

  // Session actions
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
    debouncedSave();
  }, [state.activeSession, debouncedSave]);

  // Settings actions
  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
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
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || undefined,
          isGuest: false,
          lastSyncAt: new Date().toISOString(),
        };
        
        dispatch({ type: 'SET_USER', payload: newUser });
        
        // Auto-load cloud data after sign in
        await loadFromCloud();
        
        debouncedSave();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign in' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadFromCloud, debouncedSave]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data, error } = await auth.signUp(email, password);
      
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || undefined,
          isGuest: false,
          lastSyncAt: new Date().toISOString(),
        };
        
        dispatch({ type: 'SET_USER', payload: newUser });
        debouncedSave();
      }
    } catch (error) {
      console.error('Sign up error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sign up' });
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
      console.error('Sign out error:', error);
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
      console.error('Load from cloud error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from cloud' });
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

      // Check current authentication status
      const { data: { session }, error: sessionError } = await auth.getSession();
      
      if (sessionError || !session) {
        dispatch({ type: 'SET_ERROR', payload: 'Authentication expired. Please sign in again.' });
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      // First, upload local data to cloud
      const [countersResult, sessionsResult] = await Promise.all([
        database.syncCounters(state.counters, state.user.id),
        database.syncSessions(state.sessions.filter(s => s.endTime), state.user.id), // Only sync completed sessions
      ]);

      if (countersResult.error) {
        console.error('Error syncing counters:', countersResult.error);
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
        console.error('Error syncing sessions:', sessionsResult.error);
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
      
      // Show success message
      dispatch({ type: 'SET_ERROR', payload: null });
      
    } catch (error) {
      console.error('Sync error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync with cloud' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, state.counters, state.sessions, loadFromCloud]);

  // Listen to auth changes
  useEffect(() => {
    const { data: authListener } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const newUser: User = {
          id: session.user.id,
          email: session.user.email || undefined,
          isGuest: false,
          lastSyncAt: new Date().toISOString(),
        };
        dispatch({ type: 'SET_USER', payload: newUser });
        
        // Load cloud data after authentication
        if (state.hasLoadedFromStorage) {
          try {
            const [countersResult, sessionsResult] = await Promise.all([
              database.getCounters(session.user.id),
              database.getSessions(session.user.id),
            ]);

            if (countersResult.data && countersResult.data.length > 0) {
              dispatch({ type: 'SET_COUNTERS', payload: countersResult.data });
              dispatch({ type: 'SET_CURRENT_COUNTER', payload: countersResult.data[0] });
            }

            if (sessionsResult.data && sessionsResult.data.length > 0) {
              dispatch({ type: 'SET_SESSIONS', payload: sessionsResult.data });
            }
          } catch (error) {
            console.error('Error loading cloud data on auth change:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [state.hasLoadedFromStorage]);

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

  const contextValue: TasbeehContextType = {
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
  };

  return (
    <TasbeehContext.Provider value={contextValue}>
      {children}
    </TasbeehContext.Provider>
  );
}

export function useTasbeeh() {
  const context = useContext(TasbeehContext);
  if (!context) {
    throw new Error('useTasbeeh must be used within a TasbeehProvider');
  }
  return context;
}

export default TasbeehContext; 