import NetInfo from '@react-native-community/netinfo';
import { secureLogger } from './secureLogger';
import { PrayerName, DayPrayerTimes, PrayerTime, CalculationMethod, City } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAMPLE_PRAYER_DATA, getSamplePrayerTimes, getDefaultDemoDate, isDateInSampleRange } from './sampleDataHandler';

// Development mode configuration
let USE_SAMPLE_DATA = false; // Set to false for production API calls

// Aladhan API base URL
const ALADHAN_BASE_URL = 'https://api.aladhan.com/v1';

// API response interfaces
interface AladhanPrayerData {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: any;
}

interface AladhanDayResponse {
  code: number;
  status: string;
  data: {
    timings: AladhanPrayerData;
    date: {
      readable: string;
      timestamp: string;
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: any;
        month: any;
        year: string;
        designation: any;
        holidays: any[];
      };
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: any;
        month: any;
        year: string;
        designation: any;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: CalculationMethod;
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
      offset: any;
    };
  };
}

interface AladhanCalendarResponse {
  code: number;
  status: string;
  data: AladhanDayResponse['data'][];
}

interface LocationResponse {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Location interface for API calls
interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export class AladhanApiService {
  private static instance: AladhanApiService;
  private isOnline = true;

  private constructor() {
    // Monitor network status
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  public static getInstance(): AladhanApiService {
    if (!AladhanApiService.instance) {
      AladhanApiService.instance = new AladhanApiService();
    }
    return AladhanApiService.instance;
  }

  /**
   * Check if the device is online
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;
      return this.isOnline;
    } catch (error) {
      secureLogger.error('Network check failed', { error });
      return false;
    }
  }

  /**
   * Helper to safely get error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Create fetch with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'TasbeehApp/1.0',
          ...options.headers,
        },
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Fetch prayer times for a specific date using coordinates
   */
  public async fetchPrayerTimesForDate(
    date: string, // YYYY-MM-DD format
    latitude: number,
    longitude: number,
    method: number = 2, // Default to ISNA
    adjustment?: { [key in PrayerName]?: number }
  ): Promise<DayPrayerTimes> {
    // Use sample data if enabled
    if (USE_SAMPLE_DATA) {
      secureLogger.info('Using sample data for prayer times', { date });
      const sampleData = getSamplePrayerTimes(date);
      if (sampleData) {
        // Apply adjustments if provided
        if (adjustment) {
          sampleData.prayers = sampleData.prayers.map(prayer => {
            const adjustmentValue = adjustment[prayer.name] || 0;
            return {
              ...prayer,
              adjustment: adjustmentValue,
              time: adjustmentValue !== 0 
                ? this.adjustTime(prayer.originalTime, adjustmentValue)
                : prayer.originalTime,
            };
          });
        }
        return sampleData;
      }
      // If no sample data for this date, fall back to API
      secureLogger.warn('No sample data found for date, falling back to API', { date });
    }

    if (!this.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      // Convert date from YYYY-MM-DD to DD-MM-YYYY for API
      const [year, month, day] = date.split('-');
      const apiDate = `${day}-${month}-${year}`;
      
      const url = `${ALADHAN_BASE_URL}/timings/${apiDate}`;
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        method: method.toString(),
        midnightMode: '0',
        timezonestring: 'auto',
      });

      secureLogger.info('Fetching prayer times', { date, apiDate, latitude, longitude, method });

      const response = await this.fetchWithTimeout(`${url}?${params}`, {
        method: 'GET',
      }, 10000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data: AladhanDayResponse = await response.json();
      
      if (data.code !== 200) {
        throw new Error(`API returned error: ${data.status || 'Unknown error'}`);
      }

      if (!this.validateApiResponse(data)) {
        throw new Error('Invalid API response format');
      }

      return this.transformApiResponse(data, adjustment);
    } catch (error) {
      secureLogger.error('Failed to fetch prayer times', { error: this.getErrorMessage(error), date, latitude, longitude });
      throw error;
    }
  }

  /**
   * Fetch prayer times calendar for a month using coordinates
   */
  public async fetchMonthlyCalendar(
    year: number,
    month: number,
    latitude: number,
    longitude: number,
    method: number = 2,
    adjustment?: { [key in PrayerName]?: number }
  ): Promise<DayPrayerTimes[]> {
    if (!this.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      const url = `${ALADHAN_BASE_URL}/calendar/${year}/${month}`;
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        method: method.toString(),
        midnightMode: '0',
        timezonestring: 'auto',
      });

      secureLogger.info('Fetching monthly calendar', { year, month, latitude, longitude, method });

      const response = await this.fetchWithTimeout(`${url}?${params}`, {
        method: 'GET',
      }, 15000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar API request failed with status ${response.status}: ${errorText}`);
      }

      const data: AladhanCalendarResponse = await response.json();
      
      if (data.code !== 200) {
        throw new Error(`Calendar API returned error: ${data.status || 'Unknown error'}`);
      }

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid calendar API response format');
      }

      return data.data.map(dayData => 
        this.transformApiResponse({ 
          code: 200, 
          status: 'OK', 
          data: dayData 
        } as AladhanDayResponse, adjustment)
      );
    } catch (error) {
      secureLogger.error('Failed to fetch monthly calendar', { error: this.getErrorMessage(error), year, month, latitude, longitude });
      throw error;
    }
  }

  /**
   * Fetch prayer times calendar for a month using city (alternative method)
   */
  public async fetchMonthlyCalendarByCity(
    year: number,
    month: number,
    city: string,
    country: string,
    method: number = 2,
    adjustment?: { [key in PrayerName]?: number }
  ): Promise<DayPrayerTimes[]> {
    if (!this.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      const url = `${ALADHAN_BASE_URL}/calendarByCity/${year}/${month}`;
      const params = new URLSearchParams({
        city: city,
        country: country,
        method: method.toString(),
        midnightMode: '0',
      });

      secureLogger.info('Fetching monthly calendar by city', { year, month, city, country, method });

      const response = await this.fetchWithTimeout(`${url}?${params}`, {
        method: 'GET',
      }, 15000);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calendar by city API request failed with status ${response.status}: ${errorText}`);
      }

      const data: AladhanCalendarResponse = await response.json();
      
      if (data.code !== 200) {
        throw new Error(`Calendar by city API returned error: ${data.status || 'Unknown error'}`);
      }

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid calendar by city API response format');
      }

      return data.data.map(dayData => 
        this.transformApiResponse({ 
          code: 200, 
          status: 'OK', 
          data: dayData 
        } as AladhanDayResponse, adjustment)
      );
    } catch (error) {
      secureLogger.error('Failed to fetch monthly calendar by city', { error: this.getErrorMessage(error), year, month, city, country });
      throw error;
    }
  }



  /**
   * Search for cities by name
   */
  public async searchCities(query: string): Promise<City[]> {
    // For now, we'll filter from the popular cities list
    // In a production app, you might want to integrate with a proper geocoding service
    const { POPULAR_CITIES } = await import('../types');
    
    const filteredCities = POPULAR_CITIES.filter(city =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.country.toLowerCase().includes(query.toLowerCase())
    );

    return filteredCities.slice(0, 10); // Limit to 10 results
  }

  /**
   * Transform API response to our internal format
   */
  private transformApiResponse(
    data: AladhanDayResponse,
    adjustment?: { [key in PrayerName]?: number }
  ): DayPrayerTimes {
    const timings = data.data.timings;
    const prayerNames: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const apiKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const prayers: PrayerTime[] = prayerNames.map((name, index) => {
      const originalTime = this.formatTime(timings[apiKeys[index]]);
      const adjustmentMinutes = adjustment?.[name] || 0;
      const adjustedTime = this.adjustTime(originalTime, adjustmentMinutes);

      return {
        name,
        time: adjustedTime,
        originalTime,
        adjustment: adjustmentMinutes,
        notificationEnabled: true, // Default to enabled
        isNotified: false, // Reset daily
      };
    });

    // Format Hijri date properly
    const [hijriDay, hijriMonth, hijriYear] = data.data.date.hijri.date.split('-');
    const hijriDateFormatted = `${hijriDay} ${data.data.date.hijri.month.en} ${hijriYear} AH`;

    return {
      date: data.data.date.gregorian.date, // Keep API format: DD-MM-YYYY
      hijriDate: hijriDateFormatted,
      prayers,
      location: {
        city: 'Unknown City', // Will be updated by location service
        country: 'Unknown Country',
        latitude: data.data.meta.latitude,
        longitude: data.data.meta.longitude,
      },
      method: data.data.meta.method,
    };
  }

  /**
   * Format time from API response (remove timezone info)
   */
  private formatTime(timeString: string): string {
    // API returns time like "05:30 (+03)", "05:30 (BST)", or "05:30"
    return timeString.replace(/\s*\([^)]*\)\s*$/, '').trim();
  }

  /**
   * Adjust prayer time by minutes
   */
  private adjustTime(time: string, minutes: number): string {
    if (minutes === 0) return time;

    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);

    return date.toTimeString().slice(0, 5);
  }

  /**
   * Validate API response
   */
  private validateApiResponse(data: any): boolean {
    return (
      data &&
      data.code === 200 &&
      data.data &&
      data.data.timings &&
      data.data.timings.Fajr &&
      data.data.timings.Dhuhr &&
      data.data.timings.Asr &&
      data.data.timings.Maghrib &&
      data.data.timings.Isha
    );
  }

  /**
   * Get calculation methods available in the API
   */
  public getAvailableCalculationMethods(): CalculationMethod[] {
    const { CALCULATION_METHODS } = require('../types');
    return CALCULATION_METHODS;
  }

  /**
   * Batch fetch prayer times for multiple dates
   */
  public async batchFetchPrayerTimes(
    dates: string[],
    latitude: number,
    longitude: number,
    method: number = 2,
    adjustment?: { [key in PrayerName]?: number }
  ): Promise<{ [date: string]: DayPrayerTimes }> {
    const results: { [date: string]: DayPrayerTimes } = {};
    const batchSize = 5; // Limit concurrent requests

    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      const promises = batch.map(async (date) => {
        try {
          const prayerTimes = await this.fetchPrayerTimesForDate(
            date,
            latitude,
            longitude,
            method,
            adjustment
          );
          return { date, prayerTimes };
        } catch (error) {
          secureLogger.error('Failed to fetch prayer times for date', { error, date });
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(result => {
        if (result) {
          results[result.date] = result.prayerTimes;
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < dates.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get Qibla direction for coordinates
   */
  public async getQiblaDirection(
    latitude: number,
    longitude: number
  ): Promise<number> {
    if (!this.isOnline) {
      throw new Error('No internet connection available');
    }

    try {
      const url = `${ALADHAN_BASE_URL}/qibla/${latitude}/${longitude}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Qibla API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error(`Qibla API returned error: ${data.status}`);
      }

      return data.data.direction;
    } catch (error) {
      secureLogger.error('Failed to fetch Qibla direction', { error, latitude, longitude });
      throw error;
    }
  }
}

export const aladhanApi = AladhanApiService.getInstance();

const BASE_URL = 'https://api.aladhan.com/v1';

interface ApiTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

interface ApiResponse {
  code: number;
  status: string;
  data: {
    timings: ApiTimings;
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string };
        month: { number: number; en: string };
        year: string;
        designation: { abbreviated: string; expanded: string };
      };
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string; ar: string };
        month: { number: number; en: string; ar: string };
        year: string;
        designation: { abbreviated: string; expanded: string };
        holidays?: string[];
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
        params: { Fajr: number; Isha: number };
      };
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
    };
  }[];
}

// Generate sample data for a full month using the improved sample data handler
function generateSampleMonthData(year: number, month: number): DayPrayerTimes[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: DayPrayerTimes[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const targetDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Get sample data (now includes fallback logic internally)
    const sampleData = getSamplePrayerTimes(targetDate);
    if (sampleData) {
      result.push(sampleData);
    }
  }
  
  return result;
}

const validateApiResponse = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    console.error('[PrayerAPI] Invalid response: not an object');
    return false;
  }

  if (data.code !== 200) {
    console.error('[PrayerAPI] API error:', data.status || 'Unknown error');
    return false;
  }

  if (!Array.isArray(data.data)) {
    console.error('[PrayerAPI] Invalid response: data is not an array');
    return false;
  }

  return data.data.every((item: any) => {
    const hasTimings = item.timings && 
      typeof item.timings.Fajr === 'string' &&
      typeof item.timings.Dhuhr === 'string' &&
      typeof item.timings.Asr === 'string' &&
      typeof item.timings.Maghrib === 'string' &&
      typeof item.timings.Isha === 'string';

    const hasDate = item.date && 
      typeof item.date.readable === 'string' &&
      item.date.gregorian &&
      typeof item.date.gregorian.date === 'string';

    if (!hasTimings) {
      console.error('[PrayerAPI] Invalid item: missing timings');
      return false;
    }

    if (!hasDate) {
      console.error('[PrayerAPI] Invalid item: missing date');
      return false;
    }

    return true;
  });
};

const transformApiResponse = (apiData: ApiResponse['data'], location: Location, method: CalculationMethod): DayPrayerTimes[] => {
  return apiData.map(item => {
    // Format Hijri date properly
    const [hijriDay, hijriMonth, hijriYear] = item.date.hijri.date.split('-');
    const hijriDateFormatted = `${hijriDay} ${item.date.hijri.month.en} ${hijriYear} AH`;

    // Helper to clean time strings - remove timezone info
    const cleanTime = (timeString: string): string => {
      return timeString.replace(/\s*\([^)]*\)\s*$/, '').trim();
    };

    const prayers: PrayerTime[] = [
      {
        name: 'fajr',
        time: cleanTime(item.timings.Fajr),
        originalTime: cleanTime(item.timings.Fajr),
        adjustment: 0,
        notificationEnabled: true,
        isNotified: false,
      },
      {
        name: 'dhuhr',
        time: cleanTime(item.timings.Dhuhr),
        originalTime: cleanTime(item.timings.Dhuhr),
        adjustment: 0,
        notificationEnabled: true,
        isNotified: false,
      },
      {
        name: 'asr',
        time: cleanTime(item.timings.Asr),
        originalTime: cleanTime(item.timings.Asr),
        adjustment: 0,
        notificationEnabled: true,
        isNotified: false,
      },
      {
        name: 'maghrib',
        time: cleanTime(item.timings.Maghrib),
        originalTime: cleanTime(item.timings.Maghrib),
        adjustment: 0,
        notificationEnabled: true,
        isNotified: false,
      },
      {
        name: 'isha',
        time: cleanTime(item.timings.Isha),
        originalTime: cleanTime(item.timings.Isha),
        adjustment: 0,
        notificationEnabled: true,
        isNotified: false,
      },
    ];

    return {
      date: item.date.gregorian.date, // Keep API format: DD-MM-YYYY
      hijriDate: hijriDateFormatted,
      prayers,
      location: {
        city: location.city || 'Unknown',
        country: location.country || 'Unknown',
        latitude: item.meta.latitude,
        longitude: item.meta.longitude,
      },
      method,
    };
  });
};

export const fetchMonthlyPrayerTimes = async (
  location: Location,
  method: CalculationMethod,
  year?: number,
  month?: number
): Promise<DayPrayerTimes[]> => {
  // Use current date if not provided
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || (now.getMonth() + 1);

  console.log(`[PrayerAPI] Fetching prayer times for ${targetYear}-${targetMonth}`);
  console.log(`[PrayerAPI] Using sample data: ${USE_SAMPLE_DATA}`);

  // Check cache first
  const cacheKey = `prayer_times_${location.latitude}_${location.longitude}_${method.id}_${targetYear}_${targetMonth}`;
  
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const cacheAge = Date.now() - parsed.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge < maxAge) {
        console.log('[PrayerAPI] Using cached data');
        return parsed.data;
      }
    }
  } catch (error) {
    console.warn('[PrayerAPI] Cache read error:', error);
  }

  // Return sample data if in development mode
  if (USE_SAMPLE_DATA) {
    console.log('[PrayerAPI] Using sample data for development');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const transformedData = generateSampleMonthData(targetYear, targetMonth);
    
    // Cache the sample data
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: transformedData,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('[PrayerAPI] Cache write error:', error);
    }
    
    return transformedData;
  }

  // Make API call for production
  const url = `${BASE_URL}/calendar/${targetYear}/${targetMonth}`;
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    method: method.id.toString()
  });

  try {
    console.log(`[PrayerAPI] Making request to: ${url}?${params}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TasbeehApp/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!validateApiResponse(data)) {
      throw new Error('Invalid API response format');
    }

    const transformedData = transformApiResponse(data.data, location, method);

    // Cache successful response
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: transformedData,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('[PrayerAPI] Cache write error:', error);
    }

    console.log(`[PrayerAPI] Successfully fetched ${transformedData.length} days`);
    console.log(`[PrayerAPI] Date range:`, transformedData.map(d => d.date));
    return transformedData;

  } catch (error) {
    console.error('[PrayerAPI] Fetch error:', error);
    
    // Try to return cached data as fallback
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        console.log('[PrayerAPI] Using stale cached data as fallback');
        const parsed = JSON.parse(cachedData);
        return parsed.data;
      }
    } catch (cacheError) {
      console.warn('[PrayerAPI] Cache fallback failed:', cacheError);
    }

    throw error;
  }
};

export const fetchTodaysPrayerTimes = async (
  location: Location,
  method: CalculationMethod
): Promise<DayPrayerTimes | null> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  try {
    const monthlyData = await fetchMonthlyPrayerTimes(location, method, year, month);
    // Use API date format DD-MM-YYYY
    const today = `${now.getDate().toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
    
    console.log(`[PrayerAPI] Looking for today's prayer times: ${today}`);
    console.log(`[PrayerAPI] Available dates:`, monthlyData.map(day => day.date));
    
    return monthlyData.find(day => day.date === today) || null;
  } catch (error) {
    console.error('[PrayerAPI] Error fetching today\'s prayer times:', error);
    return null;
  }
};

// Clear all cached prayer times
export const clearPrayerTimesCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prayerKeys = keys.filter(key => key.startsWith('prayer_times_'));
    await AsyncStorage.multiRemove(prayerKeys);
    console.log(`[PrayerAPI] Cleared ${prayerKeys.length} cached entries`);
  } catch (error) {
    console.error('[PrayerAPI] Error clearing cache:', error);
  }
};

// Get cache statistics
export const getCacheInfo = async (): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry?: string;
  newestEntry?: string;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prayerKeys = keys.filter(key => key.startsWith('prayer_times_'));
    
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let oldestEntry = '';
    let newestEntry = '';

    for (const key of prayerKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        totalSize += data.length;
        try {
          const parsed = JSON.parse(data);
          if (parsed.timestamp < oldestTimestamp) {
            oldestTimestamp = parsed.timestamp;
            oldestEntry = key;
          }
          if (parsed.timestamp > newestTimestamp) {
            newestTimestamp = parsed.timestamp;
            newestEntry = key;
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    }

    return {
      totalEntries: prayerKeys.length,
      totalSize,
      oldestEntry: oldestEntry || undefined,
      newestEntry: newestEntry || undefined,
    };
  } catch (error) {
    console.error('[PrayerAPI] Error getting cache info:', error);
    return { totalEntries: 0, totalSize: 0 };
  }
};

// Configuration helper to switch between sample and live data
export const toggleSampleDataMode = (): boolean => {
  USE_SAMPLE_DATA = !USE_SAMPLE_DATA;
  console.log(`[PrayerAPI] Sample data mode toggled to: ${USE_SAMPLE_DATA}`);
  return USE_SAMPLE_DATA;
};

export const isSampleDataMode = (): boolean => {
  console.log(`[PrayerAPI] Sample data mode check: ${USE_SAMPLE_DATA}`);
  return USE_SAMPLE_DATA;
};

// Add function to force clear all production cache
export const clearAllProductionCache = async (): Promise<void> => {
  try {
    console.log('[PrayerAPI] Clearing all production cache...');
    await clearPrayerTimesCache();
    
    // Also clear any AsyncStorage cache
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.includes('prayer_times_') || 
      key.includes('location_') ||
      key === 'prayer_times_location'
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[PrayerAPI] Removed ${cacheKeys.length} cache entries`);
    }
    
    console.log('[PrayerAPI] All production cache cleared successfully');
  } catch (error) {
    console.error('[PrayerAPI] Error clearing production cache:', error);
  }
}; 