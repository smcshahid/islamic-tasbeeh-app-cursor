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
import { fetchMonthlyPrayerTimes, fetchTodaysPrayerTimes, clearPrayerTimesCache, isSampleDataMode, clearAllProductionCache } from '../utils/aladhanApi';
import { getLocation, requestLocationPermission, getLocationWithFallback, getLocationDisplayName } from '../utils/locationService';
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
    type: 'auto', // Default to auto location detection
    selectedCity: POPULAR_CITIES.find(city => city.id === 'london'), // Fallback city
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
  lastLocationCheck: number; // Timestamp of last location check
}

const initialState: EnhancedPrayerTimesState = {
  cache: {},
  monthCache: {},
  currentDate: '',
  initialDate: '',
  navigatingDate: null,
  lastLocationCheck: 0,
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
  | { type: 'SET_NAVIGATING_DATE'; payload: string | null }
  | { type: 'SET_LAST_LOCATION_CHECK'; payload: number };

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
    case 'SET_LAST_LOCATION_CHECK':
      return { ...state, lastLocationCheck: action.payload };
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
    console.log('[Location] Current location settings:', {
      type: state.settings.location.type,
      hasLastKnownLocation: !!state.settings.location.lastKnownLocation,
      hasSelectedCity: !!state.settings.location.selectedCity,
      lastKnownLocation: state.settings.location.lastKnownLocation,
      selectedCity: state.settings.location.selectedCity?.name
    });

    // Priority 1: Auto-detected location when enabled
    if (state.settings.location.type === 'auto' && state.settings.location.lastKnownLocation) {
      console.log('[Location] Using auto-detected location:', state.settings.location.lastKnownLocation);
      return state.settings.location.lastKnownLocation;
    }
    
    // Priority 2: Manually selected city
    if (state.settings.location.selectedCity) {
      console.log('[Location] Using manually selected city:', state.settings.location.selectedCity);
      return {
        latitude: state.settings.location.selectedCity.latitude,
        longitude: state.settings.location.selectedCity.longitude,
        city: state.settings.location.selectedCity.name,
        country: state.settings.location.selectedCity.country,
      };
    }
    
    // Priority 3: Default fallback location
    console.log('[Location] Using default fallback location:', DEFAULT_LOCATION);
    return DEFAULT_LOCATION;
  };

  // Helper to get month key from date (DD-MM-YYYY format)
  const getMonthKey = (date: string): string => {
    const [day, month, year] = date.split('-');
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

  // Check and update location if auto detection is enabled
  const checkAndUpdateLocation = async (force: boolean = false): Promise<any> => {
    // Only run auto detection if it's enabled
    if (state.settings.location.type !== 'auto') {
      console.log('[Location] Auto location not enabled, skipping detection');
      return null;
    }

    // Throttle location checks - only run every 5 minutes (unless forced)
    const now = Date.now();
    if (!force) {
      const timeSinceLastCheck = now - state.lastLocationCheck;
      const minimumInterval = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastCheck < minimumInterval) {
        console.log(`[Location] Location checked recently (${Math.round(timeSinceLastCheck / 1000)}s ago), skipping`);
        return null;
      }
    }

    try {
      console.log('[Location] Running auto location detection...');
      dispatch({ type: 'SET_LAST_LOCATION_CHECK', payload: now });
      
      const result = await getLocationWithFallback();
      
      if (result.location && !result.requiresManualSelection) {
        const newLocation = result.location;
        const currentLocation = state.settings.location.lastKnownLocation;
        
        // Check if location has changed significantly (more than ~100 meters)
        const hasLocationChanged = !currentLocation || 
          Math.abs(currentLocation.latitude - newLocation.latitude) > 0.001 || 
          Math.abs(currentLocation.longitude - newLocation.longitude) > 0.001 ||
          currentLocation.city !== newLocation.city;

        if (hasLocationChanged) {
          console.log('[Location] Location changed detected:', {
            old: currentLocation,
            new: newLocation
          });

          const locationUpdate = {
            location: {
              ...state.settings.location,
              lastKnownLocation: newLocation,
            },
          };

          dispatch({ type: 'UPDATE_SETTINGS', payload: locationUpdate });
          await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...locationUpdate }));
          
          // Clear cache since location changed
          dispatch({ type: 'CLEAR_CACHE' });
          await clearPrayerTimesCache();
          console.log('[Location] Location updated and cache cleared');
          console.log(`[Location] Returning updated location: ${newLocation.city}, ${newLocation.country} (${newLocation.latitude}, ${newLocation.longitude})`);
          
          // Return the new location for immediate use
          return newLocation;
        } else {
          console.log('[Location] Location unchanged, using existing data');
          return null;
        }
      } else {
        console.log('[Location] Auto location failed:', result.reason);
        return null;
      }
    } catch (error) {
      console.log('[Location] Auto location detection error:', error);
      // Don't throw error - continue with existing location
      return null;
    }
  };

  // Enhanced function to fetch month data - only cache current month
  const fetchMonthData = async (date: string, forceRefresh: boolean = false, overrideLocation?: any): Promise<DayPrayerTimes[]> => {
    const monthKey = getMonthKey(date);
    const isCurrent = isCurrentMonth(monthKey);
    const currentLocation = overrideLocation || getCurrentLocation();
    
    if (overrideLocation) {
      console.log(`[Location] Using override location: ${overrideLocation.city}, ${overrideLocation.country}`);
    }
    
    // Only check cache for current month and validate location matches
    if (!forceRefresh && isCurrent && state.monthCache[monthKey]) {
      const cachedData = state.monthCache[monthKey].data;
      const cachedLocation = cachedData[0]?.location;
      
      // Check if cached location matches current location settings
      const locationMatches = cachedLocation && 
        Math.abs(cachedLocation.latitude - currentLocation.latitude) < 0.001 && 
        Math.abs(cachedLocation.longitude - currentLocation.longitude) < 0.001;
      
      if (locationMatches) {
        console.log(`Using cached month data for current month ${monthKey} (location matches)`);
        return cachedData;
      } else {
        console.log(`Cache location mismatch for ${monthKey}. Cached: ${cachedLocation?.city}, Current: ${currentLocation.city}. Refetching...`);
      }
    }

    console.log(`Fetching month data for ${monthKey}${isCurrent ? ' (current month)' : ' (non-current month - live fetch)'}`);
    console.log(`[Location] Using location for API call: ${currentLocation.city}, ${currentLocation.country} (${currentLocation.latitude}, ${currentLocation.longitude})`);
    
    const [day, month, year] = date.split('-');
    const location = currentLocation;
    const method = state.settings.calculationMethod;

    try {
      let monthData: DayPrayerTimes[];

             if (isSampleDataMode()) {
         // For sample data, only support June 2025
         if (year !== '2025' || month !== '06') {
           throw new Error(`Sample data only available for June 2025, requested: ${year}-${month}`);
         }
         
         // Generate data for all days in June (1-30) in DD-MM-YYYY format
         const availableDates = Array.from({ length: 30 }, (_, i) => {
           const dayNum = i + 1;
           return `${dayNum.toString().padStart(2, '0')}-${month}-${year}`;
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

      // Apply settings to month data but keep original times in cache
      const currentLocationInfo = overrideLocation || getCurrentLocation();
      const processedMonthData = monthData.map(dayTimes => ({
        ...dayTimes,
        location: {
          ...dayTimes.location,
          city: currentLocationInfo.city || dayTimes.location.city,
          country: currentLocationInfo.country || dayTimes.location.country,
        },
        prayers: dayTimes.prayers.map(prayer => ({
          ...prayer,
          // Store only notification settings, keep original times
          notificationEnabled: state.settings.notifications[prayer.name],
          // Keep original time and adjustment as 0 in cache
          time: prayer.originalTime,
          adjustment: 0,
        }))
      }));

      // Only cache current month data
      if (isCurrent) {
        console.log(`Caching current month data for ${monthKey}`);
        dispatch({
          type: 'UPDATE_MONTH_CACHE',
          payload: {
            monthKey,
            data: processedMonthData,
            isCurrent: true
          }
        });
      } else {
        console.log(`Not caching non-current month data for ${monthKey} - using live data`);
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

      // Auto location detection when accessing prayer times
      const updatedLocation = await checkAndUpdateLocation();

      console.log(`After location check, fetching prayer times for ${targetDate}`);

      // If location was updated, force refresh to avoid using stale cache
      const shouldForceRefresh = forceRefresh || !!updatedLocation;
      if (updatedLocation) {
        console.log('[Location] Location was updated, forcing refresh to avoid stale cache');
      }

      // Get month data first (this ensures we have fresh data with current settings)
      const monthKey = getMonthKey(targetDate);
      let monthData: DayPrayerTimes[];
      
      // Only use month cache, no individual day caching
      // Check if we have month data cached and it's current month
      const shouldUseCachedMonth = !shouldForceRefresh && 
        state.monthCache[monthKey] && 
        isCurrentMonth(monthKey);

      if (shouldUseCachedMonth) {
        console.log(`Using cached month data for ${monthKey} (no location update)`);
        const monthData = state.monthCache[monthKey].data;
        const dayPrayerTimes = monthData.find(day => day.date === targetDate);
        
        if (dayPrayerTimes) {
          // Apply current adjustments for display
          const displayTimes = {
            ...dayPrayerTimes,
            prayers: dayPrayerTimes.prayers.map(prayer => {
              const adjustmentValue = state.settings.timeAdjustments[prayer.name] || 0;
              return {
                ...prayer,
                adjustment: adjustmentValue,
                time: adjustmentValue !== 0 
                  ? adjustTime(prayer.originalTime, adjustmentValue)
                  : prayer.originalTime,
              };
            })
          };
          
          dispatch({ type: 'SET_CURRENT_TIMES', payload: displayTimes });
          dispatch({ type: 'SET_CURRENT_DATE', payload: targetDate });
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_NAVIGATING_DATE', payload: null });
          return;
        }
      }

             try {
         monthData = await fetchMonthData(targetDate, shouldForceRefresh, updatedLocation);
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
        // Apply current adjustments for display (not stored in cache)
        const displayTimes = {
          ...dayPrayerTimes,
          prayers: dayPrayerTimes.prayers.map(prayer => {
            const adjustmentValue = state.settings.timeAdjustments[prayer.name] || 0;
            return {
              ...prayer,
              adjustment: adjustmentValue,
              time: adjustmentValue !== 0 
                ? adjustTime(prayer.originalTime, adjustmentValue)
                : prayer.originalTime,
            };
          })
        };

        // Don't cache individual days - only month data is cached
        // Display data with current adjustments applied
        dispatch({ type: 'SET_CURRENT_TIMES', payload: displayTimes });
        dispatch({ type: 'SET_CURRENT_DATE', payload: targetDate });

        // Schedule notifications only for today's prayers (in real world)
        if (!isSampleDataMode()) {
          const now = new Date();
          const today = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
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
      const [day, month, year] = targetDate.split('-');
      
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
      // Production mode validation - need to convert DD-MM-YYYY to Date object
      const [day, month, year] = targetDate.split('-');
      const targetDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
      
      return `${demoDay.toString().padStart(2, '0')}-06-2025`;
    }
    // Return current date in DD-MM-YYYY format
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
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
      
      // Update settings
      dispatch({ type: 'UPDATE_SETTINGS', payload: { timeAdjustments: newAdjustments } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, timeAdjustments: newAdjustments }));
      
      // Refresh current display with new adjustments (don't modify cache)
      if (state.currentTimes) {
        const displayTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => {
            const adjustmentValue = p.name === prayer ? minutes : (state.settings.timeAdjustments[p.name] || 0);
            return {
              ...p,
              adjustment: adjustmentValue,
              time: adjustmentValue !== 0 ? adjustTime(p.originalTime, adjustmentValue) : p.originalTime,
            };
          })
        };
        
        dispatch({ type: 'SET_CURRENT_TIMES', payload: displayTimes });
        
        // Reschedule notifications with new adjusted times
        await scheduleAllPrayerNotifications(displayTimes, { ...state.settings, timeAdjustments: newAdjustments });
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
      
      // Update settings
      dispatch({ type: 'UPDATE_SETTINGS', payload: { timeAdjustments: newAdjustments } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, timeAdjustments: newAdjustments }));
      
      // Refresh current display with new adjustments (don't modify cache)
      if (state.currentTimes) {
        const displayTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => ({
            ...p,
            adjustment: minutes,
            time: minutes !== 0 ? adjustTime(p.originalTime, minutes) : p.originalTime
          }))
        };
        
        dispatch({ type: 'SET_CURRENT_TIMES', payload: displayTimes });
        
        // Reschedule notifications with new adjusted times
        await scheduleAllPrayerNotifications(displayTimes, { ...state.settings, timeAdjustments: newAdjustments });
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
      
      // Update settings
      dispatch({ type: 'UPDATE_SETTINGS', payload: { notifications: newNotifications } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, notifications: newNotifications }));
      
      // Update current display with new notification setting
      if (state.currentTimes) {
        const displayTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => 
            p.name === prayer ? { ...p, notificationEnabled: newNotifications[prayer] } : p
          )
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: displayTimes });
        
        // Reschedule notifications
        await scheduleAllPrayerNotifications(displayTimes, { ...state.settings, notifications: newNotifications });
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
      dispatch({ type: 'SET_LAST_LOCATION_CHECK', payload: 0 }); // Reset timer for immediate check next time
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...locationUpdate }));
      
      // Clear all caches (including month cache) and refetch with new location
      dispatch({ type: 'CLEAR_CACHE' });
      await clearPrayerTimesCache();
      console.log(`[Location] Location changed to ${city?.name || 'auto-detected'}, clearing all caches`);
      // Force refresh to get new data with updated location
      await fetchPrayerTimes(state.currentDate, true);
      
    } catch (error) {
      console.error('Error updating location:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update location' });
    }
  };

  const enableAutoLocation = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await getLocationWithFallback();
      
      if (result.requiresManualSelection) {
        // Show alert asking user to select location manually
        const { Alert } = await import('react-native');
        Alert.alert(
          'Auto Location Unavailable',
          result.reason || 'Unable to detect your location automatically.',
          [
            { text: 'OK' },
            {
              text: 'Select Manually',
              onPress: () => {
                // This will trigger the city picker modal in the settings
                dispatch({ type: 'SET_ERROR', payload: 'Please select your city manually from the location settings.' });
              }
            }
          ]
        );
        return;
      }

      if (result.location) {
        // Successfully got location, update settings
        const locationUpdate = {
          location: {
            ...state.settings.location,
            type: 'auto' as const,
            lastKnownLocation: {
              latitude: result.location.latitude,
              longitude: result.location.longitude,
              city: result.location.city || 'Unknown City',
              country: result.location.country || 'Unknown Country',
            },
          },
        };
        
        dispatch({ type: 'UPDATE_SETTINGS', payload: locationUpdate });
        dispatch({ type: 'SET_LAST_LOCATION_CHECK', payload: 0 }); // Reset timer for immediate check next time
        await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...locationUpdate }));
        
        // Get location name for logging
        const locationName = getLocationDisplayName(result.location);
        
        // Clear all caches (including month cache) and refetch with new location
        dispatch({ type: 'CLEAR_CACHE' });
        await clearPrayerTimesCache();
        console.log(`[Location] Auto location enabled for ${locationName}, clearing all caches`);
        // Force refresh to get new data with updated location
        await fetchPrayerTimes(state.currentDate, true);

        // Show success message with location details
        const { Alert } = await import('react-native');
        Alert.alert(
          'Location Detected',
          `Successfully detected your location as ${locationName}. Prayer times have been updated for your location.`,
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('Error enabling auto location:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to enable auto location. Please try manual selection.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCalculationMethod = async (method: CalculationMethod) => {
    try {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { calculationMethod: method } });
      await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, calculationMethod: method }));
      
      // Clear all caches and refetch with new method
      dispatch({ type: 'CLEAR_CACHE' });
      await clearPrayerTimesCache();
      console.log(`[Settings] Calculation method changed to ${method.name}, clearing all caches`);
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
      
      // Update current display if notification settings changed
      if (updates.notifications && state.currentTimes) {
        const displayTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => ({
            ...p,
            notificationEnabled: updates.notifications![p.name] !== undefined ? 
              updates.notifications![p.name] : 
              state.settings.notifications[p.name]
          }))
        };
        dispatch({ type: 'SET_CURRENT_TIMES', payload: displayTimes });
      }
      
      // Reschedule notifications if notification or time adjustment settings changed
      if ((updates.notifications || updates.timeAdjustments) && state.currentTimes) {
        // Apply current adjustments for notifications
        const notificationTimes = {
          ...state.currentTimes,
          prayers: state.currentTimes.prayers.map(p => {
            const adjustmentValue = (updates.timeAdjustments || state.settings.timeAdjustments)[p.name] || 0;
            return {
              ...p,
              adjustment: adjustmentValue,
              time: adjustmentValue !== 0 ? adjustTime(p.originalTime, adjustmentValue) : p.originalTime,
              notificationEnabled: (updates.notifications || state.settings.notifications)[p.name]
            };
          })
        };
        await scheduleAllPrayerNotifications(notificationTimes, newSettings);
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

  const resetToProduction = async () => {
    try {
      console.log('[PrayerTimes] Starting production reset...');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // 1. Clear ALL cached data (sample data remnants)
      console.log('[PrayerTimes] Clearing all cached data...');
      await clearAllProductionCache();
      dispatch({ type: 'CLEAR_CACHE' });

      // 2. Reset to current real date in DD-MM-YYYY format
      const now = new Date();
      const realToday = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
      console.log(`[PrayerTimes] Setting real today date: ${realToday}`);
      dispatch({ type: 'SET_CURRENT_DATE', payload: realToday });
      dispatch({ type: 'SET_INITIAL_DATE', payload: realToday });

      // 3. Try to get user's real location intelligently
      console.log('[PrayerTimes] Attempting to get real location...');
      try {
        const result = await getLocationWithFallback();
        
        if (result.location && !result.requiresManualSelection) {
          console.log(`[PrayerTimes] Got location: ${getLocationDisplayName(result.location)}`);
          
          // Update settings with real location
          const locationUpdate = {
            location: {
              ...state.settings.location,
              type: 'auto' as const,
              lastKnownLocation: {
                latitude: result.location.latitude,
                longitude: result.location.longitude,
                city: result.location.city || 'Unknown City',
                country: result.location.country || 'Unknown Country',
              },
            },
          };
          
          dispatch({ type: 'UPDATE_SETTINGS', payload: locationUpdate });
          await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...locationUpdate }));
        } else {
          console.log('[PrayerTimes] Auto location failed, using Vancouver as fallback...');
          console.log('[PrayerTimes] Reason:', result.reason);
          
          // Fallback to Vancouver since user mentioned they're there
          const vancouverLocation = {
            location: {
              ...state.settings.location,
              type: 'manual' as const,
              selectedCity: {
                id: 'vancouver',
                name: 'Vancouver',
                country: 'Canada',
                latitude: 49.2827,
                longitude: -123.1207,
                timezone: 'America/Vancouver',
              },
              lastKnownLocation: {
                latitude: 49.2827,
                longitude: -123.1207,
                city: 'Vancouver',
                country: 'Canada',
              },
            },
          };
          
          dispatch({ type: 'UPDATE_SETTINGS', payload: vancouverLocation });
          await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...vancouverLocation }));
        }
      } catch (locationError) {
        console.log('[PrayerTimes] Location error, using Vancouver fallback:', locationError);
        
        // Ultimate fallback to Vancouver
        const vancouverLocation = {
          location: {
            ...state.settings.location,
            type: 'manual' as const,
            selectedCity: {
              id: 'vancouver',
              name: 'Vancouver',
              country: 'Canada',
              latitude: 49.2827,
              longitude: -123.1207,
              timezone: 'America/Vancouver',
            },
            lastKnownLocation: {
              latitude: 49.2827,
              longitude: -123.1207,
              city: 'Vancouver',
              country: 'Canada',
            },
          },
        };
        
        dispatch({ type: 'UPDATE_SETTINGS', payload: vancouverLocation });
        await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...state.settings, ...vancouverLocation }));
      }

      // 4. Force fetch fresh prayer times with new location and real date
      console.log('[PrayerTimes] Fetching fresh prayer times for real location and date...');
      await fetchPrayerTimes(realToday, true); // Force refresh

      console.log('[PrayerTimes] Production reset completed successfully!');
      
      // Show success message
      setTimeout(() => {
        const { Alert } = require('react-native');
        Alert.alert(
          'Production Mode Active!',
          'Successfully reset to production mode with your real location and current date. You should now see accurate prayer times for your area.',
          [{ text: 'Great!' }]
        );
      }, 1000);

    } catch (error) {
      console.error('[PrayerTimes] Error during production reset:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset to production mode. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const preloadNextMonth = async () => {
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const nextMonthDate = `01-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}-${nextMonth.getFullYear()}`;
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
          
          // Check if auto location is enabled but we're still using default London coordinates
          if (parsed.location?.type === 'auto' && parsed.location?.lastKnownLocation) {
            const lastKnown = parsed.location.lastKnownLocation;
            const isDefaultLondon = Math.abs(lastKnown.latitude - 51.5074) < 0.001 && 
                                  Math.abs(lastKnown.longitude - (-0.1278)) < 0.001;
            
            if (isDefaultLondon) {
              console.log('[Location] Auto location enabled but using default London coords. Will attempt to get real location...');
              // Clear month cache since we'll need to refetch with real location
              dispatch({ type: 'CLEAR_CACHE' });
              await clearPrayerTimesCache();
              
              // Try to get real location in background
              setTimeout(async () => {
                try {
                  const result = await getLocationWithFallback();
                  if (result.location && !result.requiresManualSelection) {
                    console.log('[Location] Got real location on startup:', result.location);
                    const locationUpdate = {
                      location: {
                        ...parsed.location,
                        lastKnownLocation: result.location,
                      },
                    };
                    
                    dispatch({ type: 'UPDATE_SETTINGS', payload: locationUpdate });
                    await AsyncStorage.setItem('prayerSettings', JSON.stringify({ ...parsed, ...locationUpdate }));
                    
                    // Refetch prayer times with real location
                    await fetchPrayerTimes(initialDate, true);
                  }
                } catch (error) {
                  console.log('[Location] Failed to get real location on startup:', error);
                }
              }, 2000); // Give the app time to fully initialize
            }
          }
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
    resetToProduction,
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