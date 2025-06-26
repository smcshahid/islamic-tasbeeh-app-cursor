# Tasbeeh App

A digital Islamic prayer counter (Tasbeeh) built with Expo 53 and React Native, designed to help Muslims track their dhikr (remembrance of Allah) with precision and beauty.

## Features

### ✨ Core Functionality
- **Touch-to-Count**: Tap anywhere on the counter screen to increment
- **Multiple Counters**: Create unlimited custom counters for different dhikr
- **Session Tracking**: Automatic session management with time tracking
- **Target Setting**: Set goals for your counting sessions
- **Progress Tracking**: Visual progress bars when targets are set

### 📊 Advanced Features
- **Session History**: View detailed history of all counting sessions
- **Statistics**: Comprehensive analytics and progress tracking
- **Local Storage**: All data stored locally with AsyncStorage
- **Offline First**: Works completely offline
- **Cross-Platform**: iOS, Android, and Web support

### 🎨 User Experience
- **Beautiful UI**: Modern gradient-based design with custom colors
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Haptic Feedback**: Physical feedback on mobile devices
- **Multi-Language**: English and Arabic support
- **Accessibility**: Full accessibility compliance

### 🔧 Technical Features
- **Real-time Updates**: Immediate UI updates with debounced storage
- **Session Management**: Smart session lifecycle management
- **Data Persistence**: Reliable data storage and recovery
- **Performance Optimized**: < 50ms tap-to-increment response time

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tasbeeh-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

## Usage

### Basic Counting
1. Open the app - it starts with a "Default" counter
2. Tap anywhere on the main screen to start counting
3. A session automatically begins with your first tap
4. Watch the session timer track your dhikr time
5. Use the Reset button to return counter to 0

### Creating Custom Counters
1. Tap the counter name at the top to open counter selector
2. Select "Add New Counter"
3. Enter a name (e.g., "Subhan Allah", "Alhamdulillah")
4. Optionally set a target count
5. Choose a color theme
6. Start using your new counter

### Setting Targets
1. Tap the "Target" button on the counter screen
2. Enter your desired count goal
3. Watch the progress bar fill as you count
4. Get notified when you reach your target

### Viewing History
1. Go to the History tab
2. View all completed sessions
3. Filter by date or counter
4. See detailed statistics and progress

### Customizing Settings
1. Go to the Settings tab
2. Toggle haptic feedback on/off
3. Switch between light/dark themes
4. Change language preference
5. Manage your counters

## App Architecture

### Data Flow
- **Local-First**: All data stored in AsyncStorage first
- **Session Management**: Individual counting sessions with timestamps
- **State Persistence**: Counters and settings persist across app restarts

### Performance
- **Counter Response**: < 50ms tap-to-increment
- **Auto-Save**: Debounced saves every 500ms
- **Memory Efficient**: Optimized for long counting sessions

## File Structure

```
tasbeeh-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Main counter screen
│   │   ├── history.tsx    # History and statistics
│   │   └── settings.tsx   # App settings
│   └── _layout.tsx        # Root layout
├── src/
│   ├── contexts/          # React Context providers
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── package.json
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
└── tsconfig.json         # TypeScript configuration
```

## Key Components

### TasbeehContext
Central state management using React Context and useReducer:
- Counter management (create, update, delete, increment, reset)
- Session tracking (start, end, update)
- Settings management
- Local storage operations

### Counter Screen
Main interface with:
- Large, prominent counter display
- Session timer
- Progress bar (when target is set)
- Touch-to-increment functionality
- Reset and target setting buttons

### History Screen
Analytics and session tracking:
- Filterable session list
- Statistics cards
- Time-based filtering
- Sorting options

### Settings Screen
App configuration:
- Theme and language settings
- Counter management
- Haptic feedback toggle
- Account settings

## Technical Specifications

### Dependencies
- **Expo SDK 53**: Latest Expo framework
- **Expo Router**: File-based routing
- **AsyncStorage**: Local data persistence
- **Expo Haptics**: Tactile feedback
- **Expo Linear Gradient**: Beautiful gradients
- **TypeScript**: Type safety

### Platform Support
- **iOS**: 12.0 and above
- **Android**: API 21 (Android 5.0) and above
- **Web**: Modern browsers with localStorage support

### Performance Requirements
- Counter response time: < 50ms
- App launch time: < 2 seconds
- Storage operations: < 500ms (debounced)
- Memory usage: < 10MB local data

## Development

### Running the App
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on web
npx expo start --web
```

### Building for Production
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact: support@tasbeehapp.com

## Acknowledgments

- Designed for the Muslim community
- Built with modern React Native best practices
- Follows Islamic app development guidelines
- Optimized for daily dhikr practice

---

**May Allah accept our dhikr and grant us His mercy and blessings. Ameen.** 