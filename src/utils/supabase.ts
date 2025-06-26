import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration
const supabaseUrl = 'https://immoihaxapjuwboinwiy.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbW9paGF4YXBqdXdib2lud2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjIxMDcsImV4cCI6MjA2NjQ5ODEwN30.xINbvLTVELjzA7lZdq87vouxb0VJ4nFtw3RTpJAn_ps'; // Replace with your Supabase anon key

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
      const transformedCounters = counters.map(counter => ({
        ...transformCounterToDb(counter),
        user_id: userId,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('counters')
        .upsert(transformedCounters);
      
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
      
      const transformedData = data ? data.map(transformCounterFromDb) : null;
      return { data: transformedData, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sync sessions to Supabase
  syncSessions: async (sessions: any[], userId: string) => {
    try {
      const transformedSessions = sessions.map(session => ({
        ...transformSessionToDb(session),
        user_id: userId,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('sessions')
        .upsert(transformedSessions);
      
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
      
      const transformedData = data ? data.map(transformSessionFromDb) : null;
      return { data: transformedData, error };
    } catch (error) {
      return { data: null, error };
    }
  },
};

export default supabase; 