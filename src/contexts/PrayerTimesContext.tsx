import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { 
  PrayerTimesState, 
  PrayerTimesContextType, 
  PrayerSettings, 
  DayPrayerTimes, 
  CalculationMethod, 
  City, 
  AdhanAudio, 
  PrayerName,
  CALCULATION_METHODS,
  DEFAULT_ADHAN_AUDIOS,
  POPULAR_CITIES
} from '../types';
import { fetchMonthlyPrayerTimes, fetchTodaysPrayerTimes, clearPrayerTimesCache } from '../utils/aladhanApi';
import { getLocation, requestLocationPermission } from '../utils/locationService';
import { scheduleAllPrayerNotifications, cancelAllPrayerNotifications } from '../utils/prayerNotifications';
import { playAdhan, stopAdhan, previewAudio } from '../utils/audioService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default location (London for sample data)
const DEFAULT_LOCATION = {
  latitude: 51.5074,
  longitude: -0.1278,
  city: 'London',
  country: 'UK'
};

const DEFAULT_SETTINGS: PrayerSettings = {
  calculationMethod: CALCULATION_METHODS[2], // Muslim World League
  selectedAudio: DEFAULT_ADHAN_AUDIOS[0],
  enableAdhan: true,
  enableVibration: true,
  snoozeEnabled: true,
  snoozeDuration: 5,
  maxSnoozes: 3,
  fadeInDuration: 5,
  fadeOutDuration: 3,
  volume: 0.8,
  location: {
    type: 'manual',
    selectedCity: POPULAR_CITIES.find(city => city.id === 'london'),
    lastKnownLocation: DEFAULT_LOCATION,
  },
  timeAdjustments: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  notifications: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
};

const initialState: PrayerTimesState = {
  cache: {},
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  availableAudios: DEFAULT_ADHAN_AUDIOS,
  availableCities: POPULAR_CITIES,
  availableMethods: CALCULATION_METHODS,
  isOnline: true,
};

type PrayerTimesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_TIMES'; payload: DayPrayerTimes | undefined }
  | { type: 'UPDATE_CACHE'; payload: { date: string; times: DayPrayerTimes } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<PrayerSettings> }
  | { type: 'SET_NEXT_PRAYER'; payload: { name: PrayerName; time: string; timeUntil: string } | undefined }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean };

function prayerTimesReducer(state: PrayerTimesState, action: PrayerTimesAction): PrayerTimesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CURRENT_TIMES':
      return { ...state, currentTimes: action.payload };
    case 'UPDATE_CACHE':
      return {
        ...state,
        cache: { ...state.cache, [action.payload.date]: action.payload.times }
      };
    case 'CLEAR_CACHE':
      return { ...state, cache: {} };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_NEXT_PRAYER':
      return { ...state, nextPrayer: action.payload };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    default:
      return state;
  }
}

const PrayerTimesContext = createContext<PrayerTimesContextType | undefined>(undefined);

export const usePrayerTimes = () => {
  const context = useContext(PrayerTimesContext);
  if (!context) {
    throw new Error('usePrayerTimes must be used within a PrayerTimesProvider');
  }
  return context;
};

export const PrayerTimesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(prayerTimesReducer, initialState);

  // Helper function to get current location for API calls
  const getCurrentLocation = () => {
    if (state.settings.location.type === 'auto' && state.settings.location.lastKnownLocation) {
      return state.settings.location.lastKnownLocation;
    } else if (state.settings.location.selectedCity) {
      return {
        latitude: state.settings.location.selectedCity.latitude,
        longitude: state.settings.location.selectedCity.longitude,
        city: state.settings.location.selectedCity.name,
        country: state.settings.location.selectedCity.country,
      };
    }
    return DEFAULT_LOCATION;
  };

  const fetchPrayerTimes = useCallback(async (date?: string, forceRefresh?: boolean) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        // Access cache directly from current state
        const cachedTimes = state.cache[targetDate];
        if (cachedTimes) {
          dispatch({ type: 'SET_CURRENT_TIMES', payload: cachedTimes });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      }

      const location = getCurrentLocation();
      const method = state.settings.calculationMethod;

      let prayerTimes: DayPrayerTimes | null;

      if (date) {
        // Fetch specific date from monthly data
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        
        const monthlyData = await fetchMonthlyPrayerTimes(location, method, year, month);
        prayerTimes = monthlyData.find(day => day.date === targetDate) || null;
      } else {
        // Fetch today's prayer times
        prayerTimes = await fetchTodaysPrayerTimes(location, method);
      }

      if (prayerTimes) {
        // Apply current settings to the prayer times
        prayerTimes.prayers = prayerTimes.prayers.map(prayer => ({
          ...prayer,
          adjustment: state.settings.timeAdjustments[prayer.name],
          notificationEnabled: state.settings.notifications[prayer.name],
        }));

        dispatch({ type: 'UPDATE_CACHE', payload: { date: targetDate, times: prayerTimes } });
        dispatch({ type: 'SET_CURRENT_TIMES', payload: prayerTimes });
        
        // Schedule notifications
        await scheduleAllPrayerNotifications(prayerTimes, state.settings);
      } else {
        throw new Error('No prayer times found for the specified date');
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.settings.calculationMethod, state.settings.timeAdjustments, state.settings.notifications, state.settings.location]);

  const updatePrayerAdjustment = async (prayer: PrayerName, minutes: number) => {
    try {
      if (minutes < -30 || minutes > 30) {
        throw new Error('Prayer time adjustment must be between -30 and +30 minutes');
      }

      const newAdjustments = {
        ...state.settings.timeAdjustments,
        [prayer]: minutes,
      };
      
      dispatch({ type: 'UPDATE_SETTINGS', payload: { timeAdjustments: newAdjustments } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, timeAdjustments: newAdjustments }));
      
      // Update current times with new adjustment
      if (state.currentTimes) {
        const updatedTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => 
            p.name === prayer ? { ...p, adjustment: minutes } : p
          )
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: updatedTimes });
        
        // Reschedule notifications with new times
        await scheduleAllPrayerNotifications(updatedTimes, { ...state.settings, timeAdjustments: newAdjustments });
      }
    } catch (error) {
      console.error('Error updating prayer adjustment:', error);
    }
  };

  const togglePrayerNotification = async (prayer: PrayerName) => {
    try {
      const newNotifications = {
        ...state.settings.notifications,
        [prayer]: !state.settings.notifications[prayer],
      };
      
      dispatch({ type: 'UPDATE_SETTINGS', payload: { notifications: newNotifications } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, notifications: newNotifications }));
      
      // Update current times with new notification setting
      if (state.currentTimes) {
        const updatedTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => 
            p.name === prayer ? { ...p, notificationEnabled: newNotifications[prayer] } : p
          )
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: updatedTimes });
        
        // Reschedule notifications
        await scheduleAllPrayerNotifications(updatedTimes, { ...state.settings, notifications: newNotifications });
      }
    } catch (error) {
      console.error('Error toggling prayer notification:', error);
    }
  };

  const updateLocation = async (city?: City) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      let locationUpdate: Partial<PrayerSettings> = {};
      
      if (city) {
        // Manual city selection
        locationUpdate = {
          location: {
            ...state.settings.location,
            type: 'manual',
            selectedCity: city,
          },
        };
      } else {
        // Auto location
        const location = await getLocation();
        locationUpdate = {
          location: {
            ...state.settings.location,
            type: 'auto',
            lastKnownLocation: location,
          },
        };
      }
      
      dispatch({ type: 'UPDATE_SETTINGS', payload: locationUpdate });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...locationUpdate }));
      
      // Clear cache and refetch with new location
      dispatch({ type: 'CLEAR_CACHE' });
      await clearPrayerTimesCache();
      await fetchPrayerTimes(undefined, true);
      
    } catch (error) {
      console.error('Error updating location:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update location' });
    }
  };

  const enableAutoLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        await updateLocation();
      } else {
        throw new Error('Location permission denied');
      }
    } catch (error) {
      console.error('Error enabling auto location:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Location permission required' });
    }
  };

  const updateCalculationMethod = async (method: CalculationMethod) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { calculationMethod: method } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, calculationMethod: method }));
      
      // Clear cache and refetch with new method
      dispatch({ type: 'CLEAR_CACHE' });
      await clearPrayerTimesCache();
      await fetchPrayerTimes(undefined, true);
    } catch (error) {
      console.error('Error updating calculation method:', error);
    }
  };

  const updateAdhanAudio = async (audio: AdhanAudio) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { selectedAudio: audio } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, selectedAudio: audio }));
    } catch (error) {
      console.error('Error updating adhan audio:', error);
    }
  };

  const updatePrayerSettings = async (updates: Partial<PrayerSettings>) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...updates }));
      
      // Reschedule notifications if notification settings changed
      if ((updates.notifications || updates.timeAdjustments) && state.currentTimes) {
        await scheduleAllPrayerNotifications(state.currentTimes, { ...state.settings, ...updates });
      }
    } catch (error) {
      console.error('Error updating prayer settings:', error);
    }
  };

  const scheduleAllNotifications = async () => {
    try {
      if (state.currentTimes) {
        await scheduleAllPrayerNotifications(state.currentTimes, state.settings);
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await cancelAllPrayerNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const snoozeNotification = async (prayer: PrayerName) => {
    // Implementation for snoozing would go here
    console.log(`Snoozing ${prayer} notification for ${state.settings.snoozeDuration} minutes`);
  };

  const clearCache = async () => {
    try {
      dispatch({ type: 'CLEAR_CACHE' });
      await clearPrayerTimesCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const preloadNextMonth = async () => {
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const location = getCurrentLocation();
      const method = state.settings.calculationMethod;
      
      await fetchMonthlyPrayerTimes(
        location, 
        method, 
        nextMonth.getFullYear(), 
        nextMonth.getMonth() + 1
      );
    } catch (error) {
      console.error('Error preloading next month:', error);
    }
  };

  const getNextPrayer = () => {
    if (!state.currentTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const prayer of state.currentTimes.prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes + prayer.adjustment;
      
      if (prayerTime > currentTime) {
        const timeUntil = prayerTime - currentTime;
        const hoursUntil = Math.floor(timeUntil / 60);
        const minutesUntil = timeUntil % 60;
        
        return {
          name: prayer.name,
          time: prayer.time,
          timeUntil: `${hoursUntil}h ${minutesUntil}m`,
        };
      }
    }
    
    return null;
  };

  const getCurrentPrayer = (): PrayerName | null => {
    if (!state.currentTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let lastPrayer: PrayerName | null = null;
    
    for (const prayer of state.currentTimes.prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes + prayer.adjustment;
      
      if (prayerTime <= currentTime) {
        lastPrayer = prayer.name;
      } else {
        break;
      }
    }
    
    return lastPrayer;
  };

  const getTimeUntilPrayer = (prayer: PrayerName): string => {
    if (!state.currentTimes) return '';
    
    const prayerData = state.currentTimes.prayers.find(p => p.name === prayer);
    if (!prayerData) return '';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = prayerData.time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes + prayerData.adjustment;
    
    let timeUntil = prayerTime - currentTime;
    
    // If prayer time has passed, calculate time until tomorrow
    if (timeUntil <= 0) {
      timeUntil += 24 * 60; // Add 24 hours
    }
    
    const hoursUntil = Math.floor(timeUntil / 60);
    const minutesUntil = timeUntil % 60;
    
    return `${hoursUntil}h ${minutesUntil}m`;
  };

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('prayerSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          dispatch({ type: 'UPDATE_SETTINGS', payload: parsed });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Note: Initial prayer times are fetched from the component when needed
  // No automatic fetching here to avoid infinite loops

  // Update next prayer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const nextPrayer = getNextPrayer();
      dispatch({ type: 'SET_NEXT_PRAYER', payload: nextPrayer || undefined });
    }, 60000);

    return () => clearInterval(interval);
  }, [state.currentTimes]);

  const value: PrayerTimesContextType = {
    ...state,
    fetchPrayerTimes,
    updatePrayerAdjustment,
    togglePrayerNotification,
    updateLocation,
    enableAutoLocation,
    updateCalculationMethod,
    updateAdhanAudio,
    updatePrayerSettings,
    playAdhan,
    stopAdhan,
    previewAudio,
    scheduleAllNotifications,
    cancelAllNotifications,
    snoozeNotification,
    clearCache,
    preloadNextMonth,
    getNextPrayer,
    getCurrentPrayer,
    getTimeUntilPrayer,
  };

  return (
    <PrayerTimesContext.Provider value={value}>
      {children}
    </PrayerTimesContext.Provider>
  );
}; 