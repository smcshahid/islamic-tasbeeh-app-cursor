# 🎨 Theme System Migration Guide

## Overview

The Tasbeeh app now features a comprehensive theming system with four beautiful Islamic-inspired themes. This guide will help developers understand how to use and extend the theme system.

## 🌟 Available Themes

### 1. **Auto Theme** 
- Follows system light/dark preference
- Adaptive colors based on user's OS setting

### 2. **Light Theme**
- Classic light theme with green accent
- Primary: `#22C55E` (Emerald Green)
- Clean white backgrounds

### 3. **Dark Theme** 
- Enhanced dark mode with Islamic gold accents
- Primary: `#22C55E` (Emerald Green)
- Accent: `#F59E0B` (Amber Gold)
- Deep slate backgrounds

### 4. **Medina Munawara** 🕌
- Sacred emerald green theme
- Primary: `#059669` (Deep Emerald)
- Background: `#F0FDF4` (Soft Green Tint)
- Inspired by the holy city

### 5. **FZHH Blue** 🤝
- Professional charity organization theme
- Primary: `#2563EB` (Trust Blue)
- Accent: `#059669` (Charity Green)
- Clean and trustworthy

### 6. **White & Gold** ✨
- Luxury theme with golden accents
- Primary: `#D97706` (Amber Gold)
- Background: `#FFFBEB` (Warm Cream)
- Premium and elegant

## 🔧 How to Use the Theme System

### Basic Usage

```typescript
import { useAppTheme } from '../utils/theme';

function MyComponent() {
  const { colors, themeDefinition, isDark } = useAppTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Hello World
      </Text>
    </View>
  );
}
```

### Theme Colors Structure

```typescript
interface ThemeColors {
  // Primary brand colors
  primary: string;           // Main brand color
  primaryLight: string;      // Lighter variant
  primaryDark: string;       // Darker variant
  
  // Secondary colors
  secondary: string;         // Secondary brand color
  secondaryLight: string;    // Lighter variant
  secondaryDark: string;     // Darker variant
  
  // Accent color
  accent: string;            // Accent/highlight color
  accentLight: string;       // Lighter accent
  
  // Background colors
  background: string;        // Main background
  surface: string;           // Card/surface background
  surfaceVariant: string;    // Alternative surface
  
  // Text colors
  text: {
    primary: string;         // Main text color
    secondary: string;       // Secondary text
    tertiary: string;        // Tertiary text
    inverse: string;         // Inverse text
    onPrimary: string;       // Text on primary color
    onSecondary: string;     // Text on secondary color
    onAccent: string;        // Text on accent color
  };
  
  // Border and divider colors
  border: string;            // Border color
  borderLight: string;       // Light border
  divider: string;           // Divider color
  
  // Status colors
  success: string;           // Success state
  warning: string;           // Warning state
  error: string;             // Error state
  info: string;              // Info state
  
  // Islamic themed colors
  islamic: {
    green: string;           // Islamic green
    gold: string;            // Islamic gold
    navy: string;            // Islamic navy
    cream: string;           // Islamic cream
  };
  
  // Component specific colors
  card: string;              // Card background
  modal: string;             // Modal background
  overlay: string;           // Overlay background
  shadow: string;            // Shadow color
}
```

## 📱 Component Styling Patterns

### 1. Container/Background Colors

```typescript
// ✅ Good
<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

// ❌ Avoid
<SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
```

### 2. Text Colors

```typescript
// ✅ Good - Use semantic text colors
<Text style={[styles.title, { color: colors.text.primary }]}>Title</Text>
<Text style={[styles.subtitle, { color: colors.text.secondary }]}>Subtitle</Text>

// ❌ Avoid - Hardcoded colors
<Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Title</Text>
```

### 3. Surface/Card Colors

```typescript
// ✅ Good
<View style={[styles.card, { backgroundColor: colors.surface }]}>
  <View style={[styles.section, { backgroundColor: colors.card }]}>
```

### 4. Border Colors

```typescript
// ✅ Good
<View style={[styles.input, { 
  borderColor: hasError ? colors.error : colors.border,
  backgroundColor: colors.surface 
}]}>
```

### 5. Button Colors

```typescript
// ✅ Good - Primary button
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
  <Text style={[styles.buttonText, { color: colors.text.onPrimary }]}>
    Button
  </Text>
</TouchableOpacity>

// ✅ Good - Secondary button
<TouchableOpacity style={[styles.button, { 
  backgroundColor: colors.surface,
  borderColor: colors.border 
}]}>
  <Text style={[styles.buttonText, { color: colors.text.primary }]}>
    Button
  </Text>
</TouchableOpacity>
```

## 🎯 Migration Checklist

### For Each Component:

1. **Import the theme hook**
   ```typescript
   import { useAppTheme } from '../utils/theme';
   ```

2. **Replace theme hook usage**
   ```typescript
   // Before
   const { isDark } = useAppTheme();
   
   // After  
   const { isDark, colors, themeDefinition } = useAppTheme();
   ```

3. **Update background colors**
   ```typescript
   // Before
   backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.white
   
   // After
   backgroundColor: colors.background // or colors.surface for cards
   ```

4. **Update text colors**
   ```typescript
   // Before
   color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900
   
   // After
   color: colors.text.primary
   ```

5. **Update border colors**
   ```typescript
   // Before
   borderColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300
   
   // After
   borderColor: colors.border
   ```

6. **Update button colors**
   ```typescript
   // Before
   backgroundColor: COLORS.primary.green
   
   // After
   backgroundColor: colors.primary
   ```

## 🔄 Theme Switching

### Programmatic Theme Changes

```typescript
import { useTasbeeh } from '../contexts/TasbeehContext';

function ThemeSwitcher() {
  const { updateSettings } = useTasbeeh();
  
  const switchTheme = (themeName: ThemeName) => {
    updateSettings({ theme: themeName });
  };
  
  return (
    <TouchableOpacity onPress={() => switchTheme('medina')}>
      <Text>Switch to Medina Theme</Text>
    </TouchableOpacity>
  );
}
```

### Theme Selector Component

The app includes a built-in `ThemeSelector` component:

```typescript
import ThemeSelector from '../components/ThemeSelector';

function Settings() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
  return (
    <>
      <TouchableOpacity onPress={() => setShowThemeSelector(true)}>
        <Text>Choose Theme</Text>
      </TouchableOpacity>
      
      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </>
  );
}
```

## 🎨 Adding New Themes

### 1. Define Theme Colors

```typescript
// In src/utils/theme.ts
const newTheme: ThemeDefinition = {
  name: 'new-theme',
  displayName: 'New Theme',
  description: 'Description of the new theme',
  isDark: false,
  colors: {
    primary: '#your-primary-color',
    // ... define all required colors
  },
};
```

### 2. Add to Themes Object

```typescript
const themes: Record<ThemeName, ThemeDefinition> = {
  // ... existing themes
  'new-theme': newTheme,
};
```

### 3. Update Type Definitions

```typescript
// In src/types/index.ts
export interface Settings {
  theme: 'light' | 'dark' | 'auto' | 'medina' | 'fzhh-blue' | 'white-gold' | 'new-theme';
  // ... other settings
}
```

## 🧪 Testing Themes

### Visual Testing

1. **Theme Selector**: Use the built-in theme selector to test all themes
2. **Theme Demo**: Use the `ThemeDemo` component to see live previews
3. **Manual Testing**: Switch themes and navigate through all app screens

### Automated Testing

```typescript
// Example theme test
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../contexts/ThemeContext';

describe('Component with Theme', () => {
  it('renders correctly with medina theme', () => {
    const { getByText } = render(
      <ThemeProvider initialTheme="medina">
        <YourComponent />
      </ThemeProvider>
    );
    
    expect(getByText('Your Text')).toBeTruthy();
  });
});
```

## 🌍 Accessibility

### Color Contrast

All themes maintain WCAG AA compliance:
- **Minimum contrast ratio**: 4.5:1 for normal text
- **Large text contrast**: 3:1 for text 18pt+ or 14pt+ bold
- **Focus indicators**: High contrast focus colors

### Testing Accessibility

```typescript
import { getAccessibleColors } from '../utils/accessibility';

const accessibleColors = getAccessibleColors(isDark ? 'dark' : 'light');
```

## 🔍 Debugging

### Theme Inspector

Add this to any component to inspect current theme:

```typescript
function ThemeInspector() {
  const { colors, themeDefinition, theme } = useAppTheme();
  
  return (
    <View style={{ padding: 20, backgroundColor: colors.surface }}>
      <Text style={{ color: colors.text.primary }}>
        Current Theme: {themeDefinition.displayName}
      </Text>
      <Text style={{ color: colors.text.secondary }}>
        Theme ID: {theme}
      </Text>
      <Text style={{ color: colors.text.secondary }}>
        Is Dark: {themeDefinition.isDark ? 'Yes' : 'No'}
      </Text>
    </View>
  );
}
```

## 📱 Best Practices

### 1. **Always Use Semantic Colors**
- Use `colors.text.primary` instead of hardcoded colors
- Use `colors.background` for main backgrounds
- Use `colors.surface` for cards and elevated content

### 2. **Maintain Theme Consistency**
- Follow the established color hierarchy
- Use Islamic-themed colors appropriately
- Test all themes during development

### 3. **Performance**
- The theme hook is optimized and memoized
- Theme switching is instant with no lag
- Colors are cached for performance

### 4. **Islamic Aesthetics**
- Each theme incorporates Islamic values
- Colors are chosen for spiritual harmony
- Accessibility ensures inclusive design

## 🚀 Quick Migration Script

For bulk migration, use this pattern:

```bash
# Find and replace common patterns
sed -i 's/isDark ? COLORS\.neutral\.white : COLORS\.neutral\.gray900/colors.text.primary/g' **/*.tsx
sed -i 's/isDark ? COLORS\.neutral\.gray900 : COLORS\.neutral\.white/colors.background/g' **/*.tsx
```

## 🎉 Conclusion

The new theme system provides:
- **4 Beautiful Themes**: Each crafted for Islamic aesthetics
- **Type Safety**: Full TypeScript support
- **Accessibility**: WCAG compliant colors
- **Performance**: Optimized theme switching
- **Extensibility**: Easy to add new themes

Happy theming! 🎨✨ 