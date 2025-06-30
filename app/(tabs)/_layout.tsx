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
  const { colors } = useAppTheme();
  const { isSearchVisible, showSearch, hideSearch } = useGlobalSearch();

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
      <Ionicons name="search" size={20} color={colors.text.onPrimary} />
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
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
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.text.onPrimary,
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
          ...accessibilityManager.getTabAccessibilityProps('Counter', false, 0, 5)
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: 'Prayer Times',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.secondary,
          },
          headerTintColor: colors.text.onSecondary,
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
          ...accessibilityManager.getTabAccessibilityProps('Prayer Times', false, 1, 5)
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'Quran',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.islamic.navy,
          },
          headerTintColor: colors.text.onPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: SearchButton,
          tabBarAccessibilityLabel: 'Quran tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={24}
              color={color}
              accessibilityLabel={`Quran tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('Quran', false, 2, 5)
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.accent,
          },
          headerTintColor: colors.text.onAccent,
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
          ...accessibilityManager.getTabAccessibilityProps('History', false, 3, 5)
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.islamic.navy,
          },
          headerTintColor: colors.text.onPrimary,
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
          ...accessibilityManager.getTabAccessibilityProps('Settings', false, 4, 5)
        }}
      />
    </Tabs>
    </View>
    </GlobalActionProvider>
  );
} 