import { Platform } from 'react-native';

/**
 * Format duration in seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

/**
 * Format date to localized string
 */
export const formatDate = (dateString: string, locale: 'en' | 'ar' = 'en'): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const localeString = locale === 'ar' ? 'ar-SA' : 'en-US';
  return date.toLocaleDateString(localeString, options);
};

/**
 * Format number with locale-specific separators
 */
export const formatNumber = (num: number, locale: 'en' | 'ar' = 'en'): string => {
  const localeString = locale === 'ar' ? 'ar-SA' : 'en-US';
  return num.toLocaleString(localeString);
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString: string, locale: 'en' | 'ar' = 'en'): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ar') {
    if (diffDays > 0) return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
    if (diffHours > 0) return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
    if (diffMinutes > 0) return `منذ ${diffMinutes} ${diffMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
    return 'منذ لحظات';
  } else {
    if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    return 'Just now';
  }
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = (locale: 'en' | 'ar' = 'en'): string => {
  const hour = new Date().getHours();
  
  if (locale === 'ar') {
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  } else {
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
};

/**
 * Validate if a string is a valid number
 */
export const isValidNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && Number(value) >= 0;
};

/**
 * Clamp number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get platform-specific value
 */
export const platformSelect = <T>(values: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T => {
  if (Platform.OS === 'ios' && values.ios !== undefined) return values.ios;
  if (Platform.OS === 'android' && values.android !== undefined) return values.android;
  if (Platform.OS === 'web' && values.web !== undefined) return values.web;
  return values.default;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
};

/**
 * Get day of week in Arabic or English
 */
export const getDayOfWeek = (date: Date, locale: 'en' | 'ar' = 'en'): string => {
  const days = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  };
  
  return days[locale][date.getDay()];
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is in current week
 */
export const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
};

/**
 * Get storage key with prefix
 */
export const getStorageKey = (key: string): string => {
  return `tasbeeh_${key}`;
};

/**
 * Format time based on user's preferred time format
 * @param time - Time in HH:MM format (24-hour)
 * @param format - '12h' for AM/PM format, '24h' for 24-hour format
 * @returns Formatted time string
 */
export const formatTime = (time: string, format: '12h' | '24h' = '24h'): string => {
  if (format === '24h') {
    return time; // Already in 24-hour format
  }

  // Convert to 12-hour format
  const [hours, minutes] = time.split(':').map(Number);
  
  if (hours === 0) {
    return `12:${minutes.toString().padStart(2, '0')} AM`;
  } else if (hours < 12) {
    return `${hours}:${minutes.toString().padStart(2, '0')} AM`;
  } else if (hours === 12) {
    return `12:${minutes.toString().padStart(2, '0')} PM`;
  } else {
    return `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`;
  }
};

/**
 * Adjust time by a number of minutes
 * @param time - Time in HH:MM format
 * @param minutes - Minutes to adjust (+/-)
 * @returns Adjusted time in HH:MM format
 */
export const adjustTime = (time: string, minutes: number): string => {
  // Input validation
  if (!time || typeof time !== 'string') {
    console.error('adjustTime: Invalid time input:', time);
    return '00:00';
  }
  
  if (typeof minutes !== 'number' || isNaN(minutes)) {
    console.error('adjustTime: Invalid minutes input:', minutes);
    return time; // Return original time if adjustment is invalid
  }
  
  // Clean time string - remove timezone info like "(BST)", "(UTC)", etc.
  const cleanTime = time.replace(/\s*\([^)]*\)\s*$/, '').trim();
  
  const timeParts = cleanTime.split(':');
  if (timeParts.length !== 2) {
    console.error('adjustTime: Invalid time format, expected HH:MM:', { original: time, cleaned: cleanTime });
    return time;
  }
  
  const [hours, mins] = timeParts.map(Number);
  
  // Check if parsing was successful
  if (isNaN(hours) || isNaN(mins)) {
    console.error('adjustTime: Failed to parse time parts:', { time, hours, mins });
    return time;
  }
  
  // Validate hour and minute ranges
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
    console.error('adjustTime: Invalid time values:', { hours, mins });
    return time;
  }
  
  // Apply adjustment
  const totalMinutes = hours * 60 + mins + minutes;
  
  // Handle day overflow/underflow
  let adjustedMinutes = totalMinutes % (24 * 60);
  if (adjustedMinutes < 0) {
    adjustedMinutes += 24 * 60;
  }
  
  const adjustedHours = Math.floor(adjustedMinutes / 60);
  const finalMinutes = adjustedMinutes % 60;
  
  return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
};

/**
 * Format prayer time with adjustments applied
 * @param time - Original time in HH:MM format
 * @param adjustment - Minutes to adjust (+/-)
 * @param format - Time format preference
 * @returns Formatted adjusted time
 */
export const formatAdjustedTime = (
  time: string, 
  adjustment: number = 0, 
  format: '12h' | '24h' = '24h'
): string => {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Apply adjustment
  const totalMinutes = hours * 60 + minutes + adjustment;
  
  // Handle day overflow/underflow
  let adjustedMinutes = totalMinutes % (24 * 60);
  if (adjustedMinutes < 0) {
    adjustedMinutes += 24 * 60;
  }
  
  const adjustedHours = Math.floor(adjustedMinutes / 60);
  const finalMinutes = adjustedMinutes % 60;
  
  const adjustedTime = `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  
  return formatTime(adjustedTime, format);
};

/**
 * Get display time for prayer with format preference
 * @param prayer - Prayer time object
 * @param format - Time format preference
 * @returns Object with formatted original and adjusted times
 */
export const getPrayerDisplayTime = (
  prayer: { time: string; adjustment: number },
  format: '12h' | '24h' = '24h'
) => {
  const originalTime = formatTime(prayer.time, format);
  const adjustedTime = formatAdjustedTime(prayer.time, prayer.adjustment, format);
  const hasAdjustment = prayer.adjustment !== 0;
  
  return {
    originalTime,
    adjustedTime,
    displayTime: hasAdjustment ? adjustedTime : originalTime,
    hasAdjustment,
    adjustmentText: hasAdjustment 
      ? `(${prayer.adjustment > 0 ? '+' : ''}${prayer.adjustment} min)` 
      : ''
  };
};

export default {
  formatDuration,
  formatDate,
  formatNumber,
  generateId,
  getRelativeTime,
  getGreeting,
  isValidNumber,
  clamp,
  debounce,
  platformSelect,
  calculatePercentage,
  getDayOfWeek,
  isToday,
  isThisWeek,
  getStorageKey,
  formatTime,
  formatAdjustedTime,
  getPrayerDisplayTime,
  adjustTime,
}; 