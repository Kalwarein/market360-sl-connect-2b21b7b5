import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4b3600258d48456b9a42694a4c244c34',
  appName: 'market360-sl-connect',
  webDir: 'dist',
  server: {
    url: 'https://4b360025-8d48-456b-9a42-694a4c244c34.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    OneSignal: {
      appId: 'bcb717ee-7c1e-4d51-b64e-cd7e5c323a29',
      googleProjectNumber: 'YOUR_FIREBASE_SENDER_ID'
    }
  }
};

export default config;
