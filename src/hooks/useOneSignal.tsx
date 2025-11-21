import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isNativeApp } from '@/lib/notificationEnvironment';

declare global {
  interface Window {
    OneSignalDeferred?: any;
    plugins?: {
      OneSignal?: any;
    };
  }
}

export const useOneSignal = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const initOneSignal = async () => {
      if (isNativeApp()) {
        // Native Android initialization via Capacitor OneSignal plugin
        initNativeOneSignal();
      } else {
        // Web/PWA initialization
        initWebOneSignal();
      }
    };

    initOneSignal();
  }, [user]);

  const initWebOneSignal = async () => {
    try {
      // Load OneSignal SDK dynamically
      if (!window.OneSignalDeferred) {
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: "bcb717ee-7c1e-4d51-b64e-cd7e5c323a29",
          safari_web_id: "web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        });

        // Get player ID
        const userId = await OneSignal.User.PushSubscription.id;
        if (userId) {
          setPlayerId(userId);
          await savePlayerIdToDatabase(userId);
        }

        // Listen for subscription changes
        OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
          const newPlayerId = event.current.id;
          if (newPlayerId) {
            setPlayerId(newPlayerId);
            await savePlayerIdToDatabase(newPlayerId);
          }
        });

        setIsInitialized(true);
      });
    } catch (error) {
      console.error('Error initializing OneSignal Web:', error);
    }
  };

  const initNativeOneSignal = async () => {
    try {
      if (!window.plugins?.OneSignal) {
        console.error('OneSignal native plugin not available');
        return;
      }

      const OneSignal = window.plugins.OneSignal;

      // Initialize with App ID
      OneSignal.setAppId("bcb717ee-7c1e-4d51-b64e-cd7e5c323a29");

      // Request permission
      OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
        console.log("User accepted notifications: " + accepted);
      });

      // Get player ID
      OneSignal.getDeviceState((state: any) => {
        if (state.userId) {
          setPlayerId(state.userId);
          savePlayerIdToDatabase(state.userId);
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing OneSignal Native:', error);
    }
  };

  const savePlayerIdToDatabase = async (playerIdToSave: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onesignal_player_id: playerIdToSave })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving OneSignal player ID:', error);
      } else {
        console.log('OneSignal player ID saved successfully');
      }
    } catch (error) {
      console.error('Error saving player ID to database:', error);
    }
  };

  const requestPermission = async () => {
    try {
      if (isNativeApp() && window.plugins?.OneSignal) {
        window.plugins.OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
          console.log("User accepted notifications: " + accepted);
        });
      } else if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal: any) {
          await OneSignal.Slidedown.promptPush();
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  return {
    isInitialized,
    playerId,
    requestPermission
  };
};
