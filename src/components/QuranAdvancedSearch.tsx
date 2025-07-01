import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  I18nManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranSearchResult } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName, AVAILABLE_TRANSLATIONS } from '../utils/quranApi';
import { TYPOGRAPHY_PRESETS } from '../utils/fonts';

interface QuranAdvancedSearchProps {
  visible: boolean;
  onClose: () => void;
  onVerseSelect: (surah: number, verse: number) => void;
}

const QuranAdvancedSearch: React.FC<QuranAdvancedSearchProps> = ({
  visible,
  onClose,
  onVerseSelect,
}) => {
  const { colors } = useAppTheme();
  const { settings, searchHistory } = useQuranContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'translation' | 'topic'>('translation');
  const [selectedTranslation, setSelectedTranslation] = useState(settings.defaultTranslation || 'en_sahih');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Search filters
  const [filters, setFilters] = useState({
    includeArabic: true,
    includeTranslation: true,
    surahFilter: [] as number[],
    juzFilter: [] as number[],
    revelationType: 'all' as 'all' | 'meccan' | 'medinan'
  });

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Minimum 3 characters required for search
    if (searchTerm.trim().length < 3) {
      setSearchError('Please enter at least 3 characters to search');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      secureLogger.info('Starting enhanced Quran search', { 
        searchTerm: searchTerm, 
        searchType,
        translation: selectedTranslation,
        filters,
        timestamp: new Date().toISOString()
      });

      // Call the enhanced API search function
      const apiResults = await quranApi.searchQuran(searchTerm, selectedTranslation, 30);
      
      // Transform API results to match our SearchResult interface
      const transformedResults: QuranSearchResult[] = apiResults.map((result, index) => ({
        id: `${result.surahNumber}-${result.verseNumber}-${index}`,
        title: `${getSurahName(result.surahNumber)} ${result.surahNumber}:${result.verseNumber}`,
        subtitle: result.translation || '',
        category: 'Quran Verse',
        icon: 'book',
        keywords: result.tags || [],
        surahNumber: result.surahNumber,
        verseNumber: result.verseNumber,
        text: result.arabicText || '',
        translation: result.translation || '',
        context: result.context,
        relevanceScore: result.score || 0.5,
        score: result.score || 0.5,
        tags: result.tags || [],
        arabicText: result.arabicText || ''
      }));

      // Apply additional filters
      let filteredResults = transformedResults;
      
      if (filters.surahFilter.length > 0) {
        filteredResults = filteredResults.filter(r => 
          filters.surahFilter.includes(r.surahNumber)
        );
      }

      if (filters.revelationType !== 'all') {
        // This would require surah metadata integration
        // For now, we'll keep all results
      }

      setSearchResults(filteredResults);
      
      // Add to recent searches
      if (searchTerm && !recentSearches.includes(searchTerm)) {
        const updatedRecent = [searchTerm, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedRecent);
      }

      await hapticFeedback.light();
      
      secureLogger.info('Enhanced Quran search completed successfully', { 
        searchTerm: searchTerm,
        totalResults: filteredResults.length,
        averageScore: filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length
      });

    } catch (error) {
      secureLogger.error('Error performing enhanced Quran search', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        searchTerm: searchTerm?.trim(),
        searchType,
        translation: selectedTranslation
      });
      
      setSearchError('Search failed. Please try again.');
      setSearchResults([]);
      
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, searchType, selectedTranslation, filters, recentSearches]);

  // Auto-search when term changes (with debounce)
  useEffect(() => {
    if (searchTerm.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      // Clear results if less than 3 characters
      setSearchResults([]);
      setSearchError(null);
    }
  }, [searchTerm, performSearch]);

  const handleRecentSearchSelect = (recent: string) => {
    setSearchTerm(recent);
    setSearchError(null);
  };

  const renderSearchFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.filtersTitle, { color: colors.text.primary }]}>
          Search Filters
        </Text>
        
        {/* Translation Selection */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>
            Translation:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {AVAILABLE_TRANSLATIONS.map((trans) => (
              <TouchableOpacity
                key={trans.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedTranslation === trans.id 
                      ? colors.primary 
                      : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setSelectedTranslation(trans.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  { 
                    color: selectedTranslation === trans.id 
                      ? colors.text.onPrimary 
                      : colors.text.primary 
                  }
                ]}>
                  {trans.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Type */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>
            Search in:
          </Text>
          <View style={styles.searchTypeButtons}>
            {[
              { key: 'translation', label: 'Translation' },
              { key: 'text', label: 'Arabic Text' },
              { key: 'topic', label: 'Topics' }
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: searchType === type.key 
                      ? colors.primary 
                      : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setSearchType(type.key as any)}
              >
                <Text style={[
                  styles.typeButtonText,
                  { 
                    color: searchType === type.key 
                      ? colors.text.onPrimary 
                      : colors.text.primary 
                  }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderRecentSearches = () => {
    if (recentSearches.length === 0 || searchTerm.trim()) return null;

    return (
      <View style={styles.recentSearchesContainer}>
        <Text style={[styles.recentSearchesTitle, { color: colors.text.primary }]}>
          Recent Searches
        </Text>
        {recentSearches.map((recent, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.recentSearchItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleRecentSearchSelect(recent)}
          >
            <Ionicons name="time" size={16} color={colors.text.secondary} />
            <Text style={[styles.recentSearchText, { color: colors.text.primary }]}>
              {recent}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSearchResult = ({ item }: { item: QuranSearchResult }) => (
    <TouchableOpacity
      style={[styles.searchResult, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => {
        hapticFeedback.light();
        onVerseSelect(item.surahNumber, item.verseNumber);
        onClose();
      }}
    >
      <View style={styles.resultHeader}>
        <Text style={[styles.resultLocation, { color: colors.primary }]}>
          {getSurahName(item.surahNumber)} {item.surahNumber}:{item.verseNumber}
        </Text>
        {item.score && (
          <View style={[styles.scoreIndicator, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.scoreText, { color: colors.accent }]}>
              {Math.round(item.score * 100)}%
            </Text>
          </View>
        )}
      </View>
      
      {item.arabicText && filters.includeArabic && (
        <Text style={[styles.resultArabic, { color: colors.text.primary }]}>
          {String(item.arabicText)}
        </Text>
      )}
      
      {(item.translation || item.text) && filters.includeTranslation && (
        <Text style={[styles.resultTranslation, { color: colors.text.secondary }]}>
          {(() => {
            const translation = String(item.translation || '');
            const arabicText = String(item.arabicText || '');
            
            // Don't show translation if it's the same as Arabic text or empty
            if (!translation || translation === arabicText) {
              return 'Translation loading...';
            }
            
            return translation;
          })()}
        </Text>
      )}
      
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.islamic.green + '20' }]}>
              <Text style={[styles.tagText, { color: colors.islamic.green }]}>
                {typeof tag === 'string' ? tag : String(tag)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Advanced Search
          </Text>
          
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterButton, { backgroundColor: showFilters ? colors.primary + '20' : 'transparent' }]}
          >
            <Ionicons 
              name="options" 
              size={24} 
              color={showFilters ? colors.primary : colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setSearchError(null);
            }}
            placeholder="Search Quran (min 3 characters: 'Allah', 'mercy', 'guidance')..."
            placeholderTextColor={colors.text.tertiary}
            onSubmitEditing={performSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm('');
                setSearchResults([]);
                setSearchError(null);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {searchError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {searchError}
            </Text>
          </View>
        )}

        {renderSearchFilters()}
        {renderRecentSearches()}

        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Searching Quran...
            </Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsCount, { color: colors.text.primary }]}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            <Text style={[styles.resultsSubtext, { color: colors.text.secondary }]}>
              for "{searchTerm}"
            </Text>
          </View>
        )}

        <FlatList
          data={searchResults}
          keyExtractor={(item) => `${item.surahNumber}:${item.verseNumber}`}
          renderItem={renderSearchResult}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.resultsList,
            searchResults.length === 0 && !isSearching && searchTerm.trim().length >= 3 && {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
          ListEmptyComponent={
            !isSearching && searchTerm.trim().length >= 3 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                  No verses found for "{searchTerm}"
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.tertiary }]}>
                  Try different keywords or check spelling
                </Text>
              </View>
            ) : !isSearching && searchTerm.trim().length > 0 && searchTerm.trim().length < 3 ? (
              <View style={styles.emptyState}>
                <Ionicons name="create" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
                  Type at least 3 characters to search
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.tertiary }]}>
                  Enter more characters to start searching the Quran
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    ...TYPOGRAPHY_PRESETS.sectionTitle(18),
  },
  placeholder: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
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
  searchButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
  },
  resultsList: {
    padding: 16,
  },
  searchResult: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  resultLocation: {
    ...TYPOGRAPHY_PRESETS.caption(14),
    fontWeight: '600',
    marginBottom: 8,
  },
  resultArabic: {
    ...TYPOGRAPHY_PRESETS.searchResultArabic(22),
    marginBottom: 12,
  },
  resultTranslation: {
    ...TYPOGRAPHY_PRESETS.searchResultTranslation(15),
    textAlign: 'left',
  },
  filtersContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filtersTitle: {
    ...TYPOGRAPHY_PRESETS.sectionTitle(18),
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
    marginBottom: 8,
  },
  filterChip: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 8,
  },
  filterChipText: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  searchTypeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 8,
  },
  typeButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  recentSearchesContainer: {
    margin: 16,
  },
  recentSearchesTitle: {
    ...TYPOGRAPHY_PRESETS.sectionTitle(18),
    marginBottom: 16,
  },
  recentSearchItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSearchText: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
    marginLeft: 8,
  },
  resultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsCount: {
    ...TYPOGRAPHY_PRESETS.bodyBold(18),
    marginBottom: 8,
  },
  resultsSubtext: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  emptyState: {
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyStateText: {
    ...TYPOGRAPHY_PRESETS.bodyText(18),
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreIndicator: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  scoreText: {
    ...TYPOGRAPHY_PRESETS.bodyText(14),
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tag: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 4,
  },
  tagText: {
    ...TYPOGRAPHY_PRESETS.bodyText(14),
  },
  filterButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
});

export default QuranAdvancedSearch; 