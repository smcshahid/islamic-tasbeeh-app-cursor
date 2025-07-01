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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useQuranContext } from '../contexts/QuranContext';
import { QuranBookmark } from '../types';
import { accessibilityManager, getButtonA11yProps } from '../utils/accessibility';
import { hapticFeedback } from '../utils/haptics';
import { secureLogger } from '../utils/secureLogger';
import { getSurahName } from '../utils/quranApi';
import { TYPOGRAPHY_PRESETS } from '../utils/fonts';

interface QuranBookmarkManagerProps {
  visible: boolean;
  onClose: () => void;
  onBookmarkSelect: (surah: number, verse: number) => void;
}

interface BookmarkCreateEditProps {
  visible: boolean;
  onClose: () => void;
  onSave: (bookmark: Partial<QuranBookmark>) => void;
  bookmark?: QuranBookmark | null;
  surahNumber?: number;
  verseNumber?: number;
}

interface BookmarkFolderProps {
  visible: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, color: string) => void;
}

const BOOKMARK_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

const BOOKMARK_CATEGORIES = [
  { id: 'favorite', name: 'Favorites', icon: 'heart', color: '#EF4444' },
  { id: 'study', name: 'Study', icon: 'school', color: '#3B82F6' },
  { id: 'memorization', name: 'Memorization', icon: 'fitness', color: '#22C55E' },
  { id: 'reflection', name: 'Reflection', icon: 'bulb', color: '#EAB308' },
  { id: 'dua', name: 'Duas', icon: 'hands-pray', color: '#8B5CF6' },
  { id: 'guidance', name: 'Guidance', icon: 'compass', color: '#06B6D4' },
  { id: 'comfort', name: 'Comfort', icon: 'shield-checkmark', color: '#EC4899' },
  { id: 'general', name: 'General', icon: 'bookmark', color: '#6B7280' },
];

const BookmarkCreateEdit: React.FC<BookmarkCreateEditProps> = ({
  visible,
  onClose,
  onSave,
  bookmark,
  surahNumber,
  verseNumber,
}) => {
  const { colors } = useAppTheme();
  const [label, setLabel] = useState(bookmark?.label || '');
  const [notes, setNotes] = useState(bookmark?.notes || '');
  const [selectedColor, setSelectedColor] = useState(bookmark?.color || BOOKMARK_COLORS[0]);
  const [surah, setSurah] = useState(bookmark?.surahNumber || surahNumber || 1);
  const [verse, setVerse] = useState(bookmark?.verseNumber || verseNumber || 1);

  useEffect(() => {
    if (bookmark) {
      setLabel(bookmark.label || '');
      setNotes(bookmark.notes || '');
      setSelectedColor(bookmark.color || BOOKMARK_COLORS[0]);
      setSurah(bookmark.surahNumber);
      setVerse(bookmark.verseNumber);
    } else {
      setLabel('');
      setNotes('');
      setSelectedColor(BOOKMARK_COLORS[0]);
      setSurah(surahNumber || 1);
      setVerse(verseNumber || 1);
    }
  }, [bookmark, surahNumber, verseNumber]);

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a label for the bookmark.');
      return;
    }

    const bookmarkData: Partial<QuranBookmark> = {
      label: label.trim(),
      notes: notes.trim(),
      color: selectedColor,
      surahNumber: surah,
      verseNumber: verse,
    };

    if (bookmark) {
      bookmarkData.id = bookmark.id;
    }

    onSave(bookmarkData);
    onClose();
    hapticFeedback.success();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
            {bookmark ? 'Edit Bookmark' : 'Create Bookmark'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Location */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Location
            </Text>
            <View style={[styles.locationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.locationText, { color: colors.text.primary }]}>
                {getSurahName(surah)} {verse}
              </Text>
              <Text style={[styles.locationSubtext, { color: colors.text.secondary }]}>
                Surah {surah}, Verse {verse}
              </Text>
            </View>
          </View>

          {/* Label */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Label *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text.primary,
                }
              ]}
              value={label}
              onChangeText={setLabel}
              placeholder="Enter bookmark label..."
              placeholderTextColor={colors.text.tertiary}
              maxLength={50}
            />
          </View>

          {/* Notes */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Notes
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text.primary,
                }
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add personal notes or reflections..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* Color Selection */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Color
            </Text>
            <View style={styles.colorContainer}>
              {BOOKMARK_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                  {...getButtonA11yProps('Color option', `Select ${color} as bookmark color`, selectedColor === color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: colors.text.onPrimary }]}>
              {bookmark ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface BookmarkItemProps {
  bookmark: QuranBookmark;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { colors } = useAppTheme();
  const [showActions, setShowActions] = useState(false);

  const handleLongPress = () => {
    setShowActions(!showActions);
    hapticFeedback.light();
  };

  const getBookmarkCategory = () => {
    return BOOKMARK_CATEGORIES.find(cat => 
      bookmark.label?.toLowerCase().includes(cat.name.toLowerCase()) ||
      bookmark.notes?.toLowerCase().includes(cat.name.toLowerCase())
    ) || BOOKMARK_CATEGORIES.find(cat => cat.id === 'general');
  };

  const category = getBookmarkCategory();

  return (
    <View style={[styles.bookmarkItemContainer, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.bookmarkItem, { borderColor: colors.border }]}
        onPress={() => {
          hapticFeedback.light();
          onPress();
        }}
        onLongPress={handleLongPress}
        {...getButtonA11yProps(
          bookmark.label || `Bookmark at ${getSurahName(bookmark.surahNumber)} ${bookmark.verseNumber}`,
          bookmark.notes ? `Notes: ${bookmark.notes}` : 'No notes',
          false
        )}
      >
        {/* Left side - Color indicator and category */}
        <View style={styles.bookmarkLeft}>
          <View style={[styles.bookmarkColor, { backgroundColor: bookmark.color || category?.color }]} />
          <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' }]}>
            <Ionicons name={category?.icon as any} size={14} color={category?.color} />
          </View>
        </View>

        {/* Main content */}
        <View style={styles.bookmarkInfo}>
          <View style={styles.bookmarkHeader}>
            <Text style={[styles.bookmarkLabel, { color: colors.text.primary }]}>
              {bookmark.label || 'Unnamed Bookmark'}
            </Text>
            <Text style={[styles.bookmarkDate, { color: colors.text.tertiary }]}>
              {new Date(bookmark.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color={colors.text.secondary} />
            <Text style={[styles.bookmarkLocation, { color: colors.text.secondary }]}>
              {getSurahName(bookmark.surahNumber)} {bookmark.verseNumber}
            </Text>
          </View>
          
          {bookmark.notes && (
            <Text style={[styles.bookmarkNotes, { color: colors.text.tertiary }]} numberOfLines={2}>
              {bookmark.notes}
            </Text>
          )}
        </View>
        
        {/* Right side - Quick actions */}
        <View style={styles.bookmarkRight}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primary + '10' }]}
            onPress={() => {
              hapticFeedback.light();
              onPress();
            }}
          >
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleLongPress}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={[styles.actionsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={() => {
              hapticFeedback.light();
              onEdit();
              setShowActions(false);
            }}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={() => {
              Alert.alert(
                'Delete Bookmark',
                `Are you sure you want to delete "${bookmark.label || 'this bookmark'}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      hapticFeedback.success();
                      onDelete();
                      setShowActions(false);
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash" size={16} color={colors.semantic.error} />
            <Text style={[styles.actionButtonText, { color: colors.semantic.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const QuranBookmarkManager: React.FC<QuranBookmarkManagerProps> = ({
  visible,
  onClose,
  onBookmarkSelect,
}) => {
  const { colors } = useAppTheme();
  const { bookmarks, addBookmark, removeBookmark, updateBookmark } = useQuranContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<QuranBookmark | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'location' | 'label'>('date');
  const [filterColor, setFilterColor] = useState<string | null>(null);

  // Enhanced statistics
  const bookmarkStats = useMemo(() => {
    const recent = bookmarks.filter(b => {
      const daysSince = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    
    const categoryCounts = BOOKMARK_CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] = bookmarks.filter(b => 
        b.label?.toLowerCase().includes(cat.name.toLowerCase()) ||
        b.notes?.toLowerCase().includes(cat.name.toLowerCase())
      ).length;
      return acc;
    }, {} as Record<string, number>);

    const surahs = new Set(bookmarks.map(b => b.surahNumber)).size;
    
    return {
      total: bookmarks.length,
      recent: recent.length,
      surahs,
      mostUsedCategory: Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['general', 0])[0],
      categoryCounts,
    };
  }, [bookmarks]);

  // Recent bookmarks for quick access
  const recentBookmarks = useMemo(() => {
    return bookmarks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [bookmarks]);

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks.filter(bookmark => {
      const matchesSearch = 
        (bookmark.label?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (bookmark.notes?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        getSurahName(bookmark.surahNumber).toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesColor = !filterColor || bookmark.color === filterColor;
      
      return matchesSearch && matchesColor;
    });

    // Sort bookmarks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'location':
          if (a.surahNumber !== b.surahNumber) {
            return a.surahNumber - b.surahNumber;
          }
          return a.verseNumber - b.verseNumber;
        case 'label':
          return (a.label || '').localeCompare(b.label || '');
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [bookmarks, searchQuery, sortBy, filterColor]);

  const handleCreateBookmark = () => {
    setEditingBookmark(null);
    setShowCreateEdit(true);
  };

  const handleEditBookmark = (bookmark: QuranBookmark) => {
    setEditingBookmark(bookmark);
    setShowCreateEdit(true);
  };

  const handleSaveBookmark = async (bookmarkData: Partial<QuranBookmark>) => {
    try {
      if (editingBookmark) {
        await updateBookmark(editingBookmark.id, bookmarkData);
        secureLogger.info('Bookmark updated', { bookmarkId: editingBookmark.id });
      } else {
        await addBookmark(
          bookmarkData.surahNumber!,
          bookmarkData.verseNumber!,
          bookmarkData.label,
          bookmarkData.notes
        );
        secureLogger.info('Bookmark created', { 
          surah: bookmarkData.surahNumber, 
          verse: bookmarkData.verseNumber 
        });
      }
    } catch (error) {
      secureLogger.error('Error saving bookmark', error);
      Alert.alert('Error', 'Failed to save bookmark. Please try again.');
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await removeBookmark(bookmarkId);
      secureLogger.info('Bookmark deleted', { bookmarkId });
    } catch (error) {
      secureLogger.error('Error deleting bookmark', error);
      Alert.alert('Error', 'Failed to delete bookmark. Please try again.');
    }
  };

  const handleBookmarkPress = (bookmark: QuranBookmark) => {
    hapticFeedback.success();
    onBookmarkSelect(bookmark.surahNumber, bookmark.verseNumber);
    onClose();
  };

  const handleQuickBookmark = () => {
    const recentSurah = 1;
    const recentVerse = 1;
    setEditingBookmark(null);
    setShowCreateEdit(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    hapticFeedback.light();
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'location': return 'Location';
      case 'label': return 'Label';
      default: return 'Date';
    }
  };

  if (!visible) return null;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          My Bookmarks
        </Text>
        <TouchableOpacity
          onPress={onClose}
          {...getButtonA11yProps('Close', 'Close bookmark manager', false)}
        >
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Enhanced Statistics */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {bookmarkStats.total}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Total
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>
              {bookmarkStats.surahs}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Surahs
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {bookmarkStats.recent}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              This Week
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Bookmarks */}
      {recentBookmarks.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Recent Bookmarks
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentList}>
            {recentBookmarks.map((bookmark) => (
              <TouchableOpacity
                key={bookmark.id}
                style={[styles.recentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  hapticFeedback.light();
                  handleBookmarkPress(bookmark);
                }}
              >
                <View style={[styles.recentColor, { backgroundColor: bookmark.color || BOOKMARK_COLORS[0] }]} />
                <Text style={[styles.recentLabel, { color: colors.text.primary }]} numberOfLines={1}>
                  {bookmark.label || 'Unnamed'}
                </Text>
                <Text style={[styles.recentLocation, { color: colors.text.secondary }]} numberOfLines={1}>
                  {getSurahName(bookmark.surahNumber)} {bookmark.verseNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}

        {/* Search and Controls */}
        <View style={styles.controlsSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search bookmarks..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search bookmarks"
              accessibilityHint="Type to search by label, notes, or location"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                const sortOptions: Array<'date' | 'location' | 'label'> = ['date', 'location', 'label'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
                hapticFeedback.light();
              }}
            >
              <Ionicons name="swap-vertical" size={16} color={colors.text.secondary} />
              <Text style={[styles.controlButtonText, { color: colors.text.secondary }]}>
                {getSortLabel()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateBookmark}
              {...getButtonA11yProps('Add bookmark', 'Create new bookmark', false)}
            >
              <Ionicons name="add" size={20} color={colors.text.onPrimary} />
              <Text style={[styles.addButtonText, { color: colors.text.onPrimary }]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredBookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={searchQuery ? "search" : "bookmark-outline"} 
              size={64} 
              color={colors.text.tertiary} 
            />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              {searchQuery 
                ? 'Try adjusting your search terms or browse all bookmarks'
                : 'Start saving your favorite verses for easy access'
              }
            </Text>
            
            {!searchQuery && (
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={[styles.emptyAction, { backgroundColor: colors.primary }]}
                  onPress={handleCreateBookmark}
                >
                  <Ionicons name="add" size={20} color={colors.text.onPrimary} />
                  <Text style={[styles.emptyActionText, { color: colors.text.onPrimary }]}>
                    Create Your First Bookmark
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.helpTips}>
                  <Text style={[styles.helpTitle, { color: colors.text.primary }]}>
                    💡 Tips for Better Bookmarking:
                  </Text>
                  <Text style={[styles.helpText, { color: colors.text.secondary }]}>
                    • Add meaningful labels to organize your bookmarks
                  </Text>
                  <Text style={[styles.helpText, { color: colors.text.secondary }]}>
                    • Use colors to categorize by themes (study, comfort, guidance)
                  </Text>
                  <Text style={[styles.helpText, { color: colors.text.secondary }]}>
                    • Add personal notes for reflection and context
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredBookmarks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookmarkItem
                bookmark={item}
                onPress={() => handleBookmarkPress(item)}
                onEdit={() => handleEditBookmark(item)}
                onDelete={() => handleDeleteBookmark(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bookmarksList}
          />
        )}

        {/* Create/Edit Bookmark Modal */}
        <BookmarkCreateEdit
          visible={showCreateEdit}
          onClose={() => {
            setShowCreateEdit(false);
            setEditingBookmark(null);
          }}
          onSave={handleSaveBookmark}
          bookmark={editingBookmark}
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
  filterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  controlButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyText(14),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    ...TYPOGRAPHY_PRESETS.sectionTitle(18),
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...TYPOGRAPHY_PRESETS.bodyText(14),
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
  },
  helpTips: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  helpTitle: {
    ...TYPOGRAPHY_PRESETS.bodyBold(14),
    marginBottom: 8,
  },
  helpText: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
  },
  bookmarksList: {
    padding: 16,
  },
  bookmarkItemContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkColor: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 60,
  },
  categoryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bookmarkLabel: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
    marginBottom: 4,
  },
  bookmarkDate: {
    ...TYPOGRAPHY_PRESETS.caption(11),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookmarkLocation: {
    ...TYPOGRAPHY_PRESETS.bodyText(14),
    marginBottom: 4,
  },
  bookmarkNotes: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
    marginBottom: 8,
    lineHeight: 16,
  },
  bookmarkRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAction: {
    padding: 8,
    borderRadius: 8,
  },
  moreButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    ...TYPOGRAPHY_PRESETS.sectionTitle(18),
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY_PRESETS.bodyBold(14),
    marginBottom: 8,
  },
  locationContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
    marginBottom: 4,
  },
  locationSubtext: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
  },
  textInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    height: 100,
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyText(16),
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
  },
  recentSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recentList: {
    padding: 12,
  },
  recentItem: {
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  recentColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  recentLabel: {
    ...TYPOGRAPHY_PRESETS.bodyBold(16),
    marginBottom: 4,
  },
  recentLocation: {
    ...TYPOGRAPHY_PRESETS.bodyText(12),
  },
  controlsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});

export default QuranBookmarkManager; 