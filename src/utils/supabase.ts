import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { secureLogger } from './secureLogger';
import { withRetry, getUserFriendlyErrorMessage, NetworkError } from './networkHandler';
import { APP_CONSTANTS } from '../constants/app';

// Security: Use environment variables instead of hardcoded credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced secure storage implementation with size limits for SecureStore
const SecureStorageAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web (consider using secure httpOnly cookies in production)
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      } else {
        // Use SecureStore only for small, sensitive auth tokens
        // Use AsyncStorage for larger session data
        if (key.includes('auth') || key.includes('token')) {
          return await SecureStore.getItemAsync(key);
        } else {
          return await AsyncStorage.getItem(key);
        }
      }
    } catch (error) {
      // Fallback to AsyncStorage if SecureStore fails
      secureLog('warn', 'SecureStore access failed, falling back to AsyncStorage', { error: error instanceof Error ? error.message : 'Unknown error' });
      return await AsyncStorage.getItem(key);
    }
  },
  
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } else {
        // Use SecureStore only for small, sensitive auth tokens (< 2048 bytes)
        // Use AsyncStorage for larger session data
        if ((key.includes('auth') || key.includes('token')) && value.length < 2048) {
          await SecureStore.setItemAsync(key, value);
        } else {
          await AsyncStorage.setItem(key, value);
        }
      }
    } catch (error) {
      // Fallback to AsyncStorage if SecureStore fails
      secureLog('warn', 'SecureStore access failed, falling back to AsyncStorage', { error: error instanceof Error ? error.message : 'Unknown error' });
      await AsyncStorage.setItem(key, value);
    }
  },
  
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } else {
        // Try both SecureStore and AsyncStorage for removal
        if (key.includes('auth') || key.includes('token')) {
          try {
            await SecureStore.deleteItemAsync(key);
          } catch {
            // Item might not exist in SecureStore, ignore error
          }
        }
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      // Fallback to AsyncStorage if SecureStore fails
      secureLog('warn', 'SecureStore access failed, falling back to AsyncStorage', { error: error instanceof Error ? error.message : 'Unknown error' });
      await AsyncStorage.removeItem(key);
    }
  },
};

// Create Supabase client with enhanced security and compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Use PKCE only if WebCrypto is available, otherwise fall back to implicit flow
    flowType: (typeof crypto !== 'undefined' && crypto.subtle) ? 'pkce' : 'implicit',
  },
  global: {
    headers: {
      // Add security headers
      'X-Client-Info': 'tasbeeh-app',
    },
  },
});

// Input validation helpers
const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  password: (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (password.length > 128) {
      return { isValid: false, message: 'Password must be less than 128 characters' };
    }
    return { isValid: true };
  },
  
  string: (input: string, maxLength: number = 1000): string => {
    // Basic XSS prevention
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/[<>]/g, '')
               .substring(0, maxLength)
               .trim();
  }
};

// Secure logging function
const secureLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  secureLogger[level](message, data, 'Supabase');
};

// Network wrapper for Supabase operations with retry logic
const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  customRetryOptions?: any
): Promise<T> => {
  const retryOptions = {
    maxRetries: APP_CONSTANTS.NETWORK.RETRY.MAX_ATTEMPTS,
    initialDelay: APP_CONSTANTS.NETWORK.RETRY.INITIAL_DELAY,
    maxDelay: APP_CONSTANTS.NETWORK.RETRY.MAX_DELAY,
    backoffFactor: APP_CONSTANTS.NETWORK.RETRY.BACKOFF_FACTOR,
    retryCondition: (error: any) => {
      // Don't retry client authentication errors (4xx) except timeouts and rate limits
      if (error?.status) {
        // Retry on server errors (5xx), timeouts (408), and rate limits (429)
        return error.status >= 500 || error.status === 408 || error.status === 429;
      }
      
      // Retry on network-related errors
      if (error?.message) {
        const retryableMessages = [
          'network request failed',
          'fetch failed', 
          'connection refused',
          'timeout',
          'no network connection',
          'ECONNRESET',
          'ENOTFOUND',
          'ECONNREFUSED'
        ];
        
        return retryableMessages.some(msg => 
          error.message.toLowerCase().includes(msg.toLowerCase())
        );
      }
      
      return false;
    },
    ...customRetryOptions
  };

  try {
    return await withRetry(operation, retryOptions);
  } catch (error: any) {
    // Enhanced error handling for Supabase-specific errors
    if (error?.message || error?.status) {
      const networkError = error as NetworkError;
      const friendlyMessage = getUserFriendlyErrorMessage(networkError);
      
      secureLog('error', `${operationName} failed after retries`, {
        originalError: error.message,
        friendlyMessage,
        retryCount: error.retryCount || 0
      });
      
      // Return Supabase-compatible error format with enhanced message
      throw {
        ...error,
        message: friendlyMessage,
        isNetworkError: true
      };
    }
    
    throw error;
  }
};

// Legacy secure logging function for backward compatibility
const legacySecureLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
  const enableLogging = process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true';
  
  if (!isProduction || enableLogging) {
    // Sanitize data to prevent sensitive info logging
    const sanitizedData = data ? JSON.stringify(data).replace(/("password":|"token":|"key":)"[^"]*"/g, '$1"[REDACTED]"') : undefined;
    
    switch (level) {
      case 'info':
        console.info(`[TASBEEH] ${message}`, sanitizedData);
        break;
      case 'warn':
        console.warn(`[TASBEEH] ${message}`, sanitizedData);
        break;
      case 'error':
        console.error(`[TASBEEH] ${message}`, sanitizedData);
        break;
    }
  }
};

// Enhanced authentication helper functions with security improvements
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    try {
      // Input validation
      if (!email || !email.trim()) {
        return { data: null, error: { message: 'Email is required' } };
      }
      
      if (!password || !password.trim()) {
        return { data: null, error: { message: 'Password is required' } };
      }
      
      if (!validateInput.email(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
      
      const passwordValidation = validateInput.password(password);
      if (!passwordValidation.isValid) {
        return { data: null, error: { message: passwordValidation.message || 'Invalid password' } };
      }

      secureLog('info', 'Attempting sign up', { email: email.substring(0, 3) + '***' });

      const { data, error } = await executeWithRetry(
        () => supabase.auth.signUp({
          email: validateInput.string(email.trim(), 254),
          password: password,
        }),
        'Sign Up',
        { 
          maxRetries: 2, // Fewer retries for auth operations
          retryCondition: (error: any) => {
            // Only retry on network errors, not auth errors
            return error?.message && (
              error.message.includes('network') ||
              error.message.includes('timeout') ||
              error.message.includes('connection')
            );
          }
        }
      );
      
      if (error) {
        secureLog('error', 'Sign up failed', { 
          error: error.message, 
          code: error.status,
          email: email.substring(0, 3) + '***'
        });
        
        // Handle specific Supabase errors
        if (error.message?.includes('User already registered')) {
          return { data, error: { message: 'An account with this email already exists. Please sign in instead.' } };
        } else if (error.message?.includes('Password should be')) {
          return { data, error: { message: 'Password does not meet requirements. Please ensure it is at least 8 characters with uppercase, lowercase, and numbers.' } };
        } else if (error.message?.includes('Email address') && error.message?.includes('invalid')) {
          return { data, error: { message: 'Please enter a valid email address.' } };
        } else if (error.message?.includes('Signup is disabled')) {
          return { data, error: { message: 'Account creation is currently disabled. Please contact support.' } };
        }
        
        return { data, error: { message: error.message } };
      }
      
      // Enhanced success logging with user state analysis
      const userCreated = data?.user?.id;
      const userConfirmed = data?.user?.email_confirmed_at;
      const sessionExists = data?.session?.access_token;
      
      secureLog('info', 'Sign up response analysis', { 
        userId: userCreated ? 'present' : 'missing',
        emailConfirmed: userConfirmed ? 'confirmed' : 'unconfirmed',
        sessionCreated: sessionExists ? 'present' : 'missing',
        userRole: data?.user?.role || 'none'
      });
      
      // Return enhanced response with user state information
      return { 
        data: data || null, 
        error: null,
        userState: {
          needsConfirmation: !userConfirmed && userCreated,
          hasSession: !!sessionExists
        }
      };
    } catch (error: any) {
      secureLog('error', 'Sign up error', error);
      return { data: null, error: { message: error?.message || 'An unexpected error occurred during account creation' } };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      // Input validation
      if (!email || !email.trim()) {
        return { data: null, error: { message: 'Email is required' } };
      }
      
      if (!password || !password.trim()) {
        return { data: null, error: { message: 'Password is required' } };
      }
      
      if (!validateInput.email(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
      
      if (password.length < 6) {
        return { data: null, error: { message: 'Password must be at least 6 characters' } };
      }

      secureLog('info', 'Attempting sign in', { email: email.substring(0, 3) + '***' });

      const { data, error } = await executeWithRetry(
        () => supabase.auth.signInWithPassword({
          email: validateInput.string(email.trim(), 254),
          password: password,
        }),
        'Sign In',
        { 
          maxRetries: 2, // Fewer retries for auth operations
          retryCondition: (error: any) => {
            // Only retry on network errors, not auth errors
            return error?.message && (
              error.message.includes('network') ||
              error.message.includes('timeout') ||
              error.message.includes('connection')
            );
          }
        }
      );
      
      if (error) {
        secureLog('error', 'Sign in failed', { 
          error: error.message, 
          code: error.status,
          email: email.substring(0, 3) + '***'
        });
        
        // Enhanced error handling for common Supabase scenarios
        if (error.message?.includes('Invalid login credentials')) {
          // Return more helpful error message with actionable guidance
          return { 
            data, 
            error: { 
              message: 'Sign in failed. This could be due to:\n\n• No account with this email exists\n• Incorrect password\n• Unconfirmed email address\n\nSolutions:\n• Double-check your email address\n• Try signing up if you don\'t have an account\n• Check your inbox for a verification email\n• Use "Forgot Password" if you have an account',
              type: 'INVALID_CREDENTIALS'
            } 
          };
        } else if (error.message?.includes('Email not confirmed')) {
          return { 
            data, 
            error: { 
              message: 'Please check your email and click the verification link before signing in. If you didn\'t receive an email, try signing up again.' 
            } 
          };
        } else if (error.message?.includes('Too many requests')) {
          return { 
            data, 
            error: { 
              message: 'Too many sign-in attempts. Please wait 5 minutes before trying again.' 
            } 
          };
        } else if (error.message?.includes('Signup is disabled')) {
          return { 
            data, 
            error: { 
              message: 'Account access is currently disabled. Please contact support.' 
            } 
          };
        } else if (error.message?.includes('Email address') && error.message?.includes('invalid')) {
          return { 
            data, 
            error: { 
              message: 'Please enter a valid email address.' 
            } 
          };
        }
        
        return { data, error: { message: error.message } };
      }
      
      // Enhanced success logging
      const sessionExists = data?.session?.access_token;
      const userConfirmed = data?.user?.email_confirmed_at;
      
      secureLog('info', 'Sign in successful', { 
        userId: data?.user?.id,
        hasSession: sessionExists ? 'yes' : 'no',
        emailConfirmed: userConfirmed ? 'yes' : 'no'
      });
      
      return { data: data || null, error: null };
    } catch (error: any) {
      secureLog('error', 'Sign in error', error);
      return { data: null, error: { message: error?.message || 'An unexpected error occurred during sign in' } };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await executeWithRetry(
        () => supabase.auth.signOut(),
        'Sign Out',
        { maxRetries: 1 } // Minimal retries for sign out
      );
      return { error };
    } catch (error) {
      secureLog('error', 'Sign out error', error);
      return { error: { message: 'Failed to sign out' } };
    }
  },

  // Get current session with improved error handling and retry logic
  getSession: async () => {
    try {
      const { data, error } = await executeWithRetry(
        () => supabase.auth.getSession(),
        'Get Session',
        { 
          maxRetries: 2,
          retryCondition: (error: any) => {
            // Retry on network errors, but not authentication errors
            return error?.message && (
              error.message.includes('network') ||
              error.message.includes('timeout') ||
              error.message.includes('connection')
            );
          }
        }
      );
      
      if (error) {
        secureLog('error', 'Get session error', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      secureLog('error', 'Get session error', error);
      return { data: null, error: { message: 'Failed to get session' } };
    }
  },

  // Get current user
  getUser: async () => {
    try {
      const { data, error } = await executeWithRetry(
        () => supabase.auth.getUser(),
        'Get User',
        { 
          maxRetries: 2,
          retryCondition: (error: any) => {
            // Retry on network errors, but not authentication errors
            return error?.message && (
              error.message.includes('network') ||
              error.message.includes('timeout') ||
              error.message.includes('connection')
            );
          }
        }
      );
      return { data, error };
    } catch (error) {
      secureLog('error', 'Get user error', error);
      return { data: null, error: { message: 'Failed to get user' } };
    }
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      secureLog('info', `Auth state changed: ${event}`, { 
        hasSession: !!session,
        userId: session?.user?.id || 'none',
        emailConfirmed: session?.user?.email_confirmed_at ? 'yes' : 'no'
      });
      callback(event, session);
    });
  },

  // Diagnostic function to help debug authentication issues
  diagnoseAuthIssue: async (email: string) => {
    try {
      secureLog('info', 'Running auth diagnostics', { email: email.substring(0, 3) + '***' });
      
      // Try to get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Try a simple sign-up to test if it works
      const testResult = await supabase.auth.signUp({
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });

      const diagnostics = {
        environment: {
          isWeb: Platform.OS === 'web',
          hasWebCrypto: typeof crypto !== 'undefined' && !!crypto.subtle,
          flowType: (typeof crypto !== 'undefined' && crypto.subtle) ? 'pkce' : 'implicit',
          userAgent: Platform.OS
        },
        supabaseConfig: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          urlValid: supabaseUrl?.includes('supabase.co') || supabaseUrl?.includes('localhost'),
        },
        session: {
          hasSession: !!sessionData?.session,
          sessionError: sessionError?.message || 'none',
          userId: sessionData?.session?.user?.id || 'none'
        },
        signUpTest: {
          success: !testResult.error,
          error: testResult.error?.message || 'none',
          userCreated: !!testResult.data?.user,
          sessionCreated: !!testResult.data?.session,
          needsConfirmation: !!testResult.data?.user && !testResult.data?.session
        }
      };

      secureLog('info', 'Auth diagnostics completed', diagnostics);
      return diagnostics;
    } catch (error) {
      secureLog('error', 'Auth diagnostics failed', error);
      return { error: 'Diagnostics failed' };
    }
  },
};

// Helper functions to transform field names between camelCase and snake_case
const transformCounterToDb = (counter: any) => ({
  id: counter.id,
  name: counter.name,
  count: counter.count,
  target: counter.target,
  color: counter.color,
  created_at: counter.createdAt,
  updated_at: counter.updatedAt,
});

const transformCounterFromDb = (counter: any) => ({
  id: counter.id,
  name: counter.name,
  count: counter.count,
  target: counter.target,
  color: counter.color,
  createdAt: counter.created_at,
  updatedAt: counter.updated_at,
});

const transformSessionToDb = (session: any) => ({
  id: session.id,
  counter_id: session.counterId,
  counter_name: session.counterName,
  start_time: session.startTime,
  end_time: session.endTime,
  start_count: session.startCount,
  end_count: session.endCount,
  duration: session.duration,
  total_counts: session.totalCounts,
  created_at: session.createdAt || new Date().toISOString(),
  updated_at: session.updatedAt || new Date().toISOString(),
});

const transformSessionFromDb = (session: any) => ({
  id: session.id,
  counterId: session.counter_id,
  counterName: session.counter_name,
  startTime: session.start_time,
  endTime: session.end_time,
  startCount: session.start_count,
  endCount: session.end_count,
  duration: session.duration,
  totalCounts: session.total_counts,
  createdAt: session.created_at,
  updatedAt: session.updated_at,
});

// Database helper functions for syncing Tasbeeh data
export const database = {
  // Sync counters to Supabase
  syncCounters: async (counters: any[], userId: string) => {
    try {
      // Trust that the caller has verified authentication - let Supabase handle auth at request level
      const transformedCounters = counters.map(counter => ({
        ...transformCounterToDb(counter),
        user_id: userId,
        updated_at: new Date().toISOString(),
      }));

      const result = await executeWithRetry(
        async () => {
          return await supabase
            .from('counters')
            .upsert(transformedCounters);
        },
        'Sync Counters'
      );
      
      const { data, error } = result;
      
      // Handle specific authentication errors
      if (error) {
        secureLog('error', 'Sync counters error', { error: error.message, code: error.code });
        
        // Check for authentication-related errors
        if (error.message?.includes('JWT') || error.message?.includes('not authenticated') || error.code === 'PGRST301') {
          return { data: null, error: { message: 'User not authenticated' } };
        }
      }
      
      return { data, error };
    } catch (error: any) {
      secureLog('error', 'Sync counters exception', error);
      return { data: null, error: { message: error?.message || 'Failed to sync counters' } };
    }
  },

  // Get counters from Supabase
  getCounters: async (userId: string) => {
    try {
      // Trust that the caller has verified authentication - let Supabase handle auth at request level
      const result = await executeWithRetry(
        async () => {
          return await supabase
            .from('counters')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        },
        'Get Counters'
      );
      
      const { data, error } = result;
      
      // Handle specific authentication errors
      if (error) {
        secureLog('error', 'Get counters error', { error: error.message, code: error.code });
        
        // Check for authentication-related errors
        if (error.message?.includes('JWT') || error.message?.includes('not authenticated') || error.code === 'PGRST301') {
          return { data: null, error: { message: 'User not authenticated' } };
        }
      }
      
      const transformedData = data ? data.map(transformCounterFromDb) : null;
      return { data: transformedData, error };
    } catch (error: any) {
      secureLog('error', 'Get counters exception', error);
      return { data: null, error: { message: error?.message || 'Failed to get counters' } };
    }
  },

  // Sync sessions to Supabase
  syncSessions: async (sessions: any[], userId: string) => {
    try {
      // Trust that the caller has verified authentication - let Supabase handle auth at request level
      const transformedSessions = sessions.map(session => ({
        ...transformSessionToDb(session),
        user_id: userId,
        updated_at: new Date().toISOString(),
      }));

      const result = await executeWithRetry(
        async () => {
          return await supabase
            .from('sessions')
            .upsert(transformedSessions);
        },
        'Sync Sessions'
      );
      
      const { data, error } = result;
      
      // Handle specific authentication errors
      if (error) {
        secureLog('error', 'Sync sessions error', { error: error.message, code: error.code });
        
        // Check for authentication-related errors
        if (error.message?.includes('JWT') || error.message?.includes('not authenticated') || error.code === 'PGRST301') {
          return { data: null, error: { message: 'User not authenticated' } };
        }
      }
      
      return { data, error };
    } catch (error: any) {
      secureLog('error', 'Sync sessions exception', error);
      return { data: null, error: { message: error?.message || 'Failed to sync sessions' } };
    }
  },

  // Get sessions from Supabase
  getSessions: async (userId: string) => {
    try {
      // Trust that the caller has verified authentication - let Supabase handle auth at request level
      const result = await executeWithRetry(
        async () => {
          return await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: false });
        },
        'Get Sessions'
      );
      
      const { data, error } = result;
      
      // Handle specific authentication errors
      if (error) {
        secureLog('error', 'Get sessions error', { error: error.message, code: error.code });
        
        // Check for authentication-related errors
        if (error.message?.includes('JWT') || error.message?.includes('not authenticated') || error.code === 'PGRST301') {
          return { data: null, error: { message: 'User not authenticated' } };
        }
      }
      
      const transformedData = data ? data.map(transformSessionFromDb) : null;
      return { data: transformedData, error };
    } catch (error: any) {
      secureLog('error', 'Get sessions exception', error);
      return { data: null, error: { message: error?.message || 'Failed to get sessions' } };
    }
  },
};

export default supabase; 