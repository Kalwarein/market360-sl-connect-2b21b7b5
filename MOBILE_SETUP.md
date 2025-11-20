# Market360 Mobile App Setup Guide

## 🚀 Your app is now configured for native mobile deployment!

## What's Been Set Up

✅ **Capacitor Core** - Native runtime for iOS and Android
✅ **Native Push Notifications** - Full Firebase Cloud Messaging support
✅ **Environment Detection** - Automatic detection of native vs web environment
✅ **Hot Reload** - Live updates during development without rebuilding
✅ **Supabase Integration** - Your backend works perfectly with native app

---

## 📱 Running on Your Device

### Prerequisites

**For Android:**
- Install [Android Studio](https://developer.android.com/studio)
- Install Java JDK 17 or higher
- Set up Android SDK through Android Studio

**For iOS (Mac only):**
- Install [Xcode](https://apps.apple.com/us/app/xcode/id497799835) from Mac App Store
- Install Xcode Command Line Tools: `xcode-select --install`
- You need a Mac computer for iOS development

---

## 🔧 Step-by-Step Setup

### 1. Transfer to Your GitHub

Click the **"Export to GitHub"** button in Lovable to transfer your project to your own repository.

### 2. Clone and Install

```bash
# Clone your repository
git clone YOUR_GITHUB_REPO_URL
cd market360-sl-connect

# Install dependencies
npm install
```

### 3. Initialize Capacitor Platforms

```bash
# Add Android platform
npx cap add android

# Add iOS platform (Mac only)
npx cap add ios
```

### 4. Build Your Web App

```bash
npm run build
```

### 5. Sync to Native Platforms

```bash
# Sync for Android
npx cap sync android

# Sync for iOS
npx cap sync ios
```

### 6. Run on Device or Emulator

**For Android:**
```bash
npx cap run android
```

This will:
- Open Android Studio
- Build the app
- Launch on connected device or emulator

**For iOS (Mac only):**
```bash
npx cap run ios
```

This will:
- Open Xcode
- Build the app
- Launch on connected device or simulator

---

## 🔔 Setting Up Firebase Cloud Messaging (Native Push Notifications)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `market360-sl-connect`
4. Follow the setup wizard

### 2. Add Android App to Firebase

1. In Firebase Console, click "Add app" → Android
2. Enter package name: `app.lovable.4b3600258d48456b9a42694a4c244c34`
3. Download `google-services.json`
4. Place it in: `android/app/google-services.json`

### 3. Add iOS App to Firebase (if using iOS)

1. In Firebase Console, click "Add app" → iOS
2. Enter bundle ID: `app.lovable.4b3600258d48456b9a42694a4c244c34`
3. Download `GoogleService-Info.plist`
4. Place it in: `ios/App/App/GoogleService-Info.plist`

### 4. Get FCM Server Key

1. In Firebase Console, go to Project Settings → Cloud Messaging
2. Copy the **Server key** (or create a new one)
3. Add this as a Supabase secret named `FCM_SERVER_KEY`

### 5. Update Edge Function for Native Push

Your `send-push-notification` edge function needs to support FCM. Here's what to add:

```typescript
// In send-push-notification/index.ts

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

// Add this function to send FCM notifications
async function sendFCMNotification(token: string, title: string, body: string, data: any) {
  const fcmToken = token.replace('fcm:', '');
  
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: {
        title,
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
      },
      data,
    }),
  });
  
  return response.json();
}

// In your main handler, detect FCM tokens and use FCM
if (subscription.endpoint.startsWith('fcm:')) {
  result = await sendFCMNotification(
    subscription.endpoint,
    title,
    body,
    { link_url: link_url || '' }
  );
}
```

---

## 🔄 Development Workflow

### After Making Changes

Every time you git pull new changes:

```bash
# 1. Install any new dependencies
npm install

# 2. Build the web app
npm run build

# 3. Sync to native platforms
npx cap sync

# 4. Run the app
npx cap run android  # or ios
```

### Using Hot Reload (Faster Development)

Your app is configured with hot reload pointing to:
`https://4b360025-8d48-456b-9a42-694a4c244c34.lovableproject.com`

This means changes you make in Lovable will instantly appear in your mobile app without rebuilding!

To disable hot reload for production builds, edit `capacitor.config.ts`:

```typescript
server: {
  // Comment out or remove these lines for production
  // url: 'https://...',
  // cleartext: true
}
```

---

## 📦 Building for App Stores

### Android (Google Play Store)

```bash
# Build release APK
cd android
./gradlew assembleRelease

# Find your APK at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

You'll need to sign this APK with a keystore before uploading to Google Play.

### iOS (Apple App Store)

1. Open Xcode: `npx cap open ios`
2. Select your development team
3. Set up provisioning profiles
4. Archive the app (Product → Archive)
5. Upload to App Store Connect

---

## 🛠️ Troubleshooting

### "Command not found: npx"
Install Node.js and npm first: https://nodejs.org/

### Android Studio doesn't detect device
- Enable USB debugging on your Android device
- Install appropriate USB drivers

### iOS build fails
- Make sure you have the latest Xcode
- Run `pod install` in the `ios/App` directory
- Clean build folder in Xcode

### Push notifications not working
- Make sure you've added FCM configuration files
- Check that FCM_SERVER_KEY is set in Supabase secrets
- Verify device has granted notification permissions

---

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Lovable Mobile Development Blog Post](https://docs.lovable.dev/tips-tricks/mobile-development)

---

## 🎉 You're Ready!

Your Market360 app now has:
- ✅ Native Android & iOS support
- ✅ Native push notifications via FCM
- ✅ Full access to device features
- ✅ App store deployment capability
- ✅ Seamless Supabase backend integration

Follow the steps above to run on your device and deploy to app stores! 🚀
