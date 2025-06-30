/**
 * Theme Demo Launcher Component
 * Easy way to launch the interactive theme demo from any screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { getButtonA11yProps } from '../utils/accessibility';
import InteractiveThemeDemo from './InteractiveThemeDemo';

interface ThemeDemoLauncherProps {
  buttonText?: string;
  showIcon?: boolean;
  style?: any;
  size?: 'small' | 'medium' | 'large';
}

export default function ThemeDemoLauncher({ 
  buttonText = 'Preview Themes',
  showIcon = true,
  style,
  size = 'medium'
}: ThemeDemoLauncherProps) {
  const { colors } = useAppTheme();
  const [showDemo, setShowDemo] = useState(false);

  const sizeStyles = {
    small: {
      padding: 8,
      fontSize: 12,
      iconSize: 16,
    },
    medium: {
      padding: 12,
      fontSize: 14,
      iconSize: 20,
    },
    large: {
      padding: 16,
      fontSize: 16,
      iconSize: 24,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.launcherButton,
          {
            backgroundColor: colors.primary,
            padding: currentSize.padding,
          },
          style
        ]}
        onPress={() => setShowDemo(true)}
        {...getButtonA11yProps(
          buttonText,
          'Open interactive theme preview demo',
          false
        )}
      >
        {showIcon && (
          <Ionicons 
            name="color-palette" 
            size={currentSize.iconSize} 
            color={colors.text.onPrimary} 
          />
        )}
        <Text style={[
          styles.launcherButtonText,
          { 
            color: colors.text.onPrimary,
            fontSize: currentSize.fontSize,
            marginLeft: showIcon ? 8 : 0,
          }
        ]}>
          {buttonText}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showDemo}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <InteractiveThemeDemo onClose={() => setShowDemo(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  launcherButtonText: {
    fontWeight: '600',
  },
}); 