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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { TYPOGRAPHY_PRESETS } from '../utils/fonts';
import { SURAH_METADATA } from '../utils/quranApi';

const { width } = Dimensions.get('window');

interface QuranPageNavigationProps {
  visible: boolean;
  onClose: () => void;
  onPageSelect: (pageData: {
    pageNumber: number;
    startSurah: number;
    startVerse: number;
    endSurah: number;
    endVerse: number;
    juzNumber: number;
    description: string;
  }) => void;
}

interface PageInfo {
  pageNumber: number;
  startSurah: number;
  startVerse: number;
  endSurah: number;
  endVerse: number;
  juzNumber: number;
  description: string;
}

// Mushaf page data (604 pages total) - Sample data for first 30 pages
const SAMPLE_PAGE_DATA: PageInfo[] = [
  { pageNumber: 1, startSurah: 1, startVerse: 1, endSurah: 2, endVerse: 5, juzNumber: 1, description: 'Al-Fatihah to start of Al-Baqarah' },
  { pageNumber: 2, startSurah: 2, startVerse: 6, endSurah: 2, endVerse: 16, juzNumber: 1, description: 'Al-Baqarah continues' },
  { pageNumber: 3, startSurah: 2, startVerse: 17, endSurah: 2, endVerse: 29, juzNumber: 1, description: 'Al-Baqarah continues' },
  { pageNumber: 4, startSurah: 2, startVerse: 30, endSurah: 2, endVerse: 38, juzNumber: 1, description: 'Story of Adam' },
  { pageNumber: 5, startSurah: 2, startVerse: 39, endSurah: 2, endVerse: 49, juzNumber: 1, description: 'Children of Israel' },
  { pageNumber: 6, startSurah: 2, startVerse: 50, endSurah: 2, endVerse: 59, juzNumber: 1, description: 'Miracles and tests' },
  { pageNumber: 7, startSurah: 2, startVerse: 60, endSurah: 2, endVerse: 70, juzNumber: 1, description: 'The cow story begins' },
  { pageNumber: 8, startSurah: 2, startVerse: 71, endSurah: 2, endVerse: 81, juzNumber: 1, description: 'The cow story continues' },
  { pageNumber: 9, startSurah: 2, startVerse: 82, endSurah: 2, endVerse: 92, juzNumber: 1, description: 'Covenant and disobedience' },
  { pageNumber: 10, startSurah: 2, startVerse: 93, endSurah: 2, endVerse: 101, juzNumber: 1, description: 'Torah and following' },
  { pageNumber: 11, startSurah: 2, startVerse: 102, endSurah: 2, endVerse: 112, juzNumber: 1, description: 'Magic and righteousness' },
  { pageNumber: 12, startSurah: 2, startVerse: 113, endSurah: 2, endVerse: 123, juzNumber: 1, description: 'Religious disputes' },
  { pageNumber: 13, startSurah: 2, startVerse: 124, endSurah: 2, endVerse: 132, juzNumber: 1, description: 'Ibrahim and Kaaba' },
  { pageNumber: 14, startSurah: 2, startVerse: 133, endSurah: 2, endVerse: 141, juzNumber: 1, description: 'Religion of Ibrahim' },
  { pageNumber: 15, startSurah: 2, startVerse: 142, endSurah: 2, endVerse: 151, juzNumber: 2, description: 'Qibla change' },
  { pageNumber: 16, startSurah: 2, startVerse: 152, endSurah: 2, endVerse: 163, juzNumber: 2, description: 'Gratitude and forbidden foods' },
  { pageNumber: 17, startSurah: 2, startVerse: 164, endSurah: 2, endVerse: 176, juzNumber: 2, description: 'Signs of Allah' },
  { pageNumber: 18, startSurah: 2, startVerse: 177, endSurah: 2, endVerse: 188, juzNumber: 2, description: 'True righteousness' },
  { pageNumber: 19, startSurah: 2, startVerse: 189, endSurah: 2, endVerse: 202, juzNumber: 2, description: 'Fighting and Hajj rules' },
  { pageNumber: 20, startSurah: 2, startVerse: 203, endSurah: 2, endVerse: 214, juzNumber: 2, description: 'Hajj and trials' },
  { pageNumber: 21, startSurah: 2, startVerse: 215, endSurah: 2, endVerse: 226, juzNumber: 2, description: 'Charity and marriage laws' },
  { pageNumber: 22, startSurah: 2, startVerse: 227, endSurah: 2, endVerse: 237, juzNumber: 2, description: 'Divorce regulations' },
  { pageNumber: 23, startSurah: 2, startVerse: 238, endSurah: 2, endVerse: 248, juzNumber: 2, description: 'Prayer and Talut story' },
  { pageNumber: 24, startSurah: 2, startVerse: 249, endSurah: 2, endVerse: 259, juzNumber: 2, description: 'Dawud and Jalut' },
  { pageNumber: 25, startSurah: 2, startVerse: 260, endSurah: 2, endVerse: 272, juzNumber: 2, description: 'Ibrahim and charity' },
  { pageNumber: 26, startSurah: 2, startVerse: 273, endSurah: 2, endVerse: 283, juzNumber: 2, description: 'Charity and debt' },
  { pageNumber: 27, startSurah: 2, startVerse: 284, endSurah: 3, endVerse: 10, juzNumber: 2, description: 'End of Baqarah, start of Ali Imran' },
  { pageNumber: 28, startSurah: 3, startVerse: 11, endSurah: 3, endVerse: 21, juzNumber: 2, description: 'Lessons from history' },
  { pageNumber: 29, startSurah: 3, startVerse: 22, endSurah: 3, endVerse: 32, juzNumber: 2, description: 'Mubahala and following' },
  { pageNumber: 30, startSurah: 3, startVerse: 33, endSurah: 3, endVerse: 44, juzNumber: 2, description: 'Family of Imran' },
];

// Generate full page data for demo purposes
const generatePageData = (): PageInfo[] => {
  const pages: PageInfo[] = [...SAMPLE_PAGE_DATA];
  
  // Fill remaining pages with calculated data
  for (let page = 31; page <= 604; page++) {
    const juzNumber = Math.ceil(page / 20.13); // Approximate pages per juz
    const surahNumber = Math.min(114, Math.ceil(page / 5.3)); // Approximate pages per surah
    
    pages.push({
      pageNumber: page,
      startSurah: Math.max(1, surahNumber - 1),
      startVerse: 1,
      endSurah: surahNumber,
      endVerse: 10,
      juzNumber: Math.min(30, juzNumber),
      description: `Page ${page} content`,
    });
  }
  
  return pages;
};

const PAGE_DATA = generatePageData();

interface PageItemProps {
  page: PageInfo;
  onPress: () => void;
  isRead?: boolean;
  currentPage?: boolean;
}

const PageItem: React.FC<PageItemProps> = ({
  page,
  onPress,
  isRead = false,
  currentPage = false,
}) => {
  const { colors } = useAppTheme();
  
  const getSurahName = (surahNumber: number) => {
    const surah = SURAH_METADATA.find(s => s.id === surahNumber);
    return surah?.englishName || `Surah ${surahNumber}`;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.pageItem, 
        { 
          backgroundColor: currentPage ? colors.primary + '10' : colors.surface, 
          borderColor: currentPage ? colors.primary : colors.border,
          borderWidth: currentPage ? 2 : 1,
        }
      ]}
      onPress={onPress}
      {...getButtonA11yProps(
        `Page ${page.pageNumber}`,
        `${page.description}, Juz ${page.juzNumber}`,
        currentPage
      )}
    >
      <View style={styles.pageHeader}>
        <View style={[
          styles.pageNumber, 
          { 
            backgroundColor: currentPage ? colors.primary : colors.primary + '20'
          }
        ]}>
          <Text style={[
            styles.pageNumberText, 
            { color: currentPage ? colors.text.onPrimary : colors.primary }
          ]}>
            {page.pageNumber}
          </Text>
        </View>
        
        <View style={styles.pageInfo}>
          <Text style={[styles.pageRange, { color: colors.text.primary }]}>
            {getSurahName(page.startSurah)} {page.startVerse} - {getSurahName(page.endSurah)} {page.endVerse}
          </Text>
          <Text style={[styles.pageDescription, { color: colors.text.secondary }]}>
            {page.description}
          </Text>
          <Text style={[styles.pageJuz, { color: colors.text.tertiary }]}>
            Juz {page.juzNumber}
          </Text>
        </View>
        
        <View style={styles.pageIndicators}>
          {isRead && (
            <View style={[styles.readIndicator, { backgroundColor: colors.islamic.green }]}>
              <Ionicons name="checkmark" size={12} color={colors.text.onPrimary} />
            </View>
          )}
          {currentPage && (
            <View style={[styles.currentIndicator, { backgroundColor: colors.primary }]}>
              <Ionicons name="bookmark" size={12} color={colors.text.onPrimary} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const QuranPageNavigation: React.FC<QuranPageNavigationProps> = ({
  visible,
  onClose,
  onPageSelect,
}) => {
  const { colors } = useAppTheme();
  const { currentPage, readingSessions, lastReadPosition } = useQuranContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Filter pages based on search
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return PAGE_DATA;
    
    const query = searchQuery.toLowerCase();
    return PAGE_DATA.filter(page => 
      page.pageNumber.toString().includes(query) ||
      page.description.toLowerCase().includes(query) ||
      page.juzNumber.toString().includes(query)
    );
  }, [searchQuery]);

  // Determine which pages have been read
  const getPageReadStatus = (pageNumber: number) => {
    // Simple logic - can be enhanced with more detailed tracking
    return readingSessions.some(session => {
      // Assume each session covers roughly one page
      return session.versesRead > 0;
    });
  };

  // Get current page from last read position
  const getCurrentPageFromPosition = () => {
    if (!lastReadPosition) return 1;
    
    // Rough calculation - in reality this would need precise mapping
    const estimatedPage = Math.max(1, Math.floor(
      (lastReadPosition.surah - 1) * 5.3 + lastReadPosition.verse / 10
    ));
    
    return Math.min(604, estimatedPage);
  };

  const currentActivePageNumber = getCurrentPageFromPosition();

  const handlePagePress = async (page: PageInfo) => {
    try {
      await hapticFeedback.light();
      secureLogger.info('Page selected', { 
        pageNumber: page.pageNumber,
        startSurah: page.startSurah,
        startVerse: page.startVerse,
        juzNumber: page.juzNumber
      });
      
      onPageSelect({
        pageNumber: page.pageNumber,
        startSurah: page.startSurah,
        startVerse: page.startVerse,
        endSurah: page.endSurah,
        endVerse: page.endVerse,
        juzNumber: page.juzNumber,
        description: page.description,
      });
      onClose();
    } catch (error) {
      secureLogger.error('Error selecting page', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    hapticFeedback.light();
  };

  const scrollToCurrentPage = () => {
    // This would scroll to current page in FlatList
    hapticFeedback.light();
  };

  const jumpToPage = () => {
    // Show page number input dialog
    hapticFeedback.light();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Quran by Page
            </Text>
            <TouchableOpacity
              onPress={onClose}
              {...getButtonA11yProps('Close', 'Close page navigation', false)}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Navigate through 604 pages of the Mushaf
          </Text>
          
          {/* Controls */}
          <View style={styles.controls}>
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Search pages..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search pages"
                accessibilityHint="Type to search by page number, content, or Juz"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={scrollToCurrentPage}
                {...getButtonA11yProps('Go to current page', `Jump to page ${currentActivePageNumber}`, false)}
              >
                <Ionicons name="bookmark" size={20} color={colors.text.onPrimary} />
                <Text style={[styles.actionButtonText, { color: colors.text.onPrimary }]}>
                  Current
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                onPress={jumpToPage}
                {...getButtonA11yProps('Jump to page', 'Enter page number to jump to', false)}
              >
                <Ionicons name="search" size={20} color={colors.text.onSecondary} />
                <Text style={[styles.actionButtonText, { color: colors.text.onSecondary }]}>
                  Jump
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading pages...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPages}
            keyExtractor={(item) => item.pageNumber.toString()}
            renderItem={({ item }) => (
              <PageItem
                page={item}
                onPress={() => handlePagePress(item)}
                isRead={getPageReadStatus(item.pageNumber)}
                currentPage={item.pageNumber === currentActivePageNumber}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pageList}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
          />
        )}
        
        {/* Quick Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {currentActivePageNumber}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Current Page
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>
              {Math.round((currentActivePageNumber / 604) * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Progress
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {604 - currentActivePageNumber}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Remaining
            </Text>
          </View>
        </View>
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
  controls: {
    gap: 12,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(14),
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
  pageList: {
    padding: 16,
  },
  pageItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pageNumberText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
  },
  pageInfo: {
    flex: 1,
  },
  pageRange: {
    ...TYPOGRAPHY_PRESETS.bodyBold(14),
    marginBottom: 2,
  },
  pageDescription: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
    marginBottom: 2,
  },
  pageJuz: {
    ...TYPOGRAPHY_PRESETS.caption(11),
  },
  pageIndicators: {
    alignItems: 'center',
    gap: 4,
  },
  readIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY_PRESETS.bodyBold(18),
  },
  statLabel: {
    ...TYPOGRAPHY_PRESETS.caption(11),
    marginTop: 2,
  },
});

export default QuranPageNavigation; 