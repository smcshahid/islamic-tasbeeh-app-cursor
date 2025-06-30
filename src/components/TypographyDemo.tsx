import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../utils/theme';
import { TYPOGRAPHY_PRESETS } from '../utils/fonts';

const TypographyDemo: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[TYPOGRAPHY_PRESETS.appTitle(28), { color: colors.text.primary, marginBottom: 24 }]}>
          Typography Demo
        </Text>

        {/* Quran Text Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[TYPOGRAPHY_PRESETS.sectionTitle(20), { color: colors.text.primary, marginBottom: 16 }]}>
            Quran Text
          </Text>
          
          <Text style={[TYPOGRAPHY_PRESETS.quranVerse(22), { color: colors.text.primary, marginBottom: 12 }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          
          <Text style={[TYPOGRAPHY_PRESETS.bodyText(16), { color: colors.text.secondary, marginBottom: 16 }]}>
            In the name of Allah, the Most Gracious, the Most Merciful
          </Text>

          <Text style={[TYPOGRAPHY_PRESETS.quranVerse(20), { color: colors.text.primary, marginBottom: 12 }]}>
            الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
          </Text>
          
          <Text style={[TYPOGRAPHY_PRESETS.bodyText(16), { color: colors.text.secondary }]}>
            Praise to Allah, Lord of the worlds
          </Text>
        </View>

        {/* Surah Names Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[TYPOGRAPHY_PRESETS.sectionTitle(20), { color: colors.text.primary, marginBottom: 16 }]}>
            Surah Names
          </Text>
          
          <View style={styles.surahRow}>
            <Text style={[TYPOGRAPHY_PRESETS.surahNameEnglish(16), { color: colors.text.primary }]}>
              Al-Fatihah
            </Text>
            <Text style={[TYPOGRAPHY_PRESETS.surahNameArabic(18), { color: colors.text.primary }]}>
              الفاتحة
            </Text>
          </View>

          <View style={styles.surahRow}>
            <Text style={[TYPOGRAPHY_PRESETS.surahNameEnglish(16), { color: colors.text.primary }]}>
              Al-Baqarah
            </Text>
            <Text style={[TYPOGRAPHY_PRESETS.surahNameArabic(18), { color: colors.text.primary }]}>
              البقرة
            </Text>
          </View>

          <View style={styles.surahRow}>
            <Text style={[TYPOGRAPHY_PRESETS.surahNameEnglish(16), { color: colors.text.primary }]}>
              Ar-Rahman
            </Text>
            <Text style={[TYPOGRAPHY_PRESETS.surahNameArabic(18), { color: colors.text.primary }]}>
              الرحمن
            </Text>
          </View>
        </View>

        {/* UI Text Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[TYPOGRAPHY_PRESETS.sectionTitle(20), { color: colors.text.primary, marginBottom: 16 }]}>
            UI Text Styles
          </Text>
          
          <Text style={[TYPOGRAPHY_PRESETS.bodyText(16), { color: colors.text.primary, marginBottom: 8 }]}>
            Body text - perfect for descriptions and content
          </Text>
          
          <Text style={[TYPOGRAPHY_PRESETS.bodyBold(16), { color: colors.text.primary, marginBottom: 8 }]}>
            Bold body text - great for emphasis
          </Text>
          
          <Text style={[TYPOGRAPHY_PRESETS.caption(14), { color: colors.text.secondary, marginBottom: 16 }]}>
            Caption text - ideal for secondary information
          </Text>

          <Text style={[TYPOGRAPHY_PRESETS.arabicButton(16), { color: colors.text.primary }]}>
            زر عربي
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  surahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

export default TypographyDemo; 