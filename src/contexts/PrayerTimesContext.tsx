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
import { fetchMonthlyPrayerTimes, fetchTodaysPrayerTimes, clearPrayerTimesCache, isSampleDataMode } from '../utils/aladhanApi';
import { getLocation, requestLocationPermission } from '../utils/locationService';
import { scheduleAllPrayerNotifications, cancelAllPrayerNotifications, initializeTodaysNotifications } from '../utils/prayerNotifications';
import { playAdhan, stopAdhan, previewAudio } from '../utils/audioService';
import { adjustTime } from '../utils/helpers';
import { getDefaultDemoDate, getSamplePrayerTimes, isDateInSampleRange } from '../utils/sampleDataHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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
  timeFormat: '24h',
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

interface MonthCache {
  [monthKey: string]: { // Format: "YYYY-MM"
    data: DayPrayerTimes[];
    isCurrent: boolean; // Only current month is permanently cached
    fetchedAt: number;
  };
}

interface EnhancedPrayerTimesState extends PrayerTimesState {
  monthCache: MonthCache;
  currentDate: string; // Currently selected date
  initialDate: string; // The initial demo/today date
  navigatingDate: string | null; // Date being navigated to (for loading states)
}

const initialState: EnhancedPrayerTimesState = {
  cache: {},
  monthCache: {},
  currentDate: '',
  initialDate: '',
  navigatingDate: null,
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  availableAudios: DEFAULT_ADHAN_AUDIOS,
  availableCities: POPULAR_CITIES,
  availableMethods: CALCULATION_METHODS,
  isOnline: true,
};

type EnhancedPrayerTimesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_TIMES'; payload: DayPrayerTimes | undefined }
  | { type: 'UPDATE_CACHE'; payload: { date: string; times: DayPrayerTimes } }
  | { type: 'UPDATE_MONTH_CACHE'; payload: { monthKey: string; data: DayPrayerTimes[]; isCurrent: boolean } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'CLEAR_NON_CURRENT_MONTH_CACHE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<PrayerSettings> }
  | { type: 'SET_NEXT_PRAYER'; payload: { name: PrayerName; time: string; timeUntil: string } | undefined }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_CURRENT_DATE'; payload: string }
  | { type: 'SET_INITIAL_DATE'; payload: string }
  | { type: 'SET_NAVIGATING_DATE'; payload: string | null };

function enhancedPrayerTimesReducer(state: EnhancedPrayerTimesState, action: EnhancedPrayerTimesAction): EnhancedPrayerTimesState {
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
    case 'UPDATE_MONTH_CACHE':
      return {
        ...state,
        monthCache: {
          ...state.monthCache,
          [action.payload.monthKey]: {
            data: action.payload.data,
            isCurrent: action.payload.isCurrent,
            fetchedAt: Date.now()
          }
        }
      };
    case 'CLEAR_CACHE':
      return { ...state, cache: {}, monthCache: {} };
    case 'CLEAR_NON_CURRENT_MONTH_CACHE':
      const filteredCache: MonthCache = {};
      Object.entries(state.monthCache).forEach(([key, value]) => {
        if (value.isCurrent) {
          filteredCache[key] = value;
        }
      });
      return { ...state, monthCache: filteredCache };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_NEXT_PRAYER':
      return { ...state, nextPrayer: action.payload };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_INITIAL_DATE':
      return { ...state, initialDate: action.payload };
    case 'SET_NAVIGATING_DATE':
      return { ...state, navigatingDate: action.payload };
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
  const [state, dispatch] = useReducer(enhancedPrayerTimesReducer, initialState);

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

  // Helper to get month key from date
  const getMonthKey = (date: string): string => {
    const [year, month] = date.split('-');
    return `${year}-${month}`;
  };

  // Helper to check if month is current month
  const isCurrentMonth = (monthKey: string): boolean => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // In sample data mode, treat the demo month as current
    if (isSampleDataMode()) {
      const demoDate = getDefaultDemoDate();
      const [year, month] = demoDate.split('-');
      const demoMonthKey = `${year}-${month}`;
      return monthKey === demoMonthKey;
    }
    
    return monthKey === currentMonthKey;
  };

  // Enhanced function to fetch month data with smart caching
  const fetchMonthData = async (date: string, forceRefresh: boolean = false): Promise<DayPrayerTimes[]> => {
    const monthKey = getMonthKey(date);
    const isCurrent = isCurrentMonth(monthKey);
    
    // Check month cache first
    if (!forceRefresh && state.monthCache[monthKey]) {
      console.log(`Using cached month data for ${monthKey}`);
      return state.monthCache[monthKey].data;
    }

    console.log(`Fetching month data for ${monthKey}${isCurrent ? ' (current month)' : ''}`);
    
    const [year, month] = date.split('-');
    const location = getCurrentLocation();
    const method = state.settings.calculationMethod;

    try {
      let monthData: DayPrayerTimes[];

             if (isSampleDataMode()) {
         // For sample data, only support June 2025
         if (year !== '2025' || month !== '06') {
           throw new Error(`Sample data only available for June 2025, requested: ${year}-${month}`);
         }
         
         // Generate data for all days in June (1-30)
         const availableDates = Array.from({ length: 30 }, (_, i) => {
           const day = i + 1;
           return `${year}-${month}-${day.toString().padStart(2, '0')}`;
         });

         monthData = availableDates.map(dateStr => {
           const sampleData = getSamplePrayerTimes(dateStr);
           if (sampleData) {
             return sampleData;
           }
           // This should not happen for June 2025, but fallback just in case
           throw new Error(`Failed to generate sample data for ${dateStr}`);
         });
             } else {
         // Production: check connectivity and fetch from API
         const netInfo = await NetInfo.fetch();
         if (!netInfo.isConnected) {
           throw new Error('No internet connection available. Please check your network and try again.');
         }
         monthData = await fetchMonthlyPrayerTimes(location, method, parseInt(year), parseInt(month));
       }

      // Apply current settings to all prayer times
      const processedMonthData = monthData.map(dayTimes => ({
        ...dayTimes,
        prayers: dayTimes.prayers.map(prayer => {
          const adjustmentValue = state.settings.timeAdjustments[prayer.name] || 0;
          return {
            ...prayer,
            adjustment: adjustmentValue,
            notificationEnabled: state.settings.notifications[prayer.name],
            time: adjustmentValue !== 0 
              ? adjustTime(prayer.originalTime, adjustmentValue)
              : prayer.originalTime,
          };
        })
      }));

      // Cache the month data
      dispatch({
        type: 'UPDATE_MONTH_CACHE',
        payload: {
          monthKey,
          data: processedMonthData,
          isCurrent
        }
      });

      // Clean up non-current month cache periodically
      if (!isCurrent) {
        setTimeout(() => {
          dispatch({ type: 'CLEAR_NON_CURRENT_MONTH_CACHE' });
        }, 30000); // Clean up after 30 seconds
      }

      return processedMonthData;
    } catch (error) {
      console.error(`Failed to fetch month data for ${monthKey}:`, error);
      throw error;
    }
  };

  // Enhanced prayer times fetching with smart caching
  const fetchPrayerTimes = useCallback(async (date?: string, forceRefresh?: boolean) => {
    try {
      const targetDate = date || state.initialDate || getDefaultDemoDate();
      
      if (!targetDate) {
        throw new Error('No target date available');
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_NAVIGATING_DATE', payload: targetDate });

      console.log(`Fetching prayer times for ${targetDate}`);

      // Check individual date cache first
      if (!forceRefresh && state.cache[targetDate]) {
        console.log(`Using cached prayer times for ${targetDate}`);
        dispatch({ type: 'SET_CURRENT_TIMES', payload: state.cache[targetDate] });
        dispatch({ type: 'SET_CURRENT_DATE', payload: targetDate });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_NAVIGATING_DATE', payload: null });
        return;
      }

      // Try to get data from month cache first
      const monthKey = getMonthKey(targetDate);
      let monthData: DayPrayerTimes[];

             try {
         monthData = await fetchMonthData(targetDate, forceRefresh);
       } catch (monthError) {
         console.error('Month data fetch failed:', monthError);
         
         // Show appropriate error based on mode
         if (isSampleDataMode()) {
           const errorMessage = `Sample data is not available for this date. Please navigate to dates within the available sample data range.`;
           dispatch({ type: 'SET_ERROR', payload: errorMessage });
           dispatch({ type: 'SET_LOADING', payload: false });
           dispatch({ type: 'SET_NAVIGATING_DATE', payload: null });
           return;
         } else {
           // Check if it's a network error
           const errorString = monthError instanceof Error ? monthError.message : String(monthError);
           if (errorString.includes('network') || errorString.includes('internet') || errorString.includes('connection') || errorString.includes('fetch')) {
             dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
           }
           throw monthError; // Re-throw for production mode
         }
       }

      // Find the specific date in month data
      const dayPrayerTimes = monthData.find(day => day.date === targetDate);

      if (dayPrayerTimes) {
        // Cache individual day
        dispatch({ type: 'UPDATE_CACHE', payload: { date: targetDate, times: dayPrayerTimes } });
        dispatch({ type: 'SET_CURRENT_TIMES', payload: dayPrayerTimes });
        dispatch({ type: 'SET_CURRENT_DATE', payload: targetDate });

        // Schedule notifications only for today's prayers (in real world)
        if (!isSampleDataMode()) {
          const today = new Date().toISOString().split('T')[0];
          if (targetDate === today) {
            await scheduleAllPrayerNotifications(dayPrayerTimes, state.settings);
          }
        }
      } else {
        throw new Error(`Prayer times not found for ${targetDate}`);
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_NAVIGATING_DATE', payload: null });

    } catch (error) {
      console.error('Error fetching prayer times:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Only show persistent error if we don't have any current times
      if (!state.currentTimes) {
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } else {
        // Show temporary error for navigation failures
        dispatch({ type: 'SET_ERROR', payload: `Navigation failed: ${errorMessage}` });
        setTimeout(() => {
          dispatch({ type: 'SET_ERROR', payload: null });
        }, 3000);
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_NAVIGATING_DATE', payload: null });
    }
  }, [state.settings.calculationMethod, state.settings.timeAdjustments, state.settings.notifications, state.settings.location, state.cache, state.monthCache, state.initialDate]);

  // Enhanced navigation with validation and alerts
  const navigateToDate = async (targetDate: string): Promise<boolean> => {
    // Validation for sample data mode
    if (isSampleDataMode()) {
      const [year, month, day] = targetDate.split('-');
      
      // Check year
      if (year !== '2025') {
        // Import Alert dynamically to avoid import issues
        const { Alert } = await import('react-native');
        Alert.alert(
          'Demo Limitation',
          'Sample data is only available for 2025. Please navigate within this year for the demo.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      // Check month and day boundaries for June
      if (month === '06') {
        const dayNum = parseInt(day);
        if (dayNum < 1) {
          const { Alert } = await import('react-native');
          Alert.alert(
            'Beginning of Sample Data',
            'This is the earliest date available in the sample data. In production, the app would fetch previous month\'s data automatically.',
            [{ text: 'OK' }]
          );
          return false;
        }
        if (dayNum > 30) {
          const { Alert } = await import('react-native');
          Alert.alert(
            'No Next Month Data',
            'Next month\'s prayer times are not available in sample data mode. In production, the app would automatically fetch July\'s data from the server.',
            [
              { text: 'OK' },
              { 
                text: 'Learn More', 
                onPress: () => {
                  setTimeout(() => {
                    Alert.alert(
                      'Production Features',
                      'In the production version:\n\n• Automatic month fetching\n• Offline support for current month\n• Real-time data updates\n• Global location support',
                      [{ text: 'Got it' }]
                    );
                  }, 500);
                }
              }
            ]
          );
          return false;
        }
      } else {
        // Not June 2025
        const { Alert } = await import('react-native');
        const monthName = month === '05' ? 'May' : month === '07' ? 'July' : 'this month';
        Alert.alert(
          'Month Not Available',
          `${monthName} data is not available in sample mode. Only June 2025 prayer times are included for demonstration purposes.`,
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      // Production mode validation
      const targetDateObj = new Date(targetDate);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (targetDateObj < oneYearAgo || targetDateObj > oneYearLater) {
        const { Alert } = await import('react-native');
        Alert.alert(
          'Date Range Exceeded',
          'Prayer times are only available for dates within 1 year from today. Please select a date within this range.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      // Check internet connectivity for production mode
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        const { Alert } = await import('react-native');
        Alert.alert(
          'No Internet Connection',
          'Internet connection is required to fetch prayer times for new dates. Please check your connection and try again.',
          [
            { text: 'OK' },
            { 
              text: 'Check Connection', 
              onPress: async () => {
                const retryNetInfo = await NetInfo.fetch();
                if (retryNetInfo.isConnected) {
                  navigateToDate(targetDate);
                } else {
                  Alert.alert('Still Offline', 'Please enable internet connection and try again.', [{ text: 'OK' }]);
                }
              }
            }
          ]
        );
        return false;
      }
    }

    try {
      await fetchPrayerTimes(targetDate, false);
      return true;
    } catch (error) {
      console.error('Navigation failed:', error);
      
      // Show alert for fetch failures
      const { Alert } = await import('react-native');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('network') || errorMessage.includes('internet') || errorMessage.includes('connection')) {
        Alert.alert(
          'No Internet Connection',
          'Unable to fetch prayer times. Please check your internet connection and try again. You can still navigate within the current month using cached data.',
          [
            { text: 'OK' },
            { text: 'Retry', onPress: () => navigateToDate(targetDate) }
          ]
        );
      } else if (errorMessage.includes('Sample data not available')) {
        Alert.alert(
          'Data Not Available',
          'This date is outside the available sample data range. In production, the app would fetch this data from the server.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Navigation Failed',
          `Unable to load prayer times: ${errorMessage}`,
          [
            { text: 'OK' },
            { text: 'Retry', onPress: () => navigateToDate(targetDate) }
          ]
        );
      }
      
      return false;
    }
  };

  // Get initial date based on mode
  const getInitialDate = (): string => {
    if (isSampleDataMode()) {
      // Use actual current date but map to June 2025 for sample data
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; // 0-based, so add 1
      
      // Map current date to June 2025 for demo
      // If current month is June, use actual day; otherwise use day 1-30 cycle
      let demoDay: number;
      if (currentMonth === 6) {
        // We're in June, use actual day
        demoDay = Math.min(currentDay, 30); // Cap at 30 since our sample data goes to June 30
      } else {
        // Not June, use day within 1-30 range based on current day
        demoDay = ((currentDay - 1) % 30) + 1;
      }
      
      return `2025-06-${demoDay.toString().padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  // Enhanced next prayer calculation
  const getNextPrayer = () => {
    if (!state.currentTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Only show next prayer for today's date (when currentDate matches today's mapped date)
    const todayMappedDate = getInitialDate();
    if (state.currentDate !== todayMappedDate) {
      return null; // Don't show next prayer for past/future dates
    }
    
    for (const prayer of state.currentTimes.prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
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
    
    // If no more prayers today, get first prayer of next day
    if (state.currentTimes.prayers.length > 0) {
      const firstPrayer = state.currentTimes.prayers[0];
      return {
        name: firstPrayer.name,
        time: firstPrayer.time,
        timeUntil: 'Tomorrow',
      };
    }
    
    return null;
  };

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
            p.name === prayer ? { 
              ...p, 
              adjustment: minutes,
              time: minutes !== 0 ? adjustTime(p.originalTime, minutes) : p.originalTime
            } : p
          )
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: updatedTimes });
        
        // Update cache
        dispatch({ type: 'UPDATE_CACHE', payload: { date: state.currentDate, times: updatedTimes } });
        
        // Reschedule notifications with new times
        await scheduleAllPrayerNotifications(updatedTimes, { ...state.settings, timeAdjustments: newAdjustments });
      }
    } catch (error) {
      console.error('Error updating prayer adjustment:', error);
    }
  };

  const applyAllAdjustments = async (minutes: number) => {
    try {
      if (minutes < -30 || minutes > 30) {
        throw new Error('Prayer time adjustment must be between -30 and +30 minutes');
      }

      const newAdjustments = {
        fajr: minutes,
        dhuhr: minutes,
        asr: minutes,
        maghrib: minutes,
        isha: minutes,
      };
      
      dispatch({ type: 'UPDATE_SETTINGS', payload: { timeAdjustments: newAdjustments } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, timeAdjustments: newAdjustments }));
      
      // Update current times with new adjustments
      if (state.currentTimes) {
        const updatedTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => ({
            ...p,
            adjustment: minutes,
            time: minutes !== 0 ? adjustTime(p.originalTime, minutes) : p.originalTime
          }))
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: updatedTimes });
        
        // Update cache
        dispatch({ type: 'UPDATE_CACHE', payload: { date: state.currentDate, times: updatedTimes } });
        
        // Reschedule notifications with new times
        await scheduleAllPrayerNotifications(updatedTimes, { ...state.settings, timeAdjustments: newAdjustments });
      }
    } catch (error) {
      console.error('Error applying adjustments to all prayers:', error);
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
        
        // Update cache
        dispatch({ type: 'UPDATE_CACHE', payload: { date: state.currentDate, times: updatedTimes } });
        
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
        locationUpdate = {
          location: {
            ...state.settings.location,
            type: 'manual',
            selectedCity: city,
          },
        };
      } else {
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
      await fetchPrayerTimes(state.currentDate, true);
      
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
      await fetchPrayerTimes(state.currentDate, true);
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
      const newSettings = { ...state.settings, ...updates };
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify(newSettings));
      
      // Update current times if notification settings changed
      if (updates.notifications && state.currentTimes) {
        const updatedTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => ({
            ...p,
            notificationEnabled: updates.notifications![p.name] !== undefined ? 
              updates.notifications![p.name] : 
              state.settings.notifications[p.name]
          }))
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: updatedTimes });
        dispatch({ type: 'UPDATE_CACHE', payload: { date: state.currentDate, times: updatedTimes } });
      }
      
      // Reschedule notifications if notification or time adjustment settings changed
      if ((updates.notifications || updates.timeAdjustments) && state.currentTimes) {
        await scheduleAllPrayerNotifications(state.currentTimes, newSettings);
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
      
      const nextMonthDate = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}-01`;
      await fetchMonthData(nextMonthDate, false);
    } catch (error) {
      console.error('Error preloading next month:', error);
    }
  };

  const getCurrentPrayer = (): PrayerName | null => {
    if (!state.currentTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let lastPrayer: PrayerName | null = null;
    
    for (const prayer of state.currentTimes.prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
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
    const prayerTime = hours * 60 + minutes;
    
    let timeUntil = prayerTime - currentTime;
    
    if (timeUntil <= 0) {
      timeUntil += 24 * 60;
    }
    
    const hoursUntil = Math.floor(timeUntil / 60);
    const minutesUntil = timeUntil % 60;
    
    return `${hoursUntil}h ${minutesUntil}m`;
  };

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set initial date
        const initialDate = getInitialDate();
        dispatch({ type: 'SET_INITIAL_DATE', payload: initialDate });
        dispatch({ type: 'SET_CURRENT_DATE', payload: initialDate });

        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        dispatch({ type: 'SET_ONLINE_STATUS', payload: netInfo.isConnected ?? false });

        // Set up network monitoring
        const unsubscribe = NetInfo.addEventListener(state => {
          dispatch({ type: 'SET_ONLINE_STATUS', payload: state.isConnected ?? false });
        });

        // Load settings
        const savedSettings = await AsyncStorage.getItem('prayerSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          dispatch({ type: 'UPDATE_SETTINGS', payload: parsed });
        }

        // Initialize notifications
        setTimeout(async () => {
          try {
            await initializeTodaysNotifications();
          } catch (error) {
            console.error('Error initializing notifications:', error);
          }
        }, 1000);

        // Load initial prayer times
        setTimeout(() => {
          fetchPrayerTimes(initialDate);
        }, 500);

        // Cleanup network listener
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  // Update next prayer every minute
  useEffect(() => {
    const updateNextPrayer = () => {
      const nextPrayer = getNextPrayer();
      dispatch({ type: 'SET_NEXT_PRAYER', payload: nextPrayer || undefined });
    };

    updateNextPrayer(); // Initial update
    const interval = setInterval(updateNextPrayer, 60000);

    return () => clearInterval(interval);
  }, [state.currentTimes, state.currentDate]);

  const value: PrayerTimesContextType = {
    ...state,
    currentDate: state.currentDate,
    fetchPrayerTimes,
    updatePrayerAdjustment,
    applyAllAdjustments,
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
    navigateToDate,
    getInitialDate,
  };

  return (
    <PrayerTimesContext.Provider value={value}>
      {children}
    </PrayerTimesContext.Provider>
  );
}; 