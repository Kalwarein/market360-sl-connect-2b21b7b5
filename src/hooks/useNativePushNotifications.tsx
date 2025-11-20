import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { isNativeApp } from '@/lib/notificationEnvironment';

export const useNativePushNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isNativeApp()) return;

    const initNativePush = async () => {
      try {
        // Request permission
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
          setIsEnabled(true);
        } else {
          console.log('Push notification permission denied');
        }
      } catch (error) {
        console.error('Error initializing native push notifications:', error);
      }
    };

    // Listen for registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Native push registration success, token:', token.value);
      setToken(token.value);
      
      // Store FCM token in database for server-side push
      try {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: `fcm:${token.value}`,
            p256dh: 'native',
            auth: 'native'
          });
      } catch (error) {
        console.error('Error saving FCM token:', error);
      }
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
      toast.error('Failed to enable push notifications');
    });

    // Handle push notification received
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push notification received:', notification);
      toast(notification.title, {
        description: notification.body,
      });
    });

    // Handle push notification action (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      
      // Navigate to the appropriate page based on notification data
      if (action.notification.data?.link_url) {
        window.location.href = action.notification.data.link_url;
      }
    });

    initNativePush();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);

  const disableNotifications = async () => {
    if (!user) return;

    try {
      // Remove FCM token from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .like('endpoint', 'fcm:%');

      setIsEnabled(false);
      setToken(null);
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    }
  };

  return {
    isEnabled,
    token,
    disableNotifications,
  };
};
