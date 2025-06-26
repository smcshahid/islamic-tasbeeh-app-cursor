# 🕌 Tasbeeh App - Digital Prayer Counter

A modern, secure, and feature-rich Islamic prayer counter (Tasbeeh) application built with React Native and Expo.

## ✨ Features

### 🔢 Counter Management
- **Multiple Counters**: Create and manage multiple named counters with custom colors
- **Target Setting**: Set personal targets for each counter (33, 99, 100, etc.)
- **Progress Tracking**: Visual progress bars for target completion
- **Haptic Feedback**: Tactile feedback on count increments

### 🏆 Achievement System
- **Progressive Levels**: From Newcomer to Sage with meaningful milestones
- **Smart Notifications**: Contextual achievements for streaks, milestones, and levels
- **Streak Tracking**: Daily consistency tracking with streak rewards
- **Session Analytics**: Detailed session history and statistics

### ☁️ Cloud Sync & Storage
- **Secure Authentication**: Email/password and guest mode support
- **Real-time Sync**: Automatic synchronization across devices
- **Offline-first**: Full functionality without internet connection
- **Data Export/Import**: Backup and restore capabilities

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Beautiful Gradients**: Eye-catching color schemes
- **Smooth Animations**: Fluid user interactions
- **Accessibility**: VoiceOver and accessibility support

### 🔒 Security & Privacy
- **Data Encryption**: Secure storage of sensitive information
- **Input Validation**: Comprehensive security measures
- **Privacy-first**: No unnecessary data collection
- **Secure Logging**: Production-safe logging system

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tasbeeh-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_ENABLE_LOGGING=true
   EXPO_PUBLIC_LOG_LEVEL=debug
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## 📱 Usage Guide

### Basic Counting
1. **Select Counter**: Tap the counter name to switch between counters
2. **Count**: Tap the large number to increment
3. **Reset**: Use the reset button to start over
4. **Set Target**: Use the target button to set goals

### Creating Counters
1. Go to the counter selector
2. Tap "Add New Counter"
3. Enter name, optional target, and choose color
4. Save to create

### Authentication
1. **Sign Up**: Create account for cloud sync
2. **Sign In**: Access existing account
3. **Guest Mode**: Use without account (local only)

### Settings & Customization
- **Theme**: Switch between light, dark, or auto
- **Language**: English or Arabic support
- **Notifications**: Configure achievement alerts
- **Export/Import**: Backup your data

## 🏗️ Project Structure

```
tasbeeh-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Main counter screen
│   │   ├── history.tsx    # Session history
│   │   └── settings.tsx   # App settings
│   ├── _layout.tsx        # Root layout
│   └── auth.tsx           # Authentication screen
├── src/
│   ├── contexts/          # React contexts
│   │   └── TasbeehContext.tsx
│   ├── types/             # TypeScript definitions
│   │   └── index.ts
│   └── utils/             # Utility functions
│       ├── achievements.ts # Achievement system
│       ├── notifications.ts # Push notifications
│       ├── storage.ts     # Local storage
│       ├── supabase.ts    # Backend integration
│       ├── theme.ts       # Theme utilities
│       └── secureLogger.ts # Secure logging
├── assets/                # Static assets
└── docs/                  # Documentation
```

## 🛠️ Development

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Convention**: camelCase for variables, PascalCase for components

### Testing (Recommended)
```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e
```

### Building
```bash
# Development build
npx expo build

# Production build
npx eas build --platform all
```

### Publishing
```bash
# Update Over-the-Air
npx expo publish

# App Store submission
npx eas submit --platform all
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Required |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `EXPO_PUBLIC_APP_ENV` | App environment | `development` |
| `EXPO_PUBLIC_ENABLE_LOGGING` | Enable debug logging | `false` |
| `EXPO_PUBLIC_LOG_LEVEL` | Logging level | `error` |

### App Configuration
Key settings in `app.json`:
- **Orientation**: Portrait only
- **Themes**: Automatic theme switching
- **Permissions**: Notifications
- **Plugins**: Expo Router, Notifications, Secure Store

## 🚢 Deployment

### Prerequisites
- EAS account
- Apple Developer Account (iOS)
- Google Play Developer Account (Android)

### Build & Deploy
```bash
# Login to EAS
npx eas login

# Configure project
npx eas build:configure

# Build for stores
npx eas build --platform all

# Submit to stores
npx eas submit --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Ensure accessibility compliance
- Test on multiple devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Islamic Community**: For inspiration and guidance
- **Expo Team**: For the amazing development platform
- **Supabase**: For backend infrastructure
- **Contributors**: Everyone who helped improve this app

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: Check the `/docs` folder
- **Email**: [Your contact email]

## 🗺️ Roadmap

- [ ] Widget support
- [ ] Apple Watch app
- [ ] Community features
- [ ] Advanced analytics
- [ ] Voice commands
- [ ] Multiple language support
- [ ] Customizable duas

---

**Made with ❤️ for the Muslim community** 