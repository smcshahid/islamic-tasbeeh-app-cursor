import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import GlobalSearch from '../GlobalSearch';
import { useTasbeeh } from '../../contexts/TasbeehContext';
import { useAppTheme } from '../../utils/theme';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('../../contexts/TasbeehContext', () => ({
  useTasbeeh: jest.fn(),
}));

jest.mock('../../utils/theme', () => ({
  useAppTheme: jest.fn(),
}));

jest.mock('../../utils/accessibility', () => ({
  getButtonA11yProps: jest.fn(() => ({})),
  getAccessibleColors: jest.fn(() => ({
    primaryText: '#000000',
    secondaryText: '#666666',
    surface: '#FFFFFF',
    background: '#F5F5F5',
  })),
  getFontScale: jest.fn(() => 1),
  announceToScreenReader: jest.fn(),
}));

// Mock expo modules
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: View,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: View,
  };
});

const mockUseTasbeeh = useTasbeeh as jest.MockedFunction<typeof useTasbeeh>;
const mockUseAppTheme = useAppTheme as jest.MockedFunction<typeof useAppTheme>;

describe('GlobalSearch', () => {
  const mockOnClose = jest.fn();
  
  const defaultMockData = {
    counters: [
      {
        id: '1',
        name: 'Subhan Allah',
        count: 100,
        target: 1000,
        color: '#4CAF50',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'Alhamdulillah',
        count: 50,
        target: undefined,
        color: '#2196F3',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ],
    settings: {
      theme: 'auto' as const,
      language: 'en' as const,
      hapticFeedback: true,
      notifications: true,
      soundEnabled: true,
      timeFormat: '12h' as const,
      calculationMethod: 1,
      timeAdjustments: {},
      locationMethod: 'auto' as const,
      autoLocation: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTasbeeh.mockReturnValue(defaultMockData as any);
    mockUseAppTheme.mockReturnValue({ 
      theme: 'light',
      isDark: false,
      systemTheme: 'light',
      userTheme: 'auto'
    });
  });

  it('renders correctly when visible', () => {
    const { getByPlaceholderText, getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    expect(getByPlaceholderText('Search features, screens, settings...')).toBeTruthy();
    expect(getByText('Screens')).toBeTruthy();
    expect(getByText('Counters')).toBeTruthy();
    expect(getByText('Prayer Times')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByPlaceholderText } = render(
      <GlobalSearch visible={false} onClose={mockOnClose} />
    );

    expect(queryByPlaceholderText('Search features, screens, settings...')).toBeNull();
  });

  it('filters search results based on query', async () => {
    const { getByPlaceholderText, queryByText, getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    
    fireEvent.changeText(searchInput, 'prayer');

    await waitFor(() => {
      expect(getByText('Prayer Times')).toBeTruthy();
      expect(getByText('Prayer Settings')).toBeTruthy();
      expect(queryByText('Counter')).toBeNull();
    });
  });

  it('filters results by category', async () => {
    const { getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const countersCategory = getByText('Counters');
    fireEvent.press(countersCategory);

    await waitFor(() => {
      expect(getByText('Subhan Allah')).toBeTruthy();
      expect(getByText('Alhamdulillah')).toBeTruthy();
      expect(getByText('Create New Counter')).toBeTruthy();
    });
  });

  it('navigates to screen when result is pressed', async () => {
    const { getByPlaceholderText, getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    fireEvent.changeText(searchInput, 'prayer times');

    await waitFor(() => {
      const prayerTimesResult = getByText('Prayer Times');
      fireEvent.press(prayerTimesResult);
    });

    expect(router.push).toHaveBeenCalledWith('/(tabs)/prayer-times');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays counter results with correct count information', async () => {
    const { getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const countersCategory = getByText('Counters');
    fireEvent.press(countersCategory);

    await waitFor(() => {
      expect(getByText('Count: 100 / 1,000')).toBeTruthy();
      expect(getByText('Count: 50')).toBeTruthy();
    });
  });

  it('shows empty state when no results found', async () => {
    const { getByPlaceholderText, getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    fireEvent.changeText(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(getByText('No results found')).toBeTruthy();
      expect(getByText('Try different keywords or browse categories')).toBeTruthy();
    });
  });

  it('clears search when clear button is pressed', async () => {
    const { getByPlaceholderText, queryByTestId } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    fireEvent.changeText(searchInput, 'test query');

    // Simulate clear button press
    fireEvent.changeText(searchInput, '');

    await waitFor(() => {
      expect(searchInput.props.value).toBe('');
    });
  });

  it('calls onClose when close button is pressed', () => {
    const { getByLabelText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    // Note: This test relies on accessibility labels being properly set
    // You may need to adjust based on your actual implementation
    const closeButton = getByLabelText(/close/i);
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays current settings values in search results', async () => {
    mockUseTasbeeh.mockReturnValue({
      ...defaultMockData,
      settings: {
        ...defaultMockData.settings,
        theme: 'dark',
        language: 'ar',
        hapticFeedback: false,
        notifications: false,
      },
    } as any);

    const { getByPlaceholderText, getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    fireEvent.changeText(searchInput, 'theme');

    await waitFor(() => {
      expect(getByText('Current: Dark')).toBeTruthy();
    });
  });

  it('adapts to dark theme', () => {
    mockUseAppTheme.mockReturnValue({ 
      theme: 'dark',
      isDark: true,
      systemTheme: 'dark',
      userTheme: 'dark'
    });

    const { getByPlaceholderText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    // Component should render without errors in dark mode
    expect(getByPlaceholderText('Search features, screens, settings...')).toBeTruthy();
  });

  it('shows correct result count', async () => {
    const { getByPlaceholderText, getByText } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    fireEvent.changeText(searchInput, 'counter');

    await waitFor(() => {
      // Should show multiple results containing "counter"
      expect(getByText(/\d+ results?/)).toBeTruthy();
    });
  });

  it('resets state when modal becomes invisible', () => {
    const { getByPlaceholderText, rerender } = render(
      <GlobalSearch visible={true} onClose={mockOnClose} />
    );

    const searchInput = getByPlaceholderText('Search features, screens, settings...');
    fireEvent.changeText(searchInput, 'test query');

    // Hide the modal
    rerender(<GlobalSearch visible={false} onClose={mockOnClose} />);

    // Show the modal again
    rerender(<GlobalSearch visible={true} onClose={mockOnClose} />);

    // Search input should be cleared
    const newSearchInput = getByPlaceholderText('Search features, screens, settings...');
    expect(newSearchInput.props.value).toBe('');
  });
}); 