import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTasbeeh } from '../src/contexts/TasbeehContext';
import { COLORS } from '../src/types';
import { auth } from '../src/utils/supabase';

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signIn, signInAsGuest, isLoading } = useTasbeeh();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await auth.signUp(email, password);
        
        if (error) {
          Alert.alert('Sign Up Error', error.message);
          return;
        }

        if (data.user) {
          Alert.alert(
            'Success',
            'Account created successfully! Please check your email for verification.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsSignUp(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                },
              },
            ]
          );
        }
      } else {
        // Sign in
        await signIn(email, password);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleGuestSignIn = async () => {
    await signInAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.neutral.gray900 : COLORS.neutral.gray50 }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[COLORS.primary.green, COLORS.primary.teal]}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.appName}>Tasbeeh</Text>
              <Text style={styles.appSubtitle}>Digital Prayer Counter</Text>
            </View>
          </LinearGradient>

          <View style={[styles.formContainer, { backgroundColor: isDark ? COLORS.neutral.gray800 : COLORS.neutral.white }]}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isSignUp && styles.activeToggle,
                  !isSignUp && { backgroundColor: COLORS.primary.green }
                ]}
                onPress={() => setIsSignUp(false)}
              >
                <Text style={[
                  styles.toggleText,
                  { color: !isSignUp ? COLORS.neutral.white : (isDark ? COLORS.neutral.white : COLORS.neutral.gray900) }
                ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isSignUp && styles.activeToggle,
                  isSignUp && { backgroundColor: COLORS.primary.green }
                ]}
                onPress={() => setIsSignUp(true)}
              >
                <Text style={[
                  styles.toggleText,
                  { color: isSignUp ? COLORS.neutral.white : (isDark ? COLORS.neutral.white : COLORS.neutral.gray900) }
                ]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.formTitle, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </Text>

            <Text style={[styles.formSubtitle, { color: isDark ? COLORS.neutral.gray300 : COLORS.neutral.gray600 }]}>
              {isSignUp 
                ? 'Join us to sync your dhikr across devices'
                : 'Sign in to access your saved counters'
              }
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
              />
              <TextInput
                style={[styles.input, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}
                placeholder="Email address"
                placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
              />
              <TextInput
                style={[styles.input, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}
                placeholder="Password"
                placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
                />
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
                />
                <TextInput
                  style={[styles.input, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}
                  placeholder="Confirm password"
                  placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: COLORS.primary.green }]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <Text style={styles.authButtonText}>
                {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300 }]} />
              <Text style={[styles.dividerText, { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500 }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300 }]} />
            </View>

            <TouchableOpacity
              style={[
                styles.guestButton,
                { 
                  backgroundColor: isDark ? COLORS.neutral.gray700 : COLORS.neutral.gray100,
                  borderColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300,
                }
              ]}
              onPress={handleGuestSignIn}
              disabled={isLoading}
            >
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={isDark ? COLORS.neutral.white : COLORS.neutral.gray900} 
              />
              <Text style={[styles.guestButtonText, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}>
                Continue as Guest
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500 }]}>
              {isSignUp 
                ? 'By creating an account, you agree to sync your data to our secure cloud storage.'
                : 'Sign in to sync your dhikr data across all your devices.'
              }
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.neutral.white,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: COLORS.neutral.white,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: COLORS.neutral.gray200,
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeToggle: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    backgroundColor: COLORS.neutral.gray50,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  authButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  authButtonText: {
    color: COLORS.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
}); 