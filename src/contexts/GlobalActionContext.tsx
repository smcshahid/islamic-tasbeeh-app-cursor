import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ActionType = 
  | 'setCounterTarget'
  | 'resetCounter' 
  | 'createNewCounter'
  | 'openCounterSelector'
  | 'openPrayerSettings'
  | 'openPrayerNotifications'
  | 'adjustPrayerTimes'
  | 'openCalculationMethod'
  | 'openAchievements'
  | 'openSessionHistory'
  | 'openStatistics'
  | 'switchToCounter';

export interface PendingAction {
  type: ActionType;
  data?: any;
  screen: string;
}

interface GlobalActionContextType {
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;
  clearPendingAction: () => void;
  executePendingAction: (currentScreen: string) => boolean;
}

const GlobalActionContext = createContext<GlobalActionContextType | undefined>(undefined);

export const useGlobalAction = () => {
  const context = useContext(GlobalActionContext);
  if (!context) {
    throw new Error('useGlobalAction must be used within a GlobalActionProvider');
  }
  return context;
};

interface GlobalActionProviderProps {
  children: ReactNode;
}

export const GlobalActionProvider: React.FC<GlobalActionProviderProps> = ({ children }) => {
  const [pendingAction, setPendingActionState] = useState<PendingAction | null>(null);

  const setPendingAction = (action: PendingAction | null) => {
    setPendingActionState(action);
  };

  const clearPendingAction = () => {
    setPendingActionState(null);
  };

  const executePendingAction = (currentScreen: string): boolean => {
    if (!pendingAction || pendingAction.screen !== currentScreen) {
      return false;
    }

    // Action will be executed by the specific screen
    // Return true to indicate there was a pending action
    return true;
  };

  return (
    <GlobalActionContext.Provider
      value={{
        pendingAction,
        setPendingAction,
        clearPendingAction,
        executePendingAction,
      }}
    >
      {children}
    </GlobalActionContext.Provider>
  );
}; 