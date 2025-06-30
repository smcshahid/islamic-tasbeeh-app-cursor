import AsyncStorage from '@react-native-async-storage/async-storage';
import { Counter, Session, Settings, User } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { secureLogger } from './secureLogger';
import { APP_CONSTANTS } from '../constants/app';

const STORAGE_KEYS = {
  COUNTERS: 'tasbeeh_counters',
  SESSIONS: 'tasbeeh_sessions',
  SETTINGS: 'tasbeeh_settings',
  USER: 'tasbeeh_user',
  ACTIVE_SESSION: 'tasbeeh_active_session',
  CURRENT_COUNTER: 'tasbeeh_current_counter',
} as const;

// Export/Import data structure
interface TasbeehExportData {
  version: string;
  exportDate: string;
  counters: Counter[];
  sessions: Session[];
  settings: Settings;
  metadata: {
    totalCounters: number;
    totalSessions: number;
    totalCounts: number;
  };
}

export const storage = {
  // Generic data operations
  async getData(key: string): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      secureLogger.error(`Error loading data for key: ${key}`, error, 'Storage');
      return null;
    }
  },

  async storeData(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      secureLogger.error(`Error storing data for key: ${key}`, error, 'Storage');
      throw error;
    }
  },

  async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      secureLogger.error(`Error removing data for key: ${key}`, error, 'Storage');
      throw error;
    }
  },
  // Counter operations
  async getCounters(): Promise<Counter[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COUNTERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      secureLogger.error('Error loading counters', error, 'Storage');
      return [];
    }
  },

  async saveCounters(counters: Counter[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
    } catch (error) {
      secureLogger.error('Error saving counters', error, 'Storage');
      throw error;
    }
  },

  // Session operations
  async getSessions(): Promise<Session[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      secureLogger.error('Error loading sessions', error, 'Storage');
      return [];
    }
  },

  async saveSessions(sessions: Session[]): Promise<void> {
    try {
          // Keep only the last sessions to manage storage
    const limitedSessions = sessions.slice(-APP_CONSTANTS.LIMITS.MAX_SESSIONS_STORED);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(limitedSessions));
    } catch (error) {
      secureLogger.error('Error saving sessions', error, 'Storage');
      throw error;
    }
  },

  // Settings operations
  async getSettings(): Promise<Settings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      secureLogger.error('Error loading settings', error, 'Storage');
      return null;
    }
  },

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      secureLogger.error('Error saving settings', error, 'Storage');
      throw error;
    }
  },

  // User operations
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      secureLogger.error('Error loading user', error, 'Storage');
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
      secureLogger.error('Error saving user', error, 'Storage');
      throw error;
    }
  },

  // Active session operations
  async getActiveSession(): Promise<Session | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      secureLogger.error('Error loading active session', error, 'Storage');
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
      secureLogger.error('Error saving active session', error, 'Storage');
      throw error;
    }
  },

  // Current counter operations
  async getCurrentCounter(): Promise<Counter | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_COUNTER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      secureLogger.error('Error loading current counter', error, 'Storage');
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
      secureLogger.error('Error saving current counter', error, 'Storage');
      throw error;
    }
  },

  // Export data to file
  async exportData(): Promise<string> {
    try {
      const [counters, sessions, settings] = await Promise.all([
        this.getCounters(),
        this.getSessions(),
        this.getSettings(),
      ]);

      const totalCounts = counters.reduce((sum, counter) => sum + counter.count, 0);

      const exportData: TasbeehExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        counters,
        sessions,
        settings: settings || {
          theme: 'auto',
          language: 'en',
          hapticFeedback: true,
          notifications: true,
          autoSync: false,
        },
        metadata: {
          totalCounters: counters.length,
          totalSessions: sessions.length,
          totalCounts,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `tasbeeh_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Tasbeeh Data',
        });
      }

      return fileUri;
    } catch (error) {
      secureLogger.error('Error exporting data', error, 'Storage');
      throw new Error('Failed to export data. Please try again.');
    }
  },

  // Import data from file
  async importData(): Promise<{
    success: boolean;
    data?: TasbeehExportData;
    error?: string;
  }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, error: 'Import cancelled' };
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importData: TasbeehExportData = JSON.parse(fileContent);

      // Validate the imported data structure
      if (!this.validateImportData(importData)) {
        return { success: false, error: 'Invalid file format. Please select a valid Tasbeeh backup file.' };
      }

      return { success: true, data: importData };
    } catch (error) {
      secureLogger.error('Error importing data', error, 'Storage');
      return { success: false, error: 'Failed to import data. Please check the file format.' };
    }
  },

  // Apply imported data to storage
  async applyImportedData(data: TasbeehExportData, mergeMode: 'replace' | 'merge' = 'replace'): Promise<void> {
    try {
      if (mergeMode === 'replace') {
        // Replace all data
        await this.saveCounters(data.counters);
        await this.saveSessions(data.sessions);
        await this.saveSettings(data.settings);
      } else {
        // Merge data
        const existingCounters = await this.getCounters();
        const existingSessions = await this.getSessions();
        const existingSettings = await this.getSettings();

        // Merge counters (avoid duplicates by ID)
        const mergedCounters = [...existingCounters];
        data.counters.forEach(importedCounter => {
          const existingIndex = mergedCounters.findIndex(c => c.id === importedCounter.id);
          if (existingIndex >= 0) {
            // Update existing counter with imported data if it's newer
            if (new Date(importedCounter.updatedAt) > new Date(mergedCounters[existingIndex].updatedAt)) {
              mergedCounters[existingIndex] = importedCounter;
            }
          } else {
            mergedCounters.push(importedCounter);
          }
        });

        // Merge sessions (avoid duplicates by ID)
        const mergedSessions = [...existingSessions];
        data.sessions.forEach(importedSession => {
          if (!mergedSessions.some(s => s.id === importedSession.id)) {
            mergedSessions.push(importedSession);
          }
        });

        // Merge settings (keep most recent preferences)
        const mergedSettings = { ...existingSettings, ...data.settings };

        await this.saveCounters(mergedCounters);
        await this.saveSessions(mergedSessions);
        await this.saveSettings(mergedSettings);
      }
    } catch (error) {
      secureLogger.error('Error applying imported data', error, 'Storage');
      throw new Error('Failed to apply imported data.');
    }
  },

  // Validate imported data structure
  validateImportData(data: any): data is TasbeehExportData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.exportDate === 'string' &&
      Array.isArray(data.counters) &&
      Array.isArray(data.sessions) &&
      data.settings &&
      data.metadata &&
      typeof data.metadata.totalCounters === 'number' &&
      typeof data.metadata.totalSessions === 'number' &&
      typeof data.metadata.totalCounts === 'number'
    );
  },

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      secureLogger.error('Error clearing storage', error, 'Storage');
      throw error;
    }
  },
};

export default storage; 