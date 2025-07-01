import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { TYPOGRAPHY_PRESETS } from '../utils/fonts';

interface QuranJuzNavigationProps {
  visible: boolean;
  onClose: () => void;
  onJuzSelect: (juzData: {
    juzNumber: number;
    startSurah: number;
    startVerse: number;
    endSurah: number;
    endVerse: number;
    name: string;
    arabicName: string;
  }) => void;
}

interface JuzInfo {
  id: number;
  name: string;
  arabicName: string;
  startSurah: number;
  startVerse: number;
  endSurah: number;
  endVerse: number;
  totalVerses: number;
  startPage: number;
  endPage: number;
}

// Complete Juz data with accurate surah and verse mappings
const JUZ_DATA: JuzInfo[] = [
  { id: 1, name: 'Alif Lam Meem', arabicName: 'الم', startSurah: 1, startVerse: 1, endSurah: 2, endVerse: 141, totalVerses: 148, startPage: 1, endPage: 21 },
  { id: 2, name: 'Sayaqul', arabicName: 'سيقول', startSurah: 2, startVerse: 142, endSurah: 2, endVerse: 252, totalVerses: 111, startPage: 22, endPage: 41 },
  { id: 3, name: 'Tilka ar-Rusul', arabicName: 'تلك الرسل', startSurah: 2, startVerse: 253, endSurah: 3, endVerse: 92, totalVerses: 133, startPage: 42, endPage: 61 },
  { id: 4, name: 'Lan Tana Lu', arabicName: 'لن تنالوا', startSurah: 3, startVerse: 93, endSurah: 4, endVerse: 23, totalVerses: 131, startPage: 62, endPage: 81 },
  { id: 5, name: 'Wal Muhsanat', arabicName: 'والمحصنات', startSurah: 4, startVerse: 24, endSurah: 4, endVerse: 147, totalVerses: 124, startPage: 82, endPage: 101 },
  { id: 6, name: 'La Yuhibb Allah', arabicName: 'لا يحب الله', startSurah: 4, startVerse: 148, endSurah: 5, endVerse: 81, totalVerses: 111, startPage: 102, endPage: 121 },
  { id: 7, name: 'Wa Idha Samiu', arabicName: 'وإذا سمعوا', startSurah: 5, startVerse: 82, endSurah: 6, endVerse: 110, totalVerses: 149, startPage: 122, endPage: 141 },
  { id: 8, name: 'Wa Lau Annana', arabicName: 'ولو أننا', startSurah: 6, startVerse: 111, endSurah: 7, endVerse: 87, totalVerses: 142, startPage: 142, endPage: 161 },
  { id: 9, name: 'Qal al-Mala', arabicName: 'قال الملأ', startSurah: 7, startVerse: 88, endSurah: 8, endVerse: 40, totalVerses: 172, startPage: 162, endPage: 181 },
  { id: 10, name: 'Wa A\'lamu', arabicName: 'واعلموا', startSurah: 8, startVerse: 41, endSurah: 9, endVerse: 92, totalVerses: 129, startPage: 182, endPage: 201 },
  { id: 11, name: 'Ya\'tadhir', arabicName: 'يعتذرون', startSurah: 9, startVerse: 93, endSurah: 11, endVerse: 5, totalVerses: 148, startPage: 202, endPage: 221 },
  { id: 12, name: 'Wa Ma Min Dabbah', arabicName: 'وما من دابة', startSurah: 11, startVerse: 6, endSurah: 12, endVerse: 52, totalVerses: 165, startPage: 222, endPage: 241 },
  { id: 13, name: 'Wa Ma Ubri\'u', arabicName: 'وما أبرئ', startSurah: 12, startVerse: 53, endSurah: 14, endVerse: 52, totalVerses: 154, startPage: 242, endPage: 261 },
  { id: 14, name: 'Rubama', arabicName: 'ربما', startSurah: 15, startVerse: 1, endSurah: 16, endVerse: 128, totalVerses: 227, startPage: 262, endPage: 281 },
  { id: 15, name: 'Subhan Alladhi', arabicName: 'سبحان الذي', startSurah: 17, startVerse: 1, endSurah: 18, endVerse: 74, totalVerses: 185, startPage: 282, endPage: 301 },
  { id: 16, name: 'Qal Alam', arabicName: 'قال ألم', startSurah: 18, startVerse: 75, endSurah: 20, endVerse: 135, totalVerses: 157, startPage: 302, endPage: 321 },
  { id: 17, name: 'Iqtaraba', arabicName: 'اقترب', startSurah: 21, startVerse: 1, endSurah: 22, endVerse: 78, totalVerses: 190, startPage: 322, endPage: 341 },
  { id: 18, name: 'Qad Aflaha', arabicName: 'قد أفلح', startSurah: 23, startVerse: 1, endSurah: 25, endVerse: 20, totalVerses: 177, startPage: 342, endPage: 361 },
  { id: 19, name: 'Wa Qal Alladhina', arabicName: 'وقال الذين', startSurah: 25, startVerse: 21, endSurah: 27, endVerse: 55, totalVerses: 190, startPage: 362, endPage: 381 },
  { id: 20, name: 'A\'man Khalaq', arabicName: 'أمن خلق', startSurah: 27, startVerse: 56, endSurah: 29, endVerse: 45, totalVerses: 177, startPage: 382, endPage: 401 },
  { id: 21, name: 'Utlu Ma Uhiya', arabicName: 'اتل ما أوحي', startSurah: 29, startVerse: 46, endSurah: 33, endVerse: 30, totalVerses: 166, startPage: 402, endPage: 421 },
  { id: 22, name: 'Wa Man Yaqnut', arabicName: 'ومن يقنت', startSurah: 33, startVerse: 31, endSurah: 36, endVerse: 27, totalVerses: 171, startPage: 422, endPage: 441 },
  { id: 23, name: 'Wa Mali', arabicName: 'ومالي', startSurah: 36, startVerse: 28, endSurah: 39, endVerse: 31, totalVerses: 176, startPage: 442, endPage: 461 },
  { id: 24, name: 'Fa-man Azlam', arabicName: 'فمن أظلم', startSurah: 39, startVerse: 32, endSurah: 41, endVerse: 46, totalVerses: 160, startPage: 462, endPage: 481 },
  { id: 25, name: 'Ilayka', arabicName: 'إليه', startSurah: 41, startVerse: 47, endSurah: 45, endVerse: 37, totalVerses: 200, startPage: 482, endPage: 501 },
  { id: 26, name: 'Ha Meem', arabicName: 'حم', startSurah: 46, startVerse: 1, endSurah: 51, endVerse: 30, totalVerses: 201, startPage: 502, endPage: 521 },
  { id: 27, name: 'Qala Fa-ma Khatbukum', arabicName: 'قال فما خطبكم', startSurah: 51, startVerse: 31, endSurah: 57, endVerse: 29, totalVerses: 195, startPage: 522, endPage: 541 },
  { id: 28, name: 'Qad Samia Allah', arabicName: 'قد سمع الله', startSurah: 58, startVerse: 1, endSurah: 66, endVerse: 12, totalVerses: 160, startPage: 542, endPage: 561 },
  { id: 29, name: 'Tabarak Alladhi', arabicName: 'تبارك الذي', startSurah: 67, startVerse: 1, endSurah: 77, endVerse: 50, totalVerses: 431, startPage: 562, endPage: 581 },
  { id: 30, name: 'Amma Yatasa\'alun', arabicName: 'عم يتساءلون', startSurah: 78, startVerse: 1, endSurah: 114, endVerse: 6, totalVerses: 564, startPage: 582, endPage: 604 },
];

interface JuzItemProps {
  juz: JuzInfo;
  onPress: () => void;
  readingProgress?: number;
  memorizedVerses?: number;
}

const JuzItem: React.FC<JuzItemProps> = ({
  juz,
  onPress,
  readingProgress = 0,
  memorizedVerses = 0,
}) => {
  const { colors } = useAppTheme();
  
  return (
    <TouchableOpacity
      style={[styles.juzItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      {...getButtonA11yProps(
        `Juz ${juz.id}`,
        `${juz.name}, starts from Surah ${juz.startSurah} verse ${juz.startVerse}, ${juz.totalVerses} verses total`,
        false
      )}
    >
      <View style={[styles.juzNumber, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.juzNumberText, { color: colors.primary }]}>
          {juz.id}
        </Text>
      </View>
      
      <View style={styles.juzInfo}>
        <View style={styles.juzTitles}>
          <Text style={[styles.juzEnglishName, { color: colors.text.primary }]}>
            {juz.name}
          </Text>
          <Text style={[styles.juzArabicName, { color: colors.text.secondary }]}>
            {juz.arabicName}
          </Text>
        </View>
        
        <View style={styles.juzDetails}>
          <Text style={[styles.juzDetail, { color: colors.text.tertiary }]}>
            Surah {juz.startSurah}:{juz.startVerse} - {juz.endSurah}:{juz.endVerse}
          </Text>
          <Text style={[styles.juzDetail, { color: colors.text.tertiary }]}>
            {juz.totalVerses} verses • Pages {juz.startPage}-{juz.endPage}
          </Text>
        </View>

        {(readingProgress > 0 || memorizedVerses > 0) && (
          <View style={styles.progressContainer}>
            {readingProgress > 0 && (
              <View style={styles.progressItem}>
                <Ionicons name="book" size={12} color={colors.secondary} />
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { backgroundColor: colors.secondary, width: `${readingProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
                  {Math.round(readingProgress)}%
                </Text>
              </View>
            )}
            
            {memorizedVerses > 0 && (
              <View style={styles.progressItem}>
                <Ionicons name="fitness" size={12} color={colors.accent} />
                <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
                  {memorizedVerses} memorized
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );
};

const QuranJuzNavigation: React.FC<QuranJuzNavigationProps> = ({
  visible,
  onClose,
  onJuzSelect,
}) => {
  const { colors } = useAppTheme();
  const { memorationProgress, readingSessions } = useQuranContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter Juz based on search
  const filteredJuzs = useMemo(() => {
    if (!searchQuery.trim()) return JUZ_DATA;
    
    return JUZ_DATA.filter(juz => 
      juz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      juz.arabicName.includes(searchQuery) ||
      juz.id.toString().includes(searchQuery)
    );
  }, [searchQuery]);

  const getJuzProgress = (juz: JuzInfo) => {
    // Calculate reading progress for this Juz
    const relevantSessions = readingSessions.filter(session => 
      session.startSurah >= juz.startSurah && session.startSurah <= juz.endSurah
    );
    
    if (relevantSessions.length === 0) return { readingProgress: 0, memorizedVerses: 0 };
    
    // Simple calculation - can be improved with more detailed tracking
    const totalVersesRead = relevantSessions.reduce((sum, session) => sum + session.versesRead, 0);
    const readingProgress = Math.min((totalVersesRead / juz.totalVerses) * 100, 100);
    
    // Count memorized verses in this Juz range
    const memorizedVerses = memorationProgress.filter(progress => 
      progress.status === 'mastered' &&
      progress.surahNumber >= juz.startSurah && 
      progress.surahNumber <= juz.endSurah
    ).length;
    
    return { readingProgress, memorizedVerses };
  };

  const handleJuzPress = async (juz: JuzInfo) => {
    try {
      await hapticFeedback.light();
      secureLogger.info('Juz selected', { 
        juzId: juz.id, 
        juzName: juz.name,
        startSurah: juz.startSurah,
        startVerse: juz.startVerse
      });
      
      onJuzSelect({
        juzNumber: juz.id,
        startSurah: juz.startSurah,
        startVerse: juz.startVerse,
        endSurah: juz.endSurah,
        endVerse: juz.endVerse,
        name: juz.name,
        arabicName: juz.arabicName,
      });
      onClose();
    } catch (error) {
      secureLogger.error('Error selecting Juz', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    hapticFeedback.light();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Quran by Juz (Para)
            </Text>
            <TouchableOpacity
              onPress={onClose}
              {...getButtonA11yProps('Close', 'Close Juz navigation', false)}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Navigate through 30 parts of the Quran
          </Text>
          
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search Juz..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search Juz"
              accessibilityHint="Type to search by name or number"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading Juz data...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredJuzs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const { readingProgress, memorizedVerses } = getJuzProgress(item);
              return (
                <JuzItem
                  juz={item}
                  onPress={() => handleJuzPress(item)}
                  readingProgress={readingProgress}
                  memorizedVerses={memorizedVerses}
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.juzList}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    ...TYPOGRAPHY_PRESETS.sectionTitle(20),
    fontWeight: '600',
  },
  subtitle: {
    ...TYPOGRAPHY_PRESETS.bodyText(14),
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  juzList: {
    padding: 16,
  },
  juzItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  juzNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  juzNumberText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(18),
  },
  juzInfo: {
    flex: 1,
  },
  juzTitles: {
    marginBottom: 4,
  },
  juzEnglishName: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
    marginBottom: 2,
  },
  juzArabicName: {
    ...TYPOGRAPHY_PRESETS.arabicLabel(14),
    textAlign: 'right',
  },
  juzDetails: {
    marginBottom: 8,
  },
  juzDetail: {
    ...TYPOGRAPHY_PRESETS.caption(12),
    marginBottom: 2,
  },
  progressContainer: {
    gap: 6,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...TYPOGRAPHY_PRESETS.caption(11),
    minWidth: 35,
  },
});

export default QuranJuzNavigation; 