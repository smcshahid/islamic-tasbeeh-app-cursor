import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../types';
import { useAppTheme } from '../utils/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PrayerTimesErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Prayer Times Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <PrayerTimesErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function PrayerTimesErrorFallback({ onReset }: { onReset: () => void }) {
  const { colors, isDark } = useAppTheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }
    ]}>
      <View style={styles.content}>
        <Ionicons 
          name="alert-circle" 
          size={64} 
          color={COLORS.semantic.error} 
          style={styles.icon}
        />
        
        <Text style={[
          styles.title,
          { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
        ]}>
          Prayer Times Unavailable
        </Text>
        
        <Text style={[
          styles.message,
          { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }
        ]}>
          There was an issue loading the prayer times feature. This might be due to network connectivity or a temporary service issue.
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary.green }]}
          onPress={onReset}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <View style={styles.suggestions}>
          <Text style={[
            styles.suggestionsTitle,
            { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }
          ]}>
            Suggestions:
          </Text>
          <Text style={[
            styles.suggestionText,
            { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray600 }
          ]}>
            • Check your internet connection
          </Text>
          <Text style={[
            styles.suggestionText,
            { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray600 }
          ]}>
            • Enable location services for accurate prayer times
          </Text>
          <Text style={[
            styles.suggestionText,
            { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray600 }
          ]}>
            • Try again in a few moments
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  suggestions: {
    alignSelf: 'stretch',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
}); 