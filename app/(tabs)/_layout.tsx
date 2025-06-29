import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/utils/theme';
import { COLORS } from '../../src/types';
import { accessibilityManager, getButtonA11yProps } from '../../src/utils/accessibility';
import GlobalSearch from '../../src/components/GlobalSearch';
import useGlobalSearch from '../../src/utils/useGlobalSearch';
import { GlobalActionProvider } from '../../src/contexts/GlobalActionContext';

export default function TabLayout() {
  const { isDark } = useAppTheme();
  const { isSearchVisible, showSearch, hideSearch } = useGlobalSearch();
  
  // Get accessibility-aware colors
  const accessibleColors = accessibilityManager.getAccessibleColors(isDark ? 'dark' : 'light');

  const SearchButton = () => (
    <TouchableOpacity
      style={{
        marginRight: 16,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}
      onPress={showSearch}
      {...getButtonA11yProps(
        'Global Search',
        'Search for features, screens, settings, and more throughout the app',
        false
      )}
    >
      <Ionicons name="search" size={20} color={COLORS.neutral.white} />
    </TouchableOpacity>
  );

  return (
    <GlobalActionProvider>
      <View style={{ flex: 1 }}>
        <GlobalSearch
          visible={isSearchVisible}
          onClose={hideSearch}
        />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary.green,
        tabBarInactiveTintColor: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500,
        tabBarStyle: {
          backgroundColor: accessibleColors.surface,
          borderTopColor: accessibleColors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarAccessibilityLabel: 'Main navigation',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Counter',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary.green,
          },
          headerTintColor: COLORS.neutral.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: SearchButton,
          tabBarAccessibilityLabel: 'Counter tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calculator' : 'calculator-outline'}
              size={24}
              color={color}
              accessibilityLabel={`Counter tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('Counter', false, 0, 4)
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: 'Prayer Times',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary.teal,
          },
          headerTintColor: COLORS.neutral.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: SearchButton,
          tabBarAccessibilityLabel: 'Prayer Times tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={24}
              color={color}
              accessibilityLabel={`Prayer Times tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('Prayer Times', false, 1, 4)
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary.pink,
          },
          headerTintColor: COLORS.neutral.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: SearchButton,
          tabBarAccessibilityLabel: 'History tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={24}
              color={color}
              accessibilityLabel={`History tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('History', false, 2, 4)
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary.purple,
          },
          headerTintColor: COLORS.neutral.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: SearchButton,
          tabBarAccessibilityLabel: 'Settings tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
              accessibilityLabel={`Settings tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('Settings', false, 3, 4)
        }}
      />
    </Tabs>
    </View>
    </GlobalActionProvider>
  );
} 