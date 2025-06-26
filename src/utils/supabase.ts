import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key

// Custom storage implementation for different platforms
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } else {
      // Use SecureStore for mobile
      return SecureStore.getItemAsync(key);
    }
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      // Use SecureStore for mobile
      SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      // Use SecureStore for mobile
      SecureStore.deleteItemAsync(key);
    }
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Authentication helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Get current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions for syncing Tasbeeh data
export const database = {
  // Sync counters to Supabase
  syncCounters: async (counters: any[], userId: string) => {
    try {
      const { data, error } = await supabase
        .from('counters')
        .upsert(
          counters.map(counter => ({
            ...counter,
            user_id: userId,
            updated_at: new Date().toISOString(),
          }))
        );
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get counters from Supabase
  getCounters: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('counters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sync sessions to Supabase
  syncSessions: async (sessions: any[], userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .upsert(
          sessions.map(session => ({
            ...session,
            user_id: userId,
            updated_at: new Date().toISOString(),
          }))
        );
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get sessions from Supabase
  getSessions: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },
};

export default supabase; 