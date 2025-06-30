import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import advancedAudioService, { Playlist, AudioTrack } from '../services/AdvancedAudioService';
import * as Sharing from 'expo-sharing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AudioPlaylistManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onPlaylistSelect?: (playlist: Playlist) => void;
}

export default function AudioPlaylistManager({
  isVisible,
  onClose,
  onPlaylistSelect,
}: AudioPlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'duration' | 'tracks'>('created');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [isGridView, setIsGridView] = useState(false);
  const [availableTracks] = useState<AudioTrack[]>([
    // Mock data - in real app, this would come from your audio service
    {
      id: 'track1',
      title: 'Sample Track 1',
      artist: 'Artist 1',
      source: require('../../aladhan.mp3'),
      duration: 180,
      genre: 'Classical',
      artwork: 'https://via.placeholder.com/300',
    },
    {
      id: 'track2',
      title: 'Sample Track 2',
      artist: 'Artist 2',
      source: require('../../aladhan.mp3'),
      duration: 240,
      genre: 'Jazz',
      artwork: 'https://via.placeholder.com/300',
    },
  ]);

  useEffect(() => {
    loadPlaylists();
    
    // Subscribe to playlist events
    const handlePlaylistCreated = (playlist: Playlist) => {
      setPlaylists(prev => [...prev, playlist]);
    };
    
    const handlePlaylistUpdated = (playlist: Playlist) => {
      setPlaylists(prev => prev.map(p => p.id === playlist.id ? playlist : p));
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(playlist);
      }
    };
    
    const handlePlaylistDeleted = (playlistId: string) => {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
    };

    advancedAudioService.on('playlistCreated', handlePlaylistCreated);
    advancedAudioService.on('playlistUpdated', handlePlaylistUpdated);
    advancedAudioService.on('playlistDeleted', handlePlaylistDeleted);

    return () => {
      advancedAudioService.off('playlistCreated', handlePlaylistCreated);
      advancedAudioService.off('playlistUpdated', handlePlaylistUpdated);
      advancedAudioService.off('playlistDeleted', handlePlaylistDeleted);
    };
  }, []);

  const loadPlaylists = () => {
    const allPlaylists = advancedAudioService.getPlaylists();
    setPlaylists(allPlaylists);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      const playlist = await advancedAudioService.createPlaylist(
        newPlaylistName,
        newPlaylistDescription
      );
      
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Playlist created successfully');
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => advancedAudioService.deletePlaylist(playlist.id),
        },
      ]
    );
  };

  const handleAddTrackToPlaylist = (track: AudioTrack) => {
    if (selectedPlaylist) {
      advancedAudioService.addTrackToPlaylist(selectedPlaylist.id, track);
      setShowAddTrackModal(false);
    }
  };

  const handleRemoveTrackFromPlaylist = (trackId: string) => {
    if (selectedPlaylist) {
      Alert.alert(
        'Remove Track',
        'Remove this track from the playlist?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => advancedAudioService.removeTrackFromPlaylist(selectedPlaylist.id, trackId),
          },
        ]
      );
    }
  };

  const handleSharePlaylist = async (playlist: Playlist) => {
    try {
      const playlistData = {
        name: playlist.name,
        description: playlist.description,
        tracks: playlist.tracks.map(track => ({
          title: track.title,
          artist: track.artist,
          duration: track.duration,
        })),
        totalDuration: playlist.totalDuration,
        trackCount: playlist.tracks.length,
      };

      const shareText = `Check out my playlist "${playlist.name}"!\n\n${playlist.tracks.length} tracks • ${formatDuration(playlist.totalDuration)}\n\n${playlist.tracks.map(track => `• ${track.title} - ${track.artist}`).join('\n')}`;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync('data:text/plain;base64,' + btoa(shareText));
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing playlist:', error);
      Alert.alert('Error', 'Failed to share playlist');
    }
  };

  const getFilteredAndSortedPlaylists = () => {
    let filtered = playlists;

    // Apply filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(playlist => 
        filterBy === 'public' ? playlist.isPublic : !playlist.isPublic
      );
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(playlist =>
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'duration':
          return b.totalDuration - a.totalDuration;
        case 'tracks':
          return b.tracks.length - a.tracks.length;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const renderPlaylistCard = ({ item: playlist }: { item: Playlist }) => (
    <TouchableOpacity
      style={[styles.playlistCard, isGridView && styles.playlistCardGrid]}
      onPress={() => setSelectedPlaylist(playlist)}
    >
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FFD23F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.playlistArtwork, isGridView && styles.playlistArtworkGrid]}
      >
        <Text style={styles.playlistInitial}>
          {playlist.name.charAt(0).toUpperCase()}
        </Text>
      </LinearGradient>

      <View style={[styles.playlistInfo, isGridView && styles.playlistInfoGrid]}>
        <Text style={styles.playlistName} numberOfLines={isGridView ? 2 : 1}>
          {playlist.name}
        </Text>
        <Text style={styles.playlistStats}>
          {playlist.tracks.length} tracks • {formatDuration(playlist.totalDuration)}
        </Text>
        {playlist.description && !isGridView && (
          <Text style={styles.playlistDescription} numberOfLines={2}>
            {playlist.description}
          </Text>
        )}
        <View style={styles.playlistTags}>
          {playlist.isPublic && (
            <View style={styles.publicTag}>
              <Text style={styles.tagText}>Public</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.playlistMenu}
        onPress={() => handlePlaylistMenu(playlist)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handlePlaylistMenu = (playlist: Playlist) => {
    Alert.alert(
      playlist.name,
      'Choose an action',
      [
        {
          text: 'Play',
          onPress: () => {
            if (onPlaylistSelect) {
              onPlaylistSelect(playlist);
            }
          },
        },
        {
          text: 'Edit',
          onPress: () => {
            setSelectedPlaylist(playlist);
            setNewPlaylistName(playlist.name);
            setNewPlaylistDescription(playlist.description || '');
            setShowEditModal(true);
          },
        },
        {
          text: 'Share',
          onPress: () => handleSharePlaylist(playlist),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePlaylist(playlist),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderPlaylistDetails = () => (
    <Modal visible={!!selectedPlaylist} animationType="slide" transparent>
      <BlurView intensity={80} style={styles.modalContainer}>
        <View style={styles.detailsModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPlaylist(null)}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedPlaylist?.name}</Text>
            <TouchableOpacity onPress={() => setShowAddTrackModal(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContent}>
            {selectedPlaylist?.tracks.map((track, index) => (
              <View key={track.id} style={styles.trackItem}>
                <Text style={styles.trackNumber}>{index + 1}</Text>
                <Image source={{ uri: track.artwork }} style={styles.trackArtwork} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                </View>
                <Text style={styles.trackDuration}>
                  {formatDuration(track.duration || 0)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveTrackFromPlaylist(track.id)}
                  style={styles.removeTrackButton}
                >
                  <Ionicons name="close" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedPlaylist?.tracks.length === 0 && (
              <View style={styles.emptyPlaylist}>
                <Text style={styles.emptyPlaylistText}>No tracks in this playlist</Text>
                <TouchableOpacity
                  style={styles.addTracksButton}
                  onPress={() => setShowAddTrackModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addTracksButtonText}>Add Tracks</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide">
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Playlists</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.headerButton}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search and Controls */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search playlists..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.sortFilter}>
              <TouchableOpacity style={styles.sortButton}>
                <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
                <Ionicons name="chevron-down-outline" size={16} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Filter: {filterBy}</Text>
                <Ionicons name="chevron-down-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setIsGridView(!isGridView)}
            >
              <Ionicons
                name={isGridView ? "list" : "grid"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlists */}
        <FlatList
          data={getFilteredAndSortedPlaylists()}
          renderItem={renderPlaylistCard}
          keyExtractor={(item) => item.id}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? 'grid' : 'list'}
          contentContainerStyle={styles.playlistsContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Create Playlist Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <BlurView intensity={80} style={styles.modalContainer}>
            <View style={styles.createModal}>
              <Text style={styles.modalTitle}>Create New Playlist</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Playlist name"
                placeholderTextColor="#666"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor="#666"
                value={newPlaylistDescription}
                onChangeText={setNewPlaylistDescription}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreatePlaylist}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {renderPlaylistDetails()}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortFilter: {
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 5,
  },
  viewToggle: {
    padding: 10,
  },
  playlistsContainer: {
    padding: 20,
  },
  playlistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistCardGrid: {
    width: (screenWidth - 60) / 2,
    marginHorizontal: 5,
    flexDirection: 'column',
    alignItems: 'center',
  },
  playlistArtwork: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  playlistArtworkGrid: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 0,
    marginBottom: 10,
  },
  playlistInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistInfoGrid: {
    alignItems: 'center',
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistStats: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  playlistDescription: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  playlistTags: {
    flexDirection: 'row',
  },
  publicTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  playlistMenu: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 30,
    width: screenWidth - 40,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.8,
    width: screenWidth,
    position: 'absolute',
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackNumber: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
  },
  trackArtwork: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  trackDuration: {
    color: '#999',
    fontSize: 12,
    marginRight: 10,
  },
  removeTrackButton: {
    padding: 5,
  },
  emptyPlaylist: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPlaylistText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  addTracksButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTracksButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
}); 