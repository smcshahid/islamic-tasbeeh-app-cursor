# Development Build Setup for Prayer Notifications

## 🚨 Important: Expo Go Limitations

**The prayer notification system will NOT work properly in Expo Go** due to the following limitations:

1. **Expo Go SDK 53+**: Push notifications functionality was removed
2. **Background Tasks**: Limited background task support
3. **Exact Alarms**: Cannot schedule exact-time notifications
4. **Custom Audio**: Limited audio playback in background

## ✅ Solution: Create a Development Build

A development build gives you full native functionality while maintaining the Expo development experience.

### Step 1: Install EAS CLI

```bash
npm install -g @expo/eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

### Step 3: Configure EAS Build

Create `eas.json` in your project root:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### Step 4: Build Development App

For Android:
```bash
eas build --profile development --platform android
```

For iOS:
```bash
eas build --profile development --platform ios
```

### Step 5: Install Development Build

1. Download the development build from the EAS console
2. Install it on your device
3. The app will have full notification capabilities

### Step 6: Start Development Server

```bash
npx expo start --dev-client
```

## 🔧 Alternative: Local Development Build

If you prefer to build locally:

### Android Local Build

1. **Install Android Studio** and set up Android SDK
2. **Install Java Development Kit (JDK) 17**
3. **Run prebuild**:
   ```bash
   npx expo prebuild --platform android
   ```
4. **Build the app**:
   ```bash
   npx expo run:android
   ```

### iOS Local Build

1. **Install Xcode** (macOS only)
2. **Run prebuild**:
   ```bash
   npx expo prebuild --platform ios
   ```
3. **Build the app**:
   ```bash
   npx expo run:ios
   ```

## 📱 Testing Prayer Notifications

Once you have a development build:

1. **Enable notifications** in the app settings
2. **Set a prayer time** close to current time for testing
3. **Wait for the notification** to trigger
4. **Verify adhan plays** when notification appears
5. **Check notification actions** (Snooze, Stop)

## 🔍 Debugging

### Check Notification Permissions

```bash
# View device logs
npx expo start --dev-client
# Press 'j' to open debugger and check console logs
```

### Verify Notification Channels (Android)

```javascript
// Add this to your app for debugging
import * as Notifications from 'expo-notifications';

const checkChannels = async () => {
  const channels = await Notifications.getNotificationChannelsAsync();
  console.log('Available channels:', channels);
};
```

### Test Notification Scheduling

```javascript
// Test immediate notification
import * as Notifications from 'expo-notifications';

const testNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Prayer Notification",
      body: "This is a test notification",
    },
    trigger: { seconds: 2 },
  });
};
```

## 🏗️ Production Build

When ready for production:

```bash
# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios
```

## ⚠️ Common Issues & Solutions

### Issue: Notifications not appearing
**Solution**: Ensure notification permissions are granted and channels are created

### Issue: Adhan not playing
**Solution**: Check audio permissions and verify development build is being used

### Issue: Background notifications not working
**Solution**: Ensure app is not force-killed and battery optimization is disabled

### Issue: Build fails
**Solution**: Clear cache and try again:
```bash
npx expo install --fix
npx expo prebuild --clean
```

## 🎯 Benefits of Development Build

✅ **Full notification support** with exact scheduling
✅ **Background audio playback** for adhan
✅ **Native Android notification channels**
✅ **Proper app lifecycle handling**
✅ **Real device testing capabilities**
✅ **All Expo features** plus native functionality

## 📋 Next Steps

1. Set up development build using the steps above
2. Test prayer notifications thoroughly
3. Deploy to app stores when ready

The development build is essential for a production-quality Islamic prayer app with reliable notifications! 🕌 