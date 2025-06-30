import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranSearchResult } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { quranApi, getSurahName } from '../utils/quranApi';

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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'translation' | 'topic'>('translation');

  const performSearch = async () => {
    // Validate search term
    if (!searchTerm || !searchTerm.trim()) {
      secureLogger.info('Search term empty or invalid, skipping search', { 
        searchTerm: searchTerm || 'undefined',
        trimmed: searchTerm?.trim() || 'undefined'
      });
      return;
    }

    try {
      setIsSearching(true);
      secureLogger.info('Starting Quran search', { 
        searchTerm: searchTerm.trim(), 
        searchType,
        timestamp: new Date().toISOString()
      });

      // Simulate realistic search delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mock search results based on search term
      const mockResults: QuranSearchResult[] = [];
      
      // Always include Bismillah if search contains Allah or God
      if (searchTerm.toLowerCase().includes('allah') || searchTerm.toLowerCase().includes('god')) {
        mockResults.push({
          surahNumber: 1,
          verseNumber: 1,
          arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
          score: 0.95,
          tags: ['blessing', 'mercy', 'Allah'],
        });
      }

      // Add Ayat al-Kursi for Allah searches
      if (searchTerm.toLowerCase().includes('allah')) {
        mockResults.push({
          surahNumber: 2,
          verseNumber: 255,
          arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
          translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer',
          score: 0.87,
          tags: ['Allah', 'monotheism', 'throne'],
        });
      }

      // Add more results for common terms
      if (searchTerm.toLowerCase().includes('mercy') || searchTerm.toLowerCase().includes('rahman')) {
        mockResults.push({
          surahNumber: 55,
          verseNumber: 1,
          arabicText: 'الرَّحْمَٰنُ',
          translation: 'The Most Merciful',
          score: 0.85,
          tags: ['mercy', 'compassion'],
        });
      }

      // If no specific matches, add some general results
      if (mockResults.length === 0) {
        mockResults.push({
          surahNumber: 1,
          verseNumber: 2,
          arabicText: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          translation: 'Praise to Allah, Lord of the worlds',
          score: 0.75,
          tags: ['praise', 'gratitude'],
        });
      }

      setSearchResults(mockResults);
      await hapticFeedback.light();
      
      secureLogger.info('Quran search completed successfully', { 
        searchTerm: searchTerm.trim(),
        resultsCount: mockResults.length,
        searchType,
        resultSurahs: mockResults.map(r => r.surahNumber)
      });

    } catch (error) {
      secureLogger.error('Error performing Quran search', {
        error: error.message || String(error),
        stack: error.stack,
        searchTerm: searchTerm?.trim(),
        searchType
      });
      
      // Gracefully handle error without alerts
      setSearchResults([]);
      secureLogger.info('Quran search failed, returning empty results gracefully');
    } finally {
      setIsSearching(false);
      secureLogger.info('Quran search process completed', { 
        searchTerm: searchTerm?.trim()
      });
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Advanced Search
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search Quran..."
            placeholderTextColor={colors.text.tertiary}
            onSubmitEditing={performSearch}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.primary }]}
          onPress={performSearch}
          disabled={!searchTerm.trim() || isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.text.onPrimary} />
          ) : (
            <Text style={[styles.searchButtonText, { color: colors.text.onPrimary }]}>
              Search
            </Text>
          )}
        </TouchableOpacity>

        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.surahNumber}-${item.verseNumber}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.searchResult, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                onVerseSelect(item.surahNumber, item.verseNumber);
                onClose();
              }}
            >
              <Text style={[styles.resultLocation, { color: colors.primary }]}>
                {getSurahName(item.surahNumber)} {item.verseNumber}
              </Text>
              {item.arabicText && (
                <Text style={[styles.resultArabic, { color: colors.text.primary }]}>
                  {item.arabicText}
                </Text>
              )}
              {item.translation && (
                <Text style={[styles.resultTranslation, { color: colors.text.secondary }]}>
                  {item.translation}
                </Text>
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
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
    fontSize: 18,
    fontWeight: '600',
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
  },
  searchButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultArabic: {
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 28,
  },
  resultTranslation: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default QuranAdvancedSearch; 