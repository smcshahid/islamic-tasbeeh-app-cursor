/**
 * Network Error Handling Utility
 * Provides retry logic, connection monitoring, and graceful error handling
 */
import NetInfo from '@react-native-community/netinfo';
import { secureLogger } from './secureLogger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export interface NetworkError extends Error {
  code?: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  retryCount?: number;
}

export class NetworkHandler {
  private static instance: NetworkHandler;
  private isConnected: boolean = true;
  private connectionListeners: Set<(isConnected: boolean) => void> = new Set();

  static getInstance(): NetworkHandler {
    if (!NetworkHandler.instance) {
      NetworkHandler.instance = new NetworkHandler();
    }
    return NetworkHandler.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.isConnected = netInfo.isConnected ?? false;

      // Listen for network changes
      NetInfo.addEventListener((state) => {
        const wasConnected = this.isConnected;
        this.isConnected = state.isConnected ?? false;

        if (wasConnected !== this.isConnected) {
          secureLogger.info('Network status changed', {
            isConnected: this.isConnected,
            type: state.type,
            isInternetReachable: state.isInternetReachable,
          }, 'NetworkHandler');

          // Notify listeners
          this.connectionListeners.forEach(listener => listener(this.isConnected));
        }
      });
    } catch (error) {
      secureLogger.error('Failed to initialize network monitoring', error, 'NetworkHandler');
    }
  }

  /**
   * Subscribe to network status changes
   */
  onConnectionChange(listener: (isConnected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Check if device is currently connected to internet
   */
  isNetworkConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryCondition = this.defaultRetryCondition,
    } = options;

    let lastError: NetworkError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network connectivity before attempt
        if (!this.isConnected && attempt > 0) {
          throw new Error('No network connection available');
        }

        const result = await operation();
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 0) {
          secureLogger.info('Operation succeeded after retry', {
            attempt,
            totalAttempts: attempt + 1,
          }, 'NetworkHandler');
        }
        
        return result;
      } catch (error: any) {
        lastError = this.enhanceError(error, attempt);
        
        // Don't retry if this is the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error should trigger a retry
        if (!retryCondition(lastError)) {
          secureLogger.info('Error does not meet retry conditions', {
            error: lastError.message,
            attempt,
          }, 'NetworkHandler');
          break;
        }

        // Log retry attempt
        secureLogger.warn('Operation failed, retrying', {
          error: lastError.message,
          attempt: attempt + 1,
          nextDelay: delay,
          isNetworkConnected: this.isConnected,
        }, 'NetworkHandler');

        // Wait before retrying
        await this.delay(delay);
        
        // Exponential backoff
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    // All retries exhausted
    secureLogger.error('Operation failed after all retries', {
      error: lastError!.message,
      totalAttempts: maxRetries + 1,
      isNetworkConnected: this.isConnected,
    }, 'NetworkHandler');

    throw lastError!;
  }

  /**
   * Enhanced fetch with automatic retry and error handling
   */
  async fetch(
    url: string, 
    options: RequestInit = {}, 
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    return this.withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as NetworkError;
          error.statusCode = response.status;
          error.isNetworkError = true;
          throw error;
        }

        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timeout') as NetworkError;
          timeoutError.isTimeout = true;
          timeoutError.isNetworkError = true;
          throw timeoutError;
        }
        
        throw error;
      }
    }, retryOptions);
  }

  /**
   * Check if error is retryable
   */
  private defaultRetryCondition(error: NetworkError): boolean {
    // Don't retry client errors (4xx) except for specific cases
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      // Retry on these specific client errors
      return [408, 429].includes(error.statusCode);
    }

    // Retry on server errors (5xx)
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }

    // Retry on network errors
    if (error.isNetworkError || error.isTimeout) {
      return true;
    }

    // Retry on connection errors
    if (error.message) {
      const retryableMessages = [
        'network request failed',
        'fetch failed',
        'connection refused',
        'timeout',
        'no network connection',
      ];
      
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      );
    }

    return false;
  }

  /**
   * Enhance error with additional context
   */
  private enhanceError(error: any, retryCount: number): NetworkError {
    const networkError = error as NetworkError;
    
    // Add network context
    networkError.isNetworkError = true;
    networkError.retryCount = retryCount;

    // Add timeout flag if needed
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      networkError.isTimeout = true;
    }

    // Add friendly error messages
    if (!this.isConnected) {
      networkError.message = 'No internet connection. Please check your network and try again.';
    } else if (networkError.isTimeout) {
      networkError.message = 'Request timed out. Please try again.';
    } else if (networkError.statusCode === 429) {
      networkError.message = 'Too many requests. Please wait a moment and try again.';
    } else if (networkError.statusCode && networkError.statusCode >= 500) {
      networkError.message = 'Server error. Please try again in a moment.';
    }

    return networkError;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyErrorMessage(error: NetworkError): string {
    if (!this.isConnected) {
      return 'No internet connection. Please check your network settings.';
    }

    if (error.isTimeout) {
      return 'Request timed out. Please try again.';
    }

    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          return 'Invalid request. Please try again.';
        case 401:
          return 'Authentication required. Please sign in again.';
        case 403:
          return 'Access denied. Please check your permissions.';
        case 404:
          return 'Resource not found. Please try again later.';
        case 429:
          return 'Too many requests. Please wait a moment.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Server error. Please try again in a moment.';
        default:
          return 'Network error occurred. Please try again.';
      }
    }

    return error.message || 'An unexpected error occurred. Please try again.';
  }
}

// Export singleton instance
export const networkHandler = NetworkHandler.getInstance();

// Convenience functions
export const withRetry = <T>(
  operation: () => Promise<T>, 
  options?: RetryOptions
) => networkHandler.withRetry(operation, options);

export const enhancedFetch = (
  url: string, 
  options?: RequestInit, 
  retryOptions?: RetryOptions
) => networkHandler.fetch(url, options, retryOptions);

export const isNetworkConnected = () => networkHandler.isNetworkConnected();

export const onConnectionChange = (listener: (isConnected: boolean) => void) => 
  networkHandler.onConnectionChange(listener);

export const getUserFriendlyErrorMessage = (error: NetworkError) => 
  networkHandler.getUserFriendlyErrorMessage(error); 