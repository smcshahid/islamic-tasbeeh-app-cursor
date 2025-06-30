import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AdvancedAudioDemo from './AdvancedAudioDemo';

interface AudioSystemLauncherProps {
  style?: any;
}

export default function AudioSystemLauncher({ style }: AudioSystemLauncherProps) {
  const [showAudioSystem, setShowAudioSystem] = useState(false);

  const handleLaunch = () => {
    Alert.alert(
      '🎵 Advanced Audio System',
      'Experience a comprehensive audio platform with professional features inspired by SoundCloud.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Launch Demo', onPress: () => setShowAudioSystem(true) },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.launcherButton} onPress={handleLaunch}>
        <LinearGradient
          colors={['#FF6B35', '#F7931E', '#FFD23F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={24} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Advanced Audio System</Text>
            <Text style={styles.subtitle}>SoundCloud-inspired audio platform</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <AdvancedAudioDemo
        isVisible={showAudioSystem}
        onClose={() => setShowAudioSystem(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  launcherButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
}); 