import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/utils/theme';
import AdvancedAudioDemo from '../../src/components/AdvancedAudioDemo';

const { width: screenWidth } = Dimensions.get('window');

export default function AudioScreen() {
  const { colors } = useAppTheme();
  const [showAdvancedAudio, setShowAdvancedAudio] = useState(false);

  const renderFeatureCard = (
    title: string,
    description: string,
    icon: string,
    iconType: 'Ionicons' | 'MaterialIcons',
    onPress: () => void,
    gradient: [string, string, ...string[]]
  ) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureGradient}
      >
        <View style={styles.featureIcon}>
          {iconType === 'Ionicons' ? (
            <Ionicons name={icon as any} size={32} color="#fff" />
          ) : (
            <MaterialIcons name={icon as any} size={32} color="#fff" />
          )}
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Audio Studio</Text>
            <Text style={styles.headerSubtitle}>
              Professional audio tools for Islamic content
            </Text>
          </View>

          {/* Featured System */}
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured</Text>
            {renderFeatureCard(
              'Advanced Audio System',
              'SoundCloud-inspired audio player with recording, playlists, and effects',
              'musical-notes',
              'Ionicons',
              () => setShowAdvancedAudio(true),
              ['#FF6B35', '#F7931E', '#FF8C42']
            )}
          </View>

          {/* Audio Tools */}
          <View style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>Audio Tools</Text>
            <View style={styles.toolsGrid}>
              {renderFeatureCard(
                'Quran Recitation',
                'Listen to beautiful Quran recitations with multiple reciters',
                'book',
                'Ionicons',
                () => {
                  // Navigate to Quran tab or show Quran audio
                },
                ['#2E7D32', '#4CAF50']
              )}

              {renderFeatureCard(
                'Prayer Audio',
                'Audio guidance for prayers and Islamic supplications',
                'time',
                'Ionicons',
                () => {
                  // Navigate to Prayer Times or show prayer audio
                },
                ['#1976D2', '#2196F3']
              )}

              {renderFeatureCard(
                'Dhikr & Tasbih',
                'Guided dhikr sessions with audio accompaniment',
                'infinite',
                'Ionicons',
                () => {
                  // Navigate to Counter with audio features
                },
                ['#7B1FA2', '#9C27B0']
              )}

              {renderFeatureCard(
                'Islamic Nasheeds',
                'Collection of beautiful Islamic songs and nasheeds',
                'library-music',
                'MaterialIcons',
                () => setShowAdvancedAudio(true),
                ['#D32F2F', '#F44336']
              )}
            </View>
          </View>

          {/* Audio Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Audio Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="play-circle" size={24} color="#FF6B35" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureItemTitle}>High-Quality Playback</Text>
                  <Text style={styles.featureItemDescription}>
                    Crystal clear audio with multiple format support
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="mic" size={24} color="#4CAF50" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureItemTitle}>Professional Recording</Text>
                  <Text style={styles.featureItemDescription}>
                    Record dhikr, recitations, or personal notes
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="list" size={24} color="#2196F3" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureItemTitle}>Smart Playlists</Text>
                  <Text style={styles.featureItemDescription}>
                    Organize your Islamic audio content efficiently
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="download" size={24} color="#9C27B0" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureItemTitle}>Offline Access</Text>
                  <Text style={styles.featureItemDescription}>
                    Download content for offline listening
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="timer" size={24} color="#FF9800" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureItemTitle}>Sleep Timer</Text>
                  <Text style={styles.featureItemDescription}>
                    Auto-stop playback for nighttime listening
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="speedometer" size={24} color="#795548" />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureItemTitle}>Playback Control</Text>
                  <Text style={styles.featureItemDescription}>
                    Variable speed, repeat modes, and precise seeking
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Advanced Audio System Modal */}
        <AdvancedAudioDemo
          isVisible={showAdvancedAudio}
          onClose={() => setShowAdvancedAudio(false)}
        />
      </LinearGradient>
    </View>
  );
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuredSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  toolsSection: {
    marginBottom: 30,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (screenWidth - 50) / 2,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  featuresSection: {
    marginBottom: 30,
  },
  featuresList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  featureItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureItemDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 18,
  },
}); 