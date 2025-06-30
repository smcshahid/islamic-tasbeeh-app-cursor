import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranSurah } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { SURAH_METADATA, getSurahName } from '../utils/quranApi';

interface SurahListProps {
  visible: boolean;
  onClose: () => void;
  onSurahSelect: (surah: QuranSurah) => void;
  mode?: 'list' | 'grid' | 'detailed';
  showMemorizationProgress?: boolean;
  showReadingProgress?: boolean;
}

interface SurahItemProps {
  surah: Omit<QuranSurah, 'verses'>;
  index: number;
  onPress: () => void;
  mode: 'list' | 'grid' | 'detailed';
  memorizedVerses?: number;
  totalVerses: number;
  lastReadVerse?: number;
  showProgress: boolean;
}

const SurahItem: React.FC<SurahItemProps> = ({
  surah,
  index,
  onPress,
  mode,
  memorizedVerses = 0,
  totalVerses,
  lastReadVerse = 0,
  showProgress,
}) => {
  const { colors } = useAppTheme();
  
  const memorizationProgress = memorizedVerses > 0 ? (memorizedVerses / totalVerses) * 100 : 0;
  const readingProgress = lastReadVerse > 0 ? (lastReadVerse / totalVerses) * 100 : 0;

  const renderListView = () => (
    <TouchableOpacity
      style={[styles.surahItemList, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      {...getButtonA11yProps(
        `${surah.englishName}`,
        `Surah ${surah.id}, ${surah.meaning}, ${totalVerses} verses, ${surah.revelationType}`,
        false
      )}
    >
      <View style={[styles.surahNumber, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.surahNumberText, { color: colors.primary }]}>
          {surah.id}
        </Text>
      </View>
      
      <View style={styles.surahInfo}>
        <View style={styles.surahNames}>
          <Text style={[styles.surahEnglishName, { color: colors.text.primary }]}>
            {surah.englishName}
          </Text>
          <Text style={[styles.surahArabicName, { color: colors.text.secondary }]}>
            {surah.name}
          </Text>
        </View>
        
        <View style={styles.surahMeta}>
          <Text style={[styles.surahMeaning, { color: colors.text.secondary }]}>
            {surah.meaning}
          </Text>
          <View style={styles.surahStats}>
            <Text style={[styles.surahStat, { color: colors.text.tertiary }]}>
              {totalVerses} verses
            </Text>
            <Text style={[styles.surahStat, { color: colors.text.tertiary }]}>
              •
            </Text>
            <Text style={[styles.surahStat, { color: colors.text.tertiary }]}>
              {surah.revelationType}
            </Text>
          </View>
        </View>

        {showProgress && (memorizedVerses > 0 || lastReadVerse > 0) && (
          <View style={styles.progressContainer}>
            {memorizedVerses > 0 && (
              <View style={styles.progressItem}>
                <Ionicons name="brain" size={12} color={colors.accent} />
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { backgroundColor: colors.accent, width: `${memorizationProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text.tertiary }]}>
                  {memorizedVerses}/{totalVerses}
                </Text>
              </View>
            )}
            
            {lastReadVerse > 0 && (
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
                  {lastReadVerse}/{totalVerses}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  const renderGridView = () => (
    <TouchableOpacity
      style={[styles.surahItemGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      {...getButtonA11yProps(`${surah.englishName}`, `${totalVerses} verses`, false)}
    >
      <View style={[styles.surahNumberGrid, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.surahNumberTextGrid, { color: colors.primary }]}>
          {surah.id}
        </Text>
      </View>
      
      <Text style={[styles.surahEnglishNameGrid, { color: colors.text.primary }]}>
        {surah.englishName}
      </Text>
      <Text style={[styles.surahArabicNameGrid, { color: colors.text.secondary }]}>
        {surah.name}
      </Text>
      <Text style={[styles.surahVersesGrid, { color: colors.text.tertiary }]}>
        {totalVerses} verses
      </Text>
      
      {showProgress && memorizedVerses > 0 && (
        <View style={[styles.progressBarGrid, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFillGrid, 
              { backgroundColor: colors.accent, width: `${memorizationProgress}%` }
            ]} 
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDetailedView = () => (
    <TouchableOpacity
      style={[styles.surahItemDetailed, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      {...getButtonA11yProps(
        `${surah.englishName}`,
        `Detailed view: ${surah.meaning}, revelation order ${surah.revelationOrder}`,
        false
      )}
    >
      <View style={styles.surahHeader}>
        <View style={[styles.surahNumber, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.surahNumberText, { color: colors.primary }]}>
            {surah.id}
          </Text>
        </View>
        
        <View style={styles.surahTitles}>
          <Text style={[styles.surahEnglishName, { color: colors.text.primary }]}>
            {surah.englishName}
          </Text>
          <Text style={[styles.surahArabicNameLarge, { color: colors.text.secondary }]}>
            {surah.name}
          </Text>
        </View>
        
        <View style={[styles.revelationBadge, { 
          backgroundColor: surah.revelationType === 'meccan' ? colors.islamic.green + '20' : colors.islamic.blue + '20' 
        }]}>
          <Text style={[styles.revelationText, { 
            color: surah.revelationType === 'meccan' ? colors.islamic.green : colors.islamic.blue 
          }]}>
            {surah.revelationType}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.surahMeaningDetailed, { color: colors.text.secondary }]}>
        "{surah.meaning}"
      </Text>
      
      <View style={styles.surahDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="document-text" size={16} color={colors.text.tertiary} />
          <Text style={[styles.detailText, { color: colors.text.tertiary }]}>
            {totalVerses} verses
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="list" size={16} color={colors.text.tertiary} />
          <Text style={[styles.detailText, { color: colors.text.tertiary }]}>
            Revelation #{surah.revelationOrder}
          </Text>
        </View>
        
        {surah.bismillahPre && (
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color={colors.islamic.gold} />
            <Text style={[styles.detailText, { color: colors.text.tertiary }]}>
              With Bismillah
            </Text>
          </View>
        )}
      </View>
      
      {showProgress && (memorizedVerses > 0 || lastReadVerse > 0) && (
        <View style={styles.progressContainerDetailed}>
          {memorizedVerses > 0 && (
            <View style={styles.progressItemDetailed}>
              <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
                Memorization Progress
              </Text>
              <View style={styles.progressWithText}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { backgroundColor: colors.accent, width: `${memorizationProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressPercent, { color: colors.text.secondary }]}>
                  {Math.round(memorizationProgress)}%
                </Text>
              </View>
            </View>
          )}
          
          {lastReadVerse > 0 && (
            <View style={styles.progressItemDetailed}>
              <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
                Reading Progress
              </Text>
              <View style={styles.progressWithText}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { backgroundColor: colors.secondary, width: `${readingProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressPercent, { color: colors.text.secondary }]}>
                  {Math.round(readingProgress)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  switch (mode) {
    case 'grid':
      return renderGridView();
    case 'detailed':
      return renderDetailedView();
    default:
      return renderListView();
  }
};

const QuranSurahList: React.FC<SurahListProps> = ({
  visible,
  onClose,
  onSurahSelect,
  mode = 'list',
  showMemorizationProgress = false,
  showReadingProgress = false,
}) => {
  const { colors } = useAppTheme();
  const { surahs, memorationProgress, readingSessions, isLoading } = useQuranContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'meccan' | 'medinan'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'verses' | 'revelation'>('order');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detailed'>(mode);

  // Memoized filtered and sorted surahs
  const filteredSurahs = useMemo(() => {
    let filtered = SURAH_METADATA.filter(surah => {
      const matchesSearch = 
        surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.name.includes(searchQuery) ||
        surah.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.id.toString().includes(searchQuery);
      
      const matchesFilter = 
        filterType === 'all' || surah.revelationType === filterType;
      
      return matchesSearch && matchesFilter;
    });

    // Sort based on sortBy criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.englishName.localeCompare(b.englishName);
        case 'verses':
          return b.totalVerses - a.totalVerses;
        case 'revelation':
          return a.revelationOrder - b.revelationOrder;
        default:
          return a.id - b.id;
      }
    });

    return filtered;
  }, [searchQuery, filterType, sortBy]);

  // Get memorization progress for a surah
  const getMemorizationProgress = (surahNumber: number) => {
    return memorationProgress.filter(
      p => p.surahNumber === surahNumber && p.status === 'mastered'
    ).length;
  };

  // Get last read verse for a surah
  const getLastReadVerse = (surahNumber: number) => {
    const sessions = readingSessions.filter(s => s.startSurah === surahNumber);
    if (sessions.length === 0) return 0;
    
    const lastSession = sessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];
    
    return lastSession.endVerse || lastSession.startVerse || 0;
  };

  const handleSurahPress = async (surah: Omit<QuranSurah, 'verses'>) => {
    try {
      // Validate surah data
      if (!surah || !surah.id || !surah.englishName) {
        secureLogger.error('Invalid surah data provided', { 
          surah: surah ? JSON.stringify(surah).substring(0, 100) : 'null',
          hasId: !!surah?.id,
          hasName: !!surah?.englishName
        });
        return;
      }

      secureLogger.info('Surah selection initiated', { 
        surahId: surah.id, 
        surahName: surah.englishName,
        totalVerses: surah.totalVerses,
        type: surah.revelationType
      });

      await hapticFeedback.light();
      
      // Convert to full QuranSurah object (verses will be loaded by context)
      const fullSurah: QuranSurah = {
        ...surah,
        verses: [], // Will be loaded by the context
      };
      
      secureLogger.info('Calling onSurahSelect', { 
        surahId: surah.id,
        hasCallback: typeof onSurahSelect === 'function'
      });

      onSurahSelect(fullSurah);
      
      secureLogger.info('Closing surah list');
      onClose();
      
      secureLogger.info('Surah selection completed successfully', { 
        surahId: surah.id 
      });
    } catch (error) {
      secureLogger.error('Error selecting surah', { 
        error: error.message || String(error),
        stack: error.stack,
        surahId: surah?.id,
        surahName: surah?.englishName
      });
      // Don't show alert, just log the error
      secureLogger.info('Surah selection failed, continuing without interruption');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    hapticFeedback.light();
  };

  const toggleSort = () => {
    const sortOptions: Array<'order' | 'name' | 'verses' | 'revelation'> = 
      ['order', 'name', 'verses', 'revelation'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
    hapticFeedback.light();
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'name': return 'Name';
      case 'verses': return 'Verses';
      case 'revelation': return 'Revelation';
      default: return 'Order';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Quran Surahs
        </Text>
        <TouchableOpacity
          onPress={onClose}
          {...getButtonA11yProps('Close', 'Close surah list', false)}
        >
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search surahs..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search surahs"
          accessibilityHint="Type to search by name, meaning, or number"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.filterButtons}>
          {(['all', 'meccan', 'medinan'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: filterType === type ? colors.primary : colors.surface,
                  borderColor: colors.border 
                }
              ]}
              onPress={() => {
                setFilterType(type);
                hapticFeedback.light();
              }}
              {...getButtonA11yProps(
                `Filter by ${type}`,
                `Show ${type === 'all' ? 'all surahs' : `${type} surahs only`}`,
                filterType === type
              )}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterType === type ? colors.text.onPrimary : colors.text.secondary }
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.viewControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleSort}
            {...getButtonA11yProps('Sort options', `Currently sorted by ${getSortLabel()}`, false)}
          >
            <Ionicons name="funnel" size={16} color={colors.text.secondary} />
            <Text style={[styles.controlButtonText, { color: colors.text.secondary }]}>
              {getSortLabel()}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              const modes: Array<'list' | 'grid' | 'detailed'> = ['list', 'grid', 'detailed'];
              const currentIndex = modes.indexOf(viewMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              setViewMode(modes[nextIndex]);
              hapticFeedback.light();
            }}
            {...getButtonA11yProps('View mode', `Current view: ${viewMode}`, false)}
          >
            <Ionicons 
              name={viewMode === 'list' ? 'list' : viewMode === 'grid' ? 'grid' : 'document-text'} 
              size={16} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.resultsCount, { color: colors.text.tertiary }]}>
        {filteredSurahs.length} of 114 surahs
      </Text>
    </View>
  );

  const renderSurah = ({ item, index }: { item: Omit<QuranSurah, 'verses'>; index: number }) => (
    <SurahItem
      surah={item}
      index={index}
      onPress={() => handleSurahPress(item)}
      mode={viewMode}
      memorizedVerses={getMemorizationProgress(item.id)}
      totalVerses={item.totalVerses}
      lastReadVerse={getLastReadVerse(item.id)}
      showProgress={showMemorizationProgress || showReadingProgress}
    />
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading Surahs...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSurahs}
            renderItem={renderSurah}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode} // Force re-render when view mode changes
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewControls: {
    flexDirection: 'row',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  controlButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  resultsCount: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  
  // List view styles
  surahItemList: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  surahNumberText: {
    fontSize: 16,
    fontWeight: '600',
  },
  surahInfo: {
    flex: 1,
  },
  surahNames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  surahEnglishName: {
    fontSize: 16,
    fontWeight: '600',
  },
  surahArabicName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  surahMeta: {
    marginBottom: 4,
  },
  surahMeaning: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  surahStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahStat: {
    fontSize: 12,
    marginRight: 8,
  },
  
  // Grid view styles
  surahItemGrid: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  surahNumberGrid: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  surahNumberTextGrid: {
    fontSize: 14,
    fontWeight: '600',
  },
  surahEnglishNameGrid: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  surahArabicNameGrid: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  surahVersesGrid: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressBarGrid: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  progressFillGrid: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Detailed view styles
  surahItemDetailed: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  surahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  surahTitles: {
    flex: 1,
    marginLeft: 16,
  },
  surahArabicNameLarge: {
    fontSize: 18,
    fontWeight: '500',
  },
  revelationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  revelationText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  surahMeaningDetailed: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  surahDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Progress styles
  progressContainer: {
    marginTop: 8,
  },
  progressContainerDetailed: {
    marginTop: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressItemDetailed: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    minWidth: 30,
  },
  progressWithText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 12,
    marginLeft: 8,
    minWidth: 30,
  },
});

export default QuranSurahList; 