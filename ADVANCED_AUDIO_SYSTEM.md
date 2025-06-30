# Advanced Audio System

A comprehensive, SoundCloud-inspired audio system built with Expo 53 and React Native, featuring professional-grade audio playback, recording, playlist management, and social features.

## 🎵 Features Overview

### Core Audio Engine
- **Advanced Playback**: Built on expo-audio with proper lifecycle management
- **Multiple Audio Sources**: Support for local files, remote URLs, and streaming
- **Background Playback**: Continue playing when app is minimized
- **Gapless Playback**: Seamless transitions between tracks
- **Audio Effects**: Real-time audio processing and effects

### 🎮 Player Features
- **Modern UI**: SoundCloud-inspired interface with beautiful gradients and animations
- **Visualizations**: Multiple visualization modes (waveform, spectrum, circular)
- **Advanced Controls**: Play, pause, skip, seek, shuffle, repeat modes
- **Speed Control**: Variable playback speed (0.5x to 2.0x)
- **Volume Control**: Precise volume management
- **Favorites System**: Heart tracks and manage favorites
- **Social Features**: Share tracks and playlists

### 🎤 Recording Studio
- **Professional Recording**: High-quality audio recording with multiple presets
- **Real-time Visualization**: Live waveform display during recording
- **Input Monitoring**: Level meters and input gain control
- **Recording Management**: Organize, play back, and delete recordings
- **Quality Settings**: Low, medium, and high-quality recording options
- **Metronome Support**: Built-in metronome for musical recordings

### 📋 Playlist Management
- **Create & Edit**: Full playlist creation and editing capabilities
- **Drag & Drop**: Reorder tracks within playlists (planned)
- **Smart Organization**: Sort by name, date, duration, or track count
- **Search & Filter**: Find playlists quickly with search and filtering
- **Grid/List Views**: Toggle between different viewing modes
- **Sharing**: Export and share playlists with others

### 📊 Analytics & Insights
- **Play Tracking**: Monitor listening habits and play counts
- **Favorites Analytics**: Track most loved content
- **History Management**: Complete playback history with timestamps
- **Usage Statistics**: Detailed insights into audio consumption
- **Recommendations**: AI-powered content suggestions (planned)

## 🏗️ Architecture

### Service Layer (`AdvancedAudioService`)
```typescript
// Singleton service managing all audio operations
const audioService = AdvancedAudioService.getInstance();

// Core features
- Playback control (play, pause, seek, volume)
- Playlist management (create, edit, delete)
- Recording capabilities
- Audio effects processing
- Analytics tracking
- Offline caching
- Social features
```

### Component Architecture
```
src/
├── services/
│   └── AdvancedAudioService.ts     # Core audio service
├── components/
│   ├── AdvancedAudioPlayer.tsx     # Main player UI
│   ├── AudioRecordingStudio.tsx    # Recording interface
│   ├── AudioPlaylistManager.tsx    # Playlist management
│   └── AdvancedAudioDemo.tsx       # Demo component
```

## 🚀 Getting Started

### Installation
```bash
# The system uses existing dependencies:
npm install
# or
yarn install
```

### Required Dependencies
```json
{
  "expo-audio": "~0.4.7",
  "expo-file-system": "~18.1.10",
  "expo-linear-gradient": "~14.1.5",
  "expo-blur": "~14.1.5",
  "expo-sharing": "~13.1.5",
  "@react-native-community/slider": "4.5.6",
  "@react-native-async-storage/async-storage": "~2.1.0"
}
```

### Basic Usage

#### 1. Initialize the Audio Service
```typescript
import AdvancedAudioService from './src/services/AdvancedAudioService';

// Service initializes automatically as singleton
const audioService = AdvancedAudioService.getInstance();
```

#### 2. Play Audio
```typescript
const track: AudioTrack = {
  id: 'track1',
  title: 'My Track',
  artist: 'Artist Name',
  source: require('./audio/track.mp3'), // or { uri: 'https://...' }
  duration: 180,
  artwork: 'https://artwork-url.jpg'
};

await audioService.playTrack(track);
```

#### 3. Create Playlist
```typescript
const playlist = await audioService.createPlaylist(
  'My Playlist',
  'Description here'
);

await audioService.addTrackToPlaylist(playlist.id, track);
```

#### 4. Start Recording
```typescript
const session = await audioService.startRecording('My Recording', 'high');
// ... record audio ...
await audioService.stopRecording(session.id);
```

#### 5. Use Components
```tsx
import AdvancedAudioPlayer from './src/components/AdvancedAudioPlayer';

function MyApp() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <AdvancedAudioPlayer
      isVisible={showPlayer}
      initialTrack={currentTrack}
      onClose={() => setShowPlayer(false)}
    />
  );
}
```

## 🎛️ Component Reference

### AdvancedAudioPlayer
Main audio player with full-screen interface.

**Props:**
```typescript
interface AdvancedAudioPlayerProps {
  initialTrack?: AudioTrack;
  playlist?: Playlist;
  onClose?: () => void;
  isVisible: boolean;
}
```

**Features:**
- Rotating album artwork with animations
- Multiple visualization modes
- Audio effects panel
- Volume and speed controls
- Social interaction buttons

### AudioRecordingStudio
Professional recording interface.

**Props:**
```typescript
interface AudioRecordingStudioProps {
  isVisible: boolean;
  onClose: () => void;
}
```

**Features:**
- Real-time waveform display
- Recording quality selection
- Input level monitoring
- Recorded sessions management
- Metronome support

### AudioPlaylistManager
Comprehensive playlist management.

**Props:**
```typescript
interface AudioPlaylistManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onPlaylistSelect?: (playlist: Playlist) => void;
}
```

**Features:**
- Grid and list view modes
- Search and filtering
- Drag-and-drop reordering
- Playlist sharing
- Track management

### AdvancedAudioDemo
Interactive demo showcasing all features.

**Props:**
```typescript
interface AdvancedAudioDemoProps {
  isVisible: boolean;
  onClose: () => void;
}
```

## 🎵 Audio Track Interface

```typescript
interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  source: AudioSource;
  duration?: number;
  genre?: string;
  album?: string;
  year?: number;
  localPath?: string;
  isFavorite?: boolean;
  playCount?: number;
  lastPlayed?: Date;
  tags?: string[];
  description?: string;
}
```

## 📋 Playlist Interface

```typescript
interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: AudioTrack[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalDuration: number;
  playCount: number;
}
```

## 🎚️ Audio Effects

```typescript
interface AudioEffect {
  id: string;
  name: string;
  type: 'reverb' | 'echo' | 'equalizer' | 'pitch' | 'speed' | 'volume';
  enabled: boolean;
  settings: Record<string, number>;
}
```

## 📊 Playback State

```typescript
interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTrack: AudioTrack | null;
  currentPlaylist: Playlist | null;
  position: number;
  duration: number;
  volume: number;
  playbackRate: number;
  repeatMode: 'none' | 'track' | 'playlist';
  shuffleEnabled: boolean;
  effects: AudioEffect[];
}
```

## 🎤 Recording Session

```typescript
interface RecordingSession {
  id: string;
  name: string;
  duration: number;
  filePath: string;
  createdAt: Date;
  quality: 'low' | 'medium' | 'high';
  format: string;
}
```

## 🚨 Event System

The service uses EventEmitter for real-time updates:

```typescript
// Playback events
audioService.on('playbackStateChanged', (state) => {
  console.log('Playback state:', state);
});

// Playlist events
audioService.on('playlistCreated', (playlist) => {
  console.log('New playlist:', playlist);
});

// Track events
audioService.on('trackFavoriteChanged', (track) => {
  console.log('Favorite changed:', track);
});

// Recording events
audioService.on('recordingStarted', (session) => {
  console.log('Recording started:', session);
});
```

## 💾 Data Persistence

### AsyncStorage Keys
- `advanced_audio_playlists`: Playlist data
- `advanced_audio_analytics`: Usage analytics

### File System Structure
```
DocumentDirectory/
├── audio_cache/          # Cached audio files
│   ├── track1.mp3
│   └── track2.mp3
└── recordings/           # Recorded audio sessions
    ├── rec_123.m4a
    └── rec_456.m4a
```

## 🔧 Customization

### Theming
The system uses consistent color schemes:
- Primary: `#FF6B35` (Orange)
- Secondary: `#F7931E` (Amber)
- Background: Dark gradients
- Text: White/Gray variants

### Extending Functionality
```typescript
// Add custom audio effects
await audioService.addEffect({
  id: 'custom1',
  name: 'My Effect',
  type: 'reverb',
  enabled: false,
  settings: { wetness: 0.5 }
});

// Custom track metadata
const customTrack: AudioTrack = {
  ...baseTrack,
  customData: { mood: 'peaceful', energy: 'low' }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Audio not playing**
   - Check audio source validity
   - Verify network connectivity for remote files
   - Ensure proper permissions

2. **Recording not working**
   - Check microphone permissions
   - Verify recording quality settings
   - Ensure sufficient storage space

3. **Playlist not saving**
   - Check AsyncStorage permissions
   - Verify playlist data structure
   - Clear app data if corrupted

### Debug Mode
Enable detailed logging:
```typescript
// Service logs are prefixed with [AdvancedAudioService]
console.log = (...args) => {
  if (args[0]?.includes('[AdvancedAudioService]')) {
    // Custom debug handling
  }
};
```

## 🚀 Performance Optimization

### Memory Management
- Automatic cleanup of unused audio players
- Efficient caching with size limits
- Lazy loading of audio metadata

### Network Optimization
- Smart caching of remote audio
- Preloading of next tracks
- Adaptive quality based on connection

### Battery Optimization
- Background playback management
- CPU-efficient visualizations
- Smart wake lock handling

## 🔮 Future Enhancements

### Planned Features
- [ ] Real audio effects processing
- [ ] Cloud synchronization
- [ ] Social features (following, sharing)
- [ ] AI-powered recommendations
- [ ] Advanced equalizer with presets
- [ ] Crossfade between tracks
- [ ] Podcast support
- [ ] Sleep timer with fade out
- [ ] Car integration (Android Auto/CarPlay)
- [ ] Voice control

### Technical Improvements
- [ ] Web Assembly audio processing
- [ ] Advanced compression algorithms
- [ ] Real-time collaboration features
- [ ] Offline-first architecture
- [ ] Multi-room audio support

## 📝 License

This advanced audio system is part of the Tasbeeh App project and follows the same licensing terms.

## 🤝 Contributing

When contributing to the audio system:

1. **Follow Patterns**: Use the established service/component architecture
2. **Event-Driven**: Utilize the EventEmitter system for state changes
3. **Type Safety**: Maintain strict TypeScript typing
4. **Performance**: Consider memory and battery impact
5. **Testing**: Add comprehensive tests for new features
6. **Documentation**: Update this README for new features

## 🎯 Integration Examples

### Quran Audio Integration
```typescript
// Integrate with existing Quran features
const quranTrack: AudioTrack = {
  id: `quran_${surah}_${verse}`,
  title: `Surah ${surah}, Verse ${verse}`,
  artist: selectedReciter,
  source: { uri: getQuranAudioUrl(surah, verse, reciter) },
  genre: 'Quran',
  tags: ['quran', 'recitation', surah.toString()]
};

await audioService.playTrack(quranTrack);
```

### Prayer Times Integration
```typescript
// Use for Adhan playback
const adhanTrack: AudioTrack = {
  id: `adhan_${prayerTime}`,
  title: `${prayerTime} Adhan`,
  artist: 'Muezzin',
  source: require('./adhan.mp3'),
  genre: 'Adhan'
};
```

### Tasbeeh Integration
```typescript
// Background dhikr audio
const dhikrTrack: AudioTrack = {
  id: 'dhikr_background',
  title: 'Peaceful Dhikr',
  artist: 'Spiritual Guide',
  source: { uri: dhikrAudioUrl },
  genre: 'Dhikr'
};
```

This comprehensive audio system provides a solid foundation for any audio-related features in your app, with room for extensive customization and future enhancements. 