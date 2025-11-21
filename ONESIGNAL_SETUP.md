# OneSignal Integration Setup

Your Market360 app is now integrated with OneSignal for push notifications on Android, Web, and PWA.

## ✅ What's Already Configured

- **OneSignal App ID**: `bcb717ee-7c1e-4d51-b64e-cd7e5c323a29`
- **REST API Key**: Stored securely in Supabase secrets
- **Edge Function**: `send-onesignal-notification` created and deployed
- **Frontend Hook**: `useOneSignal` initialized in App.tsx
- **Database**: `onesignal_player_id` column added to profiles table

## 🚀 How It Works

### Web/PWA Users
1. When users visit your app, OneSignal automatically initializes
2. Users are prompted to allow notifications
3. Player ID is saved to their profile in the database
4. All notifications (orders, messages, alerts) are sent via OneSignal

### Native Android Users (via Capacitor)
1. Install the OneSignal Capacitor plugin
2. OneSignal initializes on app launch
3. Player ID is registered and saved
4. Native push notifications work even when app is closed

## 📱 Android Native Setup (Required for Native App)

If you're building a native Android app with Capacitor, follow these steps:

### 1. Install OneSignal Capacitor Plugin

```bash
npm install onesignal-cordova-plugin
npm install @capacitor/push-notifications
npx cap sync android
```

### 2. Add Firebase Configuration

1. Go to your OneSignal dashboard → Settings → Platforms → Google Android
2. Download or copy your Firebase `google-services.json`
3. Place it in: `android/app/google-services.json`

### 3. Update Android Gradle Files

**android/build.gradle** - Add Google Services plugin:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

**android/app/build.gradle** - Apply plugin at bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4. Update capacitor.config.ts

Replace `YOUR_FIREBASE_SENDER_ID` in `capacitor.config.ts` with your Firebase Sender ID (Project Number):
```typescript
OneSignal: {
  appId: 'bcb717ee-7c1e-4d51-b64e-cd7e5c323a29',
  googleProjectNumber: 'YOUR_FIREBASE_SENDER_ID' // Replace this
}
```

Find your Sender ID: Firebase Console → Project Settings → Cloud Messaging → Sender ID

### 5. Build and Test

```bash
npm run build
npx cap sync android
npx cap run android
```

## 🌐 Web/PWA Setup (Already Working!)

For web and PWA users, everything is already configured. OneSignal will:
- Load automatically when users visit your site
- Show native browser permission prompts
- Store subscriptions in the database
- Send notifications to desktop and mobile browsers

## 📊 Testing Notifications

### Test from OneSignal Dashboard
1. Go to OneSignal Dashboard → Messages → New Push
2. Select "Send to Particular Users"
3. Enter a user's OneSignal Player ID
4. Send test notification

### Test from Your App
All your existing notification triggers work automatically:
- New orders → Seller receives notification
- Order shipped → Buyer receives notification
- New messages → Recipient receives notification
- Order delivered → Buyer receives notification

## 🔧 Notification Flow

```
User Action (e.g., Place Order)
    ↓
notificationService.ts calls sendNotification()
    ↓
Creates in-app notification in database
    ↓
Calls send-onesignal-notification edge function
    ↓
Fetches user's player_id from profiles table
    ↓
Sends push via OneSignal REST API
    ↓
User receives notification (even if app is closed)
```

## 📝 Database Schema

The `profiles` table now includes:
```sql
onesignal_player_id TEXT -- OneSignal player ID for push notifications
```

This is automatically populated when users allow notifications.

## ⚙️ Customization

### Change Notification Icon (Android)
Place notification icons in `android/app/src/main/res/drawable/`:
- `onesignal_small_icon_default.png` (small icon)
- `onesignal_large_icon_default.png` (large icon)

### Customize Notification Sounds
Add custom sounds to `android/app/src/main/res/raw/`

### Notification Channels (Android)
Default channel: "market360-notifications"

Customize in `send-onesignal-notification/index.ts`:
```typescript
android_channel_id: "your-custom-channel-id"
```

## 🎯 Features Enabled

✅ Web push notifications (Chrome, Firefox, Edge)  
✅ PWA push notifications  
✅ Android native push notifications  
✅ Notification badges and counters  
✅ Deep linking (notifications open specific pages)  
✅ Rich notifications with images  
✅ Notification history in-app  
✅ Real-time delivery  

## 🔐 Security

- REST API Key stored securely in Supabase secrets
- Player IDs are user-specific and validated
- Edge function uses service role for database access
- No sensitive data exposed to client

## 📖 Resources

- [OneSignal Dashboard](https://onesignal.com/)
- [OneSignal Android Setup](https://documentation.onesignal.com/docs/android-sdk-setup)
- [OneSignal Web Push Setup](https://documentation.onesignal.com/docs/web-push-quickstart)
- [OneSignal Capacitor Plugin](https://github.com/OneSignal/onesignal-cordova-plugin)

## 🆘 Troubleshooting

### Notifications not received on Android
- Check if google-services.json is in android/app/
- Verify Firebase Sender ID in capacitor.config.ts
- Rebuild app with `npm run build && npx cap sync android`

### Player ID not saving
- Check browser console for errors
- Verify database migration ran successfully
- Check Supabase logs for errors

### Web notifications not working
- Verify OneSignalSDKWorker.js is accessible at /OneSignalSDKWorker.js
- Check browser permissions
- Test on HTTPS (required for web push)

## 🎉 You're All Set!

Your app now has professional push notifications via OneSignal. All order updates, messages, and alerts will be delivered in real-time to your users across web, PWA, and native Android platforms.
