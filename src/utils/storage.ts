import AsyncStorage from '@react-native-async-storage/async-storage';
import { Counter, Session, Settings, User } from '../types';

const STORAGE_KEYS = {
  COUNTERS: 'tasbeeh_counters',
  SESSIONS: 'tasbeeh_sessions',
  SETTINGS: 'tasbeeh_settings',
  USER: 'tasbeeh_user',
  ACTIVE_SESSION: 'tasbeeh_active_session',
  CURRENT_COUNTER: 'tasbeeh_current_counter',
} as const;

export const storage = {
  // Counter operations
  async getCounters(): Promise<Counter[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COUNTERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading counters:', error);
      return [];
    }
  },

  async saveCounters(counters: Counter[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
    } catch (error) {
      console.error('Error saving counters:', error);
      throw error;
    }
  },

  // Session operations
  async getSessions(): Promise<Session[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      // Keep only the last 100 sessions to manage storage
      const limitedSessions = sessions.slice(-100);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(limitedSessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  },

  // Settings operations
  async getSettings(): Promise<Settings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  },

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  // User operations
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  },

  async saveUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  // Active session operations
  async getActiveSession(): Promise<Session | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading active session:', error);
      return null;
    }
  },

  async saveActiveSession(session: Session | null): Promise<void> {
    try {
      if (session) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
    } catch (error) {
      console.error('Error saving active session:', error);
      throw error;
    }
  },

  // Current counter operations
  async getCurrentCounter(): Promise<Counter | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_COUNTER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading current counter:', error);
      return null;
    }
  },

  async saveCurrentCounter(counter: Counter | null): Promise<void> {
    try {
      if (counter) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_COUNTER, JSON.stringify(counter));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_COUNTER);
      }
    } catch (error) {
      console.error('Error saving current counter:', error);
      throw error;
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};

export default storage; 