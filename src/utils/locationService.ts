import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureLogger } from './secureLogger';
import { aladhanApi } from './aladhanApi';
import { City } from '../types';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  accuracy?: number;
  timestamp: number;
}

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  reason?: string;
}

const LOCATION_STORAGE_KEY = 'prayer_times_location';
const LOCATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class LocationService {
  private static instance: LocationService;
  private lastKnownLocation: LocationData | null = null;
  private isLocationWatching = false;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  public async requestLocationPermission(): Promise<LocationPermissionResult> {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return {
          granted: false,
          canAskAgain: false,
          reason: 'Location services are disabled on this device',
        };
      }

      // Request foreground permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        secureLogger.info('Location permission granted');
        return { granted: true, canAskAgain: true };
      }

      const reason = status === 'denied' 
        ? 'Location permission was denied'
        : 'Location permission is required for automatic prayer times';

      return {
        granted: false,
        canAskAgain,
        reason,
      };
    } catch (error) {
      secureLogger.error('Failed to request location permission', { error });
      return {
        granted: false,
        canAskAgain: false,
        reason: 'Failed to request location permission',
      };
    }
  }

  /**
   * Get current GPS location
   */
  public async getCurrentLocation(
    highAccuracy: boolean = false,
    timeout: number = 15000
  ): Promise<LocationData> {
    try {
      // Check permission first
      const permissionResult = await this.checkLocationPermission();
      if (!permissionResult.granted) {
        throw new Error(permissionResult.reason || 'Location permission not granted');
      }

      secureLogger.info('Getting current location', { highAccuracy, timeout });

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy 
          ? Location.Accuracy.BestForNavigation 
          : Location.Accuracy.Balanced,
        timeout,
        mayShowUserSettingsDialog: true,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      // Try to get city and country information
      try {
        const locationInfo = await aladhanApi.getLocationFromCoordinates(
          locationData.latitude,
          locationData.longitude
        );
        locationData.city = locationInfo.city;
        locationData.country = locationInfo.country;
      } catch (error) {
        secureLogger.warn('Failed to get location details', { error });
      }

      this.lastKnownLocation = locationData;
      await this.saveLocationToStorage(locationData);

      secureLogger.info('Location obtained successfully', { 
        latitude: locationData.latitude, 
        longitude: locationData.longitude,
        city: locationData.city,
        accuracy: locationData.accuracy 
      });

      return locationData;
    } catch (error) {
      secureLogger.error('Failed to get current location', { error });
      throw error;
    }
  }

  /**
   * Check location permission status
   */
  public async checkLocationPermission(): Promise<LocationPermissionResult> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        reason: status !== 'granted' ? 'Location permission not granted' : undefined,
      };
    } catch (error) {
      secureLogger.error('Failed to check location permission', { error });
      return {
        granted: false,
        canAskAgain: false,
        reason: 'Failed to check location permission',
      };
    }
  }

  /**
   * Start watching location changes
   */
  public async startLocationWatch(
    onLocationUpdate: (location: LocationData) => void,
    accuracy: Location.Accuracy = Location.Accuracy.Balanced
  ): Promise<boolean> {
    try {
      if (this.isLocationWatching) {
        await this.stopLocationWatch();
      }

      const permissionResult = await this.checkLocationPermission();
      if (!permissionResult.granted) {
        throw new Error('Location permission not granted');
      }

      secureLogger.info('Starting location watch');

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: 60000, // Update every minute
          distanceInterval: 100, // Update if moved 100 meters
        },
        async (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: Date.now(),
          };

          // Only update if significantly different from last location
          if (this.hasLocationChangedSignificantly(locationData)) {
            try {
              const locationInfo = await aladhanApi.getLocationFromCoordinates(
                locationData.latitude,
                locationData.longitude
              );
              locationData.city = locationInfo.city;
              locationData.country = locationInfo.country;
            } catch (error) {
              secureLogger.warn('Failed to get location details during watch', { error });
            }

            this.lastKnownLocation = locationData;
            await this.saveLocationToStorage(locationData);
            onLocationUpdate(locationData);
          }
        }
      );

      this.isLocationWatching = true;
      return true;
    } catch (error) {
      secureLogger.error('Failed to start location watch', { error });
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  public async stopLocationWatch(): Promise<void> {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isLocationWatching = false;
    secureLogger.info('Location watch stopped');
  }

  /**
   * Get cached location from storage
   */
  public async getCachedLocation(): Promise<LocationData | null> {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (!cached) return null;

      const locationData: LocationData = JSON.parse(cached);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - locationData.timestamp > LOCATION_CACHE_DURATION) {
        secureLogger.info('Cached location expired');
        return null;
      }

      this.lastKnownLocation = locationData;
      return locationData;
    } catch (error) {
      secureLogger.error('Failed to get cached location', { error });
      return null;
    }
  }

  /**
   * Save location to storage
   */
  private async saveLocationToStorage(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      secureLogger.error('Failed to save location to storage', { error });
    }
  }

  /**
   * Get location data for a city
   */
  public getLocationDataForCity(city: City): LocationData {
    return {
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
      country: city.country,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if location has changed significantly
   */
  private hasLocationChangedSignificantly(newLocation: LocationData): boolean {
    if (!this.lastKnownLocation) return true;

    const distance = this.calculateDistance(
      this.lastKnownLocation.latitude,
      this.lastKnownLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    // Consider significant if moved more than 5km
    return distance > 5000;
  }

  /**
   * Get last known location
   */
  public getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Set manual location
   */
  public async setManualLocation(city: City): Promise<LocationData> {
    const locationData = this.getLocationDataForCity(city);
    this.lastKnownLocation = locationData;
    await this.saveLocationToStorage(locationData);
    
    secureLogger.info('Manual location set', { 
      city: city.name, 
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude 
    });
    
    return locationData;
  }

  /**
   * Search for nearby cities
   */
  public async findNearbyCities(
    latitude: number,
    longitude: number,
    radiusKm: number = 100
  ): Promise<City[]> {
    const { POPULAR_CITIES } = await import('../types');
    
    return POPULAR_CITIES.filter(city => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        city.latitude,
        city.longitude
      );
      return distance <= radiusKm * 1000; // Convert km to meters
    }).sort((a, b) => {
      const distanceA = this.calculateDistance(latitude, longitude, a.latitude, a.longitude);
      const distanceB = this.calculateDistance(latitude, longitude, b.latitude, b.longitude);
      return distanceA - distanceB;
    });
  }

  /**
   * Get optimal location for prayer times
   */
  public async getOptimalLocation(): Promise<LocationData> {
    // First try to get cached location
    const cached = await this.getCachedLocation();
    if (cached) {
      return cached;
    }

    // Try to get current GPS location
    try {
      const permissionResult = await this.checkLocationPermission();
      if (permissionResult.granted) {
        return await this.getCurrentLocation();
      }
    } catch (error) {
      secureLogger.warn('Failed to get GPS location, will use fallback', { error });
    }

    // Fallback to last known location or default
    if (this.lastKnownLocation) {
      return this.lastKnownLocation;
    }

    // Ultimate fallback to Mecca
    const { POPULAR_CITIES } = await import('../types');
    const mecca = POPULAR_CITIES.find(city => city.id === 'mecca')!;
    return this.getLocationDataForCity(mecca);
  }

  /**
   * Clear cached location data
   */
  public async clearLocationCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      this.lastKnownLocation = null;
      secureLogger.info('Location cache cleared');
    } catch (error) {
      secureLogger.error('Failed to clear location cache', { error });
    }
  }

  /**
   * Check if device supports location services
   */
  public async isLocationAvailable(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      secureLogger.error('Failed to check location availability', { error });
      return false;
    }
  }
}

export const locationService = LocationService.getInstance();

// Export convenience functions for easy use
export const requestLocationPermission = async (): Promise<LocationPermissionResult> => {
  return locationService.requestLocationPermission();
};

export const getLocation = async (highAccuracy: boolean = false): Promise<LocationData> => {
  return locationService.getCurrentLocation(highAccuracy);
};

export const getCachedLocation = async (): Promise<LocationData | null> => {
  return locationService.getCachedLocation();
};

export const checkLocationPermission = async (): Promise<LocationPermissionResult> => {
  return locationService.checkLocationPermission();
}; 