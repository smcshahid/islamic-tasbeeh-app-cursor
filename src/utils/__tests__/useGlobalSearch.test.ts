import { renderHook, act } from '@testing-library/react-native';
import useGlobalSearch from '../useGlobalSearch';

describe('useGlobalSearch', () => {
  it('should initialize with search hidden', () => {
    const { result } = renderHook(() => useGlobalSearch());
    
    expect(result.current.isSearchVisible).toBe(false);
  });

  it('should show search when showSearch is called', () => {
    const { result } = renderHook(() => useGlobalSearch());
    
    act(() => {
      result.current.showSearch();
    });
    
    expect(result.current.isSearchVisible).toBe(true);
  });

  it('should hide search when hideSearch is called', () => {
    const { result } = renderHook(() => useGlobalSearch());
    
    // First show the search
    act(() => {
      result.current.showSearch();
    });
    
    expect(result.current.isSearchVisible).toBe(true);
    
    // Then hide it
    act(() => {
      result.current.hideSearch();
    });
    
    expect(result.current.isSearchVisible).toBe(false);
  });

  it('should toggle search visibility', () => {
    const { result } = renderHook(() => useGlobalSearch());
    
    // Initially hidden
    expect(result.current.isSearchVisible).toBe(false);
    
    // Toggle to show
    act(() => {
      result.current.toggleSearch();
    });
    
    expect(result.current.isSearchVisible).toBe(true);
    
    // Toggle to hide
    act(() => {
      result.current.toggleSearch();
    });
    
    expect(result.current.isSearchVisible).toBe(false);
  });

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() => useGlobalSearch());
    
    const initialShowSearch = result.current.showSearch;
    const initialHideSearch = result.current.hideSearch;
    const initialToggleSearch = result.current.toggleSearch;
    
    rerender({});
    
    expect(result.current.showSearch).toBe(initialShowSearch);
    expect(result.current.hideSearch).toBe(initialHideSearch);
    expect(result.current.toggleSearch).toBe(initialToggleSearch);
  });
}); 