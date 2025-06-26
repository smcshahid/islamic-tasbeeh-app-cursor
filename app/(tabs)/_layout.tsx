import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/utils/theme';
import { COLORS } from '../../src/types';
import { accessibilityManager } from '../../src/utils/accessibility';

export default function TabLayout() {
  const { isDark } = useAppTheme();
  
  // Get accessibility-aware colors
  const accessibleColors = accessibilityManager.getAccessibleColors(isDark ? 'dark' : 'light');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          tabBarAccessibilityLabel: 'Counter tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calculator' : 'calculator-outline'}
              size={24}
              color={color}
              accessibilityLabel={`Counter tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('Counter', false, 0, 3)
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarAccessibilityLabel: 'History tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={24}
              color={color}
              accessibilityLabel={`History tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('History', false, 1, 3)
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
              accessibilityLabel={`Settings tab${focused ? ', selected' : ''}`}
            />
          ),
          ...accessibilityManager.getTabAccessibilityProps('Settings', false, 2, 3)
        }}
      />
    </Tabs>
  );
} 