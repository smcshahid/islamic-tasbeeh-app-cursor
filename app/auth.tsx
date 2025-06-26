import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTasbeeh } from '../src/contexts/TasbeehContext';
import { useAppTheme } from '../src/utils/theme';
import { COLORS } from '../src/types';
import { auth } from '../src/utils/supabase';

// Enhanced input validation
const INPUT_VALIDATION = {
  email: {
    minLength: 5,
    maxLength: 254,
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requirements: {
      lowercase: /(?=.*[a-z])/,
      uppercase: /(?=.*[A-Z])/,
      number: /(?=.*\d)/,
      specialChar: /(?=.*[!@#$%^&*(),.?":{}|<>])/,
    }
  }
};

// Rate limiting state
let authAttempts = 0;
let lastAttemptTime = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 300000; // 5 minutes

export default function AuthScreen() {
  const { isDark } = useAppTheme();
  const { signIn, signUp, signInAsGuest, isLoading, error: contextError } = useTasbeeh();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clear auth error when switching between sign in/up
  useEffect(() => {
    setAuthError(null);
    setEmailError('');
    setPasswordError('');
  }, [isSignUp]);

  // Display context error if it's not a success message
  useEffect(() => {
    if (contextError && !contextError.includes('Success')) {
      setAuthError(contextError);
    } else if (contextError && contextError.includes('Success')) {
      setAuthError(null);
      // Auto-clear success messages after 3 seconds
      const timer = setTimeout(() => setAuthError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [contextError]);

  // Enhanced email validation with security checks
  const validateEmail = useCallback((email: string): { isValid: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (trimmedEmail.length < INPUT_VALIDATION.email.minLength) {
      return { isValid: false, error: 'Email is too short' };
    }
    
    if (trimmedEmail.length > INPUT_VALIDATION.email.maxLength) {
      return { isValid: false, error: 'Email is too long' };
    }
    
    if (!INPUT_VALIDATION.email.pattern.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    // Basic security checks
    if (trimmedEmail.includes('..') || trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    return { isValid: true };
  }, []);

  // Enhanced password validation
  const validatePassword = useCallback((password: string, isSignUp: boolean): { isValid: boolean; error?: string; strength?: string } => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < INPUT_VALIDATION.password.minLength) {
      return { isValid: false, error: `Password must be at least ${INPUT_VALIDATION.password.minLength} characters long` };
    }
    
    if (password.length > INPUT_VALIDATION.password.maxLength) {
      return { isValid: false, error: 'Password is too long' };
    }
    
    // Only enforce strong password requirements for sign up
    if (isSignUp) {
      const requirements = INPUT_VALIDATION.password.requirements;
      
      if (!requirements.lowercase.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
      }
      
      if (!requirements.uppercase.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
      }
      
      if (!requirements.number.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
      }
      
      // Calculate password strength
      let strength = 'Weak';
      let score = 0;
      
      if (requirements.lowercase.test(password)) score++;
      if (requirements.uppercase.test(password)) score++;
      if (requirements.number.test(password)) score++;
      if (requirements.specialChar.test(password)) score++;
      if (password.length >= 12) score++;
      
      if (score >= 4) strength = 'Strong';
      else if (score >= 3) strength = 'Medium';
      
      return { isValid: true, strength };
    }
    
    return { isValid: true };
  }, []);

  // Rate limiting check
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    if (now - lastAttemptTime > LOCKOUT_DURATION) {
      authAttempts = 0;
    }
    
    if (authAttempts >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - lastAttemptTime)) / 1000 / 60);
      setAuthError(`Too many attempts. Please wait ${remainingTime} minutes before trying again.`);
      return false;
    }
    
    return true;
  }, []);

  // Secure input sanitization
  const sanitizeInput = useCallback((input: string): string => {
    return input.replace(/[<>]/g, '').trim();
  }, []);

  // Enhanced authentication handler
  const handleAuth = useCallback(async () => {
    if (isSubmitting) return;
    
    // Check rate limiting
    if (!checkRateLimit()) return;
    
    setIsSubmitting(true);
    setEmailError('');
    setPasswordError('');
    setAuthError(null);
    
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = password; // Don't sanitize password as it might contain special chars
      
      // Validate email
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error || 'Invalid email');
        setIsSubmitting(false);
        return;
      }
      
      // Validate password
      const passwordValidation = validatePassword(sanitizedPassword, isSignUp);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.error || 'Invalid password');
        setIsSubmitting(false);
        return;
      }
      
      // Validate confirm password for sign up
      if (isSignUp && sanitizedPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }
      
      // Record attempt
      authAttempts++;
      lastAttemptTime = Date.now();
      
      if (isSignUp) {
        // Sign up
        await signUp(sanitizedEmail, sanitizedPassword);
        // Reset attempts on successful sign up
        authAttempts = 0;
      } else {
        // Sign in
        await signIn(sanitizedEmail, sanitizedPassword);
        // Reset attempts on successful sign in
        authAttempts = 0;
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.message?.includes('Invalid login credentials')) {
        userMessage = isSignUp 
          ? 'This email is already registered. Try signing in instead.'
          : 'Invalid email or password. Please check your credentials or create an account.';
      } else if (error?.message?.includes('Email not confirmed')) {
        userMessage = 'Please check your email and click the verification link before signing in.';
      } else if (error?.message?.includes('already registered')) {
        userMessage = 'This email is already registered. Try signing in instead.';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setAuthError(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, 
    checkRateLimit, 
    email, 
    password, 
    confirmPassword, 
    isSignUp, 
    validateEmail, 
    validatePassword, 
    sanitizeInput, 
    signIn,
    signUp
  ]);

  const handleGuestSignIn = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await signInAsGuest();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Guest sign in error:', error);
      setAuthError('Failed to sign in as guest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, signInAsGuest]);

  // Real-time email validation
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (emailError) {
      const validation = validateEmail(text);
      if (validation.isValid) {
        setEmailError('');
      }
    }
  }, [emailError, validateEmail]);

  // Real-time password validation
  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (passwordError) {
      const validation = validatePassword(text, isSignUp);
      if (validation.isValid) {
        setPasswordError('');
      }
    }
  }, [passwordError, validatePassword, isSignUp]);

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
                onPress={() => {
                  setIsSignUp(false);
                  setEmailError('');
                  setPasswordError('');
                  setAuthError(null);
                }}
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
                onPress={() => {
                  setIsSignUp(true);
                  setEmailError('');
                  setPasswordError('');
                  setAuthError(null);
                }}
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

            {/* Display auth errors prominently */}
            {authError && (
              <View style={[styles.errorContainer, { 
                backgroundColor: authError.includes('Success') || authError.includes('created') || authError.includes('ready') 
                  ? COLORS.semantic.success + '20' 
                  : COLORS.semantic.error + '20',
                borderColor: authError.includes('Success') || authError.includes('created') || authError.includes('ready')
                  ? COLORS.semantic.success 
                  : COLORS.semantic.error
              }]}>
                <Ionicons 
                  name={authError.includes('Success') || authError.includes('created') || authError.includes('ready') ? 'checkmark-circle-outline' : 'alert-circle-outline'} 
                  size={20} 
                  color={authError.includes('Success') || authError.includes('created') || authError.includes('ready') ? COLORS.semantic.success : COLORS.semantic.error} 
                />
                <Text style={[styles.errorContainerText, { 
                  color: authError.includes('Success') || authError.includes('created') || authError.includes('ready') 
                    ? COLORS.semantic.success 
                    : COLORS.semantic.error 
                }]}>
                  {authError}
                </Text>
              </View>
            )}

            <View style={[
              styles.inputContainer,
              emailError ? styles.inputError : null,
              { 
                borderColor: emailError 
                  ? COLORS.semantic.error 
                  : (isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300),
                backgroundColor: isDark ? COLORS.neutral.gray700 : COLORS.neutral.white
              }
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={emailError ? COLORS.semantic.error : (isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500)} 
              />
              <TextInput
                style={[styles.input, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}
                placeholder="Email address"
                placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                maxLength={INPUT_VALIDATION.email.maxLength}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <View style={[
              styles.inputContainer,
              passwordError ? styles.inputError : null,
              { 
                borderColor: passwordError 
                  ? COLORS.semantic.error 
                  : (isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300),
                backgroundColor: isDark ? COLORS.neutral.gray700 : COLORS.neutral.white
              }
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={passwordError ? COLORS.semantic.error : (isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500)} 
              />
              <TextInput
                style={[styles.input, { color: isDark ? COLORS.neutral.white : COLORS.neutral.gray900 }]}
                placeholder="Password"
                placeholderTextColor={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={isSignUp ? "new-password" : "password"}
                textContentType={isSignUp ? "newPassword" : "password"}
                maxLength={INPUT_VALIDATION.password.maxLength}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray500} 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {isSignUp && (
              <>
                <View style={[
                  styles.inputContainer,
                  { 
                    borderColor: isDark ? COLORS.neutral.gray600 : COLORS.neutral.gray300,
                    backgroundColor: isDark ? COLORS.neutral.gray700 : COLORS.neutral.white
                  }
                ]}>
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
                    autoComplete="new-password"
                    textContentType="newPassword"
                    maxLength={INPUT_VALIDATION.password.maxLength}
                  />
                </View>
                
                {isSignUp && password && (
                  <Text style={[styles.passwordHint, { color: isDark ? COLORS.neutral.gray400 : COLORS.neutral.gray600 }]}>
                    Password must contain: uppercase, lowercase, number, and be 8+ characters
                  </Text>
                )}
              </>
            )}

            <TouchableOpacity
              style={[
                styles.authButton, 
                { backgroundColor: COLORS.primary.green },
                (isSubmitting || isLoading) && styles.disabledButton
              ]}
              onPress={handleAuth}
              disabled={isSubmitting || isLoading}
            >
              <Text style={styles.authButtonText}>
                {isSubmitting || isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
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
                },
                (isSubmitting || isLoading) && styles.disabledButton
              ]}
              onPress={handleGuestSignIn}
              disabled={isSubmitting || isLoading}
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
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorContainerText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  inputError: {
    borderColor: COLORS.semantic.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.semantic.error,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordHint: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  authButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
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