import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getNotificationEnvironment } from '@/lib/notificationEnvironment';
import { useNativePushNotifications } from './useNativePushNotifications';

const PUBLIC_VAPID_KEY = 'BBlaVa85xf0mZh_WsjHwAAQdBTwSxHRcvBzYvcuEFqukB-Ovr5TzeD5inRY3KUEonnqUgrx8-uwstAmvx8tbuvE';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const environment = getNotificationEnvironment();
  
  // Native push notifications hook (only active in native app)
  const nativePush = useNativePushNotifications();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    // Native app uses native push notifications
    if (environment === 'native') {
      // Native permissions are handled automatically by useNativePushNotifications
      return nativePush.isEnabled;
    }

    // Web/PWA uses web push notifications
    if (!('Notification' in window)) {
      toast.error('Browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
      return true;
    }

    return false;
  };

  const subscribeToPush = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setIsSubscribed(true);
        return;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      // Save subscription to database
      const subscriptionData = subscription.toJSON();
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          p256dh: subscriptionData.keys!.p256dh,
          auth: subscriptionData.keys!.auth
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Push notifications enabled');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable push notifications');
    }
  };

  const unsubscribe = async () => {
    if (!user) return;

    // Native app uses native unsubscribe
    if (environment === 'native') {
      await nativePush.disableNotifications();
      return;
    }

    // Web/PWA unsubscribe
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);

        setIsSubscribed(false);
        toast.success('Push notifications disabled');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      toast.error('Failed to disable push notifications');
    }
  };

  return {
    permission,
    isSubscribed: environment === 'native' ? nativePush.isEnabled : isSubscribed,
    requestPermission,
    subscribeToPush,
    unsubscribe,
    environment,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
