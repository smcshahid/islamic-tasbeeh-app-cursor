export interface Counter {
  id: string;
  name: string;
  count: number;
  target?: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  counterId: string;
  counterName: string;
  startTime: string;
  endTime?: string;
  startCount: number;
  endCount: number;
  duration: number; // in seconds
  totalCounts: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ar';
  hapticFeedback: boolean;
  notifications: boolean;
  autoSync: boolean;
  defaultCounter?: string;
}

export interface User {
  id: string;
  email?: string;
  isGuest: boolean;
  lastSyncAt?: string;
}

export interface AppState {
  counters: Counter[];
  sessions: Session[];
  settings: Settings;
  user: User | null;
  activeSession: Session | null;
  currentCounter: Counter | null;
  hasLoadedFromStorage: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TasbeehContextType extends AppState {
  // Counter actions
  createCounter: (name: string, color?: string, target?: number) => Promise<void>;
  updateCounter: (id: string, updates: Partial<Counter>) => Promise<void>;
  deleteCounter: (id: string) => Promise<void>;
  incrementCounter: (id: string) => Promise<void>;
  resetCounter: (id: string) => Promise<void>;
  setCurrentCounter: (counter: Counter) => void;
  
  // Session actions
  startSession: (counterId: string) => Promise<void>;
  endSession: () => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  
  // Storage actions
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  
  // Cloud sync actions
  loadFromCloud: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
  
  // Auth actions
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

export const COLORS = {
  primary: {
    green: '#22C55E',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F97316',
    pink: '#EC4899',
    teal: '#14B8A6',
    indigo: '#6366F1',
    emerald: '#10B981',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',
  },
} as const;

export type ColorKey = keyof typeof COLORS.primary; 