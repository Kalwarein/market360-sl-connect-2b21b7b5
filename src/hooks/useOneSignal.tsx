import { useEffect, useState, useRef } from 'react';
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
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  // Initialize OneSignal when component mounts
  useEffect(() => {
    initOneSignal();
  }, []);

  // Handle user changes (login/logout/switch)
  useEffect(() => {
    if (!isInitialized) return;

    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // User logged out or switched accounts
    if (previousUserId && previousUserId !== currentUserId) {
      console.log('[OneSignal] User changed, removing external user ID:', previousUserId);
      removeExternalUserId();
    }

    // User logged in
    if (currentUserId && currentUserId !== previousUserId) {
      console.log('[OneSignal] User logged in, setting external user ID:', currentUserId);
      setExternalUserIdForUser(currentUserId);
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id, isInitialized]);

  const initOneSignal = async () => {
    try {
      // Check if running in Median.co wrapper
      if (window.median?.onesignal) {
        console.log('[OneSignal] Detected Median.co environment');
        setIsInitialized(true);
        return;
      }

      if (isNativeApp()) {
        await initNativeOneSignal();
      } else {
        await initWebOneSignal();
      }
    } catch (error) {
      console.error('[OneSignal] Error initializing:', error);
    }
  };

  const initWebOneSignal = async () => {
    try {
      // Load OneSignal SDK dynamically if not present
      if (!window.OneSignal && !window.OneSignalDeferred) {
        console.log('[OneSignal] Loading Web SDK...');
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        });

        console.log('[OneSignal] Web SDK initialized');
        setIsInitialized(true);
      });
    } catch (error) {
      console.error('[OneSignal] Error initializing Web SDK:', error);
    }
  };

  const initNativeOneSignal = async () => {
    try {
      if (!window.plugins?.OneSignal) {
        console.log('[OneSignal] Native plugin not available');
        return;
      }

      const OneSignal = window.plugins.OneSignal;
      OneSignal.setAppId(ONESIGNAL_APP_ID);

      OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
        console.log('[OneSignal] User accepted notifications:', accepted);
      });

      console.log('[OneSignal] Native SDK initialized');
      setIsInitialized(true);
    } catch (error) {
      console.error('[OneSignal] Error initializing Native SDK:', error);
    }
  };

  const setExternalUserIdForUser = async (userId: string) => {
    try {
      // Median.co wrapper
      if (window.median?.onesignal?.externalUserId) {
        window.median.onesignal.externalUserId.set(userId);
        console.log('[OneSignal] External user ID set via Median:', userId);
        setExternalUserId(userId);
        return;
      }

      // Native plugin
      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.setExternalUserId(userId);
        console.log('[OneSignal] External user ID set via Native plugin:', userId);
        setExternalUserId(userId);
        return;
      }

      // Web SDK
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal: any) {
          await OneSignal.login(userId);
          console.log('[OneSignal] External user ID set via Web SDK:', userId);
          setExternalUserId(userId);
        });
      }
    } catch (error) {
      console.error('[OneSignal] Error setting external user ID:', error);
    }
  };

  const removeExternalUserId = async () => {
    try {
      // Median.co wrapper
      if (window.median?.onesignal?.externalUserId) {
        window.median.onesignal.externalUserId.remove();
        console.log('[OneSignal] External user ID removed via Median');
        setExternalUserId(null);
        return;
      }

      // Native plugin
      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.removeExternalUserId();
        console.log('[OneSignal] External user ID removed via Native plugin');
        setExternalUserId(null);
        return;
      }

      // Web SDK
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal: any) {
          await OneSignal.logout();
          console.log('[OneSignal] External user ID removed via Web SDK');
          setExternalUserId(null);
        });
      }
    } catch (error) {
      console.error('[OneSignal] Error removing external user ID:', error);
    }
  };

  const requestPermission = async () => {
    try {
      if (window.median?.onesignal) {
        console.log('[OneSignal] Permission handled by Median');
        return;
      }

      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
          console.log('[OneSignal] User accepted notifications:', accepted);
        });
        return;
      }

      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal: any) {
          // OneSignal Web SDK v16+
          if (OneSignal?.Notifications?.requestPermission) {
            await OneSignal.Notifications.requestPermission();
            return;
          }

          // Back-compat (older SDKs)
          if (OneSignal?.Slidedown?.promptPush) {
            await OneSignal.Slidedown.promptPush();
            return;
          }

          if (typeof OneSignal?.showSlidedownPrompt === 'function') {
            OneSignal.showSlidedownPrompt();
            return;
          }

          console.warn('[OneSignal] No supported permission prompt method found');
        });
      }
    } catch (error) {
      console.error('[OneSignal] Error requesting permission:', error);
    }
  };

  return {
    isInitialized,
    externalUserId,
    requestPermission,
    setExternalUserId: setExternalUserIdForUser,
    removeExternalUserId
  };
};
