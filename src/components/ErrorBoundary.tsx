/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays fallback UI
 */
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../types';
import { secureLogger } from '../utils/secureLogger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorId: string;
  onRetry: () => void;
  onReport: () => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error securely
    secureLogger.error('React Error Boundary caught an error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    }, 'ErrorBoundary');

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReport = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // In a real app, this would send to a crash reporting service
    // like Sentry, Crashlytics, or Bugsnag
    secureLogger.info('User reported error', {
      errorId,
      userReported: true,
      timestamp: new Date().toISOString(),
    }, 'ErrorBoundary');

    // You could also open email client or feedback form here
    // Linking.openURL(`mailto:support@tasbeeh-app.com?subject=Error Report&body=Error ID: ${errorId}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReport={this.handleReport}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorId, onRetry, onReport }) => {
  const isDarkMode = false; // You can get this from theme context if needed

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
      <LinearGradient
        colors={[COLORS.semantic.error, '#DC2626']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={64} color={COLORS.neutral.white} />
          </View>

          {/* Error Title */}
          <Text style={styles.title}>Oops! Something went wrong</Text>
          
          {/* Error Message */}
          <Text style={styles.subtitle}>
            We encountered an unexpected error. Don't worry, your data is safe.
          </Text>

          {/* Error Details (only in development) */}
          {__DEV__ && error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorDetailsTitle}>Error Details (Development)</Text>
              <View style={styles.errorMessage}>
                <Text style={styles.errorText}>{error.name}: {error.message}</Text>
              </View>
            </View>
          )}

          {/* Error ID */}
          <View style={styles.errorIdContainer}>
            <Text style={styles.errorIdLabel}>Error ID:</Text>
            <Text style={styles.errorIdText}>{errorId}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
              <Ionicons name="refresh" size={20} color={COLORS.neutral.white} />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onReport}>
              <Ionicons name="flag" size={20} color={COLORS.neutral.white} />
              <Text style={styles.secondaryButtonText}>Report Issue</Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              If this problem persists, please restart the app or contact support with the Error ID above.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Specific error boundaries for different parts of the app
export class CounterErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallback={
          <View style={styles.smallErrorContainer}>
            <Ionicons name="warning" size={32} color={COLORS.semantic.error} />
            <Text style={styles.smallErrorText}>Counter Error</Text>
            <TouchableOpacity style={styles.smallRetryButton} onPress={() => window.location.reload()}>
              <Text style={styles.smallRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }
}

export class HistoryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallback={
          <View style={styles.smallErrorContainer}>
            <Ionicons name="time" size={32} color={COLORS.semantic.error} />
            <Text style={styles.smallErrorText}>History Load Error</Text>
            <TouchableOpacity style={styles.smallRetryButton} onPress={() => window.location.reload()}>
              <Text style={styles.smallRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }
}

export class SettingsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallback={
          <View style={styles.smallErrorContainer}>
            <Ionicons name="settings" size={32} color={COLORS.semantic.error} />
            <Text style={styles.smallErrorText}>Settings Error</Text>
            <TouchableOpacity style={styles.smallRetryButton} onPress={() => window.location.reload()}>
              <Text style={styles.smallRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neutral.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.neutral.white,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral.white,
    marginBottom: 8,
  },
  errorMessage: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.neutral.white,
    fontFamily: 'monospace',
  },
  errorIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  errorIdLabel: {
    fontSize: 14,
    color: COLORS.neutral.white,
    fontWeight: '500',
    marginRight: 8,
  },
  errorIdText: {
    fontSize: 14,
    color: COLORS.neutral.white,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neutral.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.semantic.error,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.neutral.white,
  },
  helpContainer: {
    marginTop: 24,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.neutral.white,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  
  // Small error boundary styles
  smallErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  smallErrorText: {
    fontSize: 16,
    color: COLORS.semantic.error,
    marginVertical: 12,
    textAlign: 'center',
  },
  smallRetryButton: {
    backgroundColor: COLORS.semantic.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  smallRetryText: {
    color: COLORS.neutral.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorBoundary; 