import { useState, useCallback } from 'react';

export interface UseGlobalSearchReturn {
  isSearchVisible: boolean;
  showSearch: () => void;
  hideSearch: () => void;
  toggleSearch: () => void;
}

export const useGlobalSearch = (): UseGlobalSearchReturn => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const showSearch = useCallback(() => {
    setIsSearchVisible(true);
  }, []);

  const hideSearch = useCallback(() => {
    setIsSearchVisible(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchVisible(prev => !prev);
  }, []);

  return {
    isSearchVisible,
    showSearch,
    hideSearch,
    toggleSearch,
  };
};

export default useGlobalSearch; 