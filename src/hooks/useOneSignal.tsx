import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isNativeApp } from '@/lib/notificationEnvironment';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
    plugins?: {
      OneSignal?: any;
    };
    median?: {
      onesignal?: {
        externalUserId?: {
          set: (userId: string) => void;
          remove: () => void;
        };
      };
    };
  }
}

const ONESIGNAL_APP_ID = "bcb717ee-7c1e-4d51-b64e-cd7e5c323a29";

export const useOneSignal = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const initAttemptedRef = useRef(false);

  // ─────────────────────────────────────────────────────────────
  // EXTERNAL USER ID MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  const linkExternalUserId = useCallback(async (userId: string) => {
    console.log('[OneSignal] Linking external_user_id:', userId);

    try {
      // Median.co WebView wrapper
      if (window.median?.onesignal?.externalUserId) {
        window.median.onesignal.externalUserId.set(userId);
        console.log('[OneSignal] ✅ external_user_id set via Median:', userId);
        setLinkedUserId(userId);
        return;
      }

      // Native Capacitor plugin
      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.setExternalUserId(userId);
        console.log('[OneSignal] ✅ external_user_id set via Native plugin:', userId);
        setLinkedUserId(userId);
        return;
      }

      // Web SDK v16+ uses login() for external user ID
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            await OneSignal.login(userId);
            console.log('[OneSignal] ✅ external_user_id set via Web SDK login():', userId);
            setLinkedUserId(userId);
          } catch (err) {
            console.error('[OneSignal] Failed to login:', err);
          }
        });
      } else {
        console.warn('[OneSignal] No SDK available to set external_user_id');
      }
    } catch (error) {
      console.error('[OneSignal] Error linking external_user_id:', error);
    }
  }, []);

  const unlinkExternalUserId = useCallback(async () => {
    console.log('[OneSignal] Unlinking external_user_id');

    try {
      // Median.co WebView wrapper
      if (window.median?.onesignal?.externalUserId) {
        window.median.onesignal.externalUserId.remove();
        console.log('[OneSignal] ✅ external_user_id removed via Median');
        setLinkedUserId(null);
        return;
      }

      // Native Capacitor plugin
      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.removeExternalUserId();
        console.log('[OneSignal] ✅ external_user_id removed via Native plugin');
        setLinkedUserId(null);
        return;
      }

      // Web SDK v16+ uses logout()
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            await OneSignal.logout();
            console.log('[OneSignal] ✅ external_user_id removed via Web SDK logout()');
            setLinkedUserId(null);
          } catch (err) {
            console.error('[OneSignal] Failed to logout:', err);
          }
        });
      }
    } catch (error) {
      console.error('[OneSignal] Error unlinking external_user_id:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────

  const initOneSignal = useCallback(async () => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    console.log('[OneSignal] Initializing...');

    try {
      // Median.co handles OneSignal natively - just mark ready
      if (window.median?.onesignal) {
        console.log('[OneSignal] ✅ Median.co environment detected - SDK managed by wrapper');
        setIsInitialized(true);
        return;
      }

      // Native Capacitor plugin
      if (isNativeApp() && window.plugins?.OneSignal) {
        const OneSignal = window.plugins.OneSignal;
        OneSignal.setAppId(ONESIGNAL_APP_ID);
        OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
          console.log('[OneSignal] Native permission response:', accepted);
        });
        console.log('[OneSignal] ✅ Native SDK initialized');
        setIsInitialized(true);
        return;
      }

      // Web SDK
      await initWebSDK();
    } catch (error) {
      console.error('[OneSignal] Initialization error:', error);
    }
  }, []);

  const initWebSDK = async () => {
    // Load SDK script if not present
    if (!window.OneSignal && !window.OneSignalDeferred) {
      console.log('[OneSignal] Loading Web SDK script...');
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
      });
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });
        console.log('[OneSignal] ✅ Web SDK initialized');
        setIsInitialized(true);
      } catch (err) {
        console.error('[OneSignal] Web SDK init error:', err);
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────

  // Initialize on mount
  useEffect(() => {
    initOneSignal();
  }, [initOneSignal]);

  // React to auth state changes
  useEffect(() => {
    if (!isInitialized) {
      console.log('[OneSignal] Waiting for SDK initialization before linking user...');
      return;
    }

    const currentUserId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    console.log('[OneSignal] Auth state check:', {
      currentUserId,
      previousUserId,
      isInitialized,
    });

    // User logged out or switched accounts → unlink first
    if (previousUserId && previousUserId !== currentUserId) {
      unlinkExternalUserId();
    }

    // User logged in (new or different user)
    if (currentUserId && currentUserId !== previousUserId) {
      linkExternalUserId(currentUserId);
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id, isInitialized, linkExternalUserId, unlinkExternalUserId]);

  // ─────────────────────────────────────────────────────────────
  // PERMISSION REQUEST
  // ─────────────────────────────────────────────────────────────

  const requestPermission = useCallback(async () => {
    try {
      if (window.median?.onesignal) {
        console.log('[OneSignal] Permission managed by Median - no action needed');
        return;
      }

      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
          console.log('[OneSignal] Native permission response:', accepted);
        });
        return;
      }

      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          if (OneSignal?.Notifications?.requestPermission) {
            await OneSignal.Notifications.requestPermission();
            console.log('[OneSignal] Permission requested via Notifications API');
          } else if (OneSignal?.Slidedown?.promptPush) {
            await OneSignal.Slidedown.promptPush();
          } else {
            console.warn('[OneSignal] No permission prompt method available');
          }
        });
      }
    } catch (error) {
      console.error('[OneSignal] Permission request error:', error);
    }
  }, []);

  return {
    isInitialized,
    linkedUserId,
    requestPermission,
    linkExternalUserId,
    unlinkExternalUserId,
  };
};
