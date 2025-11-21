import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  user_id: string;
  type: 'order' | 'message' | 'broadcast' | 'system';
  title: string;
  body: string;
  link_url?: string;
  image_url?: string;
  metadata?: any;
  icon?: string;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

export const sendNotification = async (payload: NotificationPayload) => {
  try {
    // Create in-app notification
    const { error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link_url: payload.link_url,
        image_url: payload.image_url,
        metadata: payload.metadata
      });

    if (dbError) {
      console.error('Failed to create in-app notification:', dbError);
    }

    // Send OneSignal push notification
    const { error: pushError } = await supabase.functions.invoke('send-onesignal-notification', {
      body: {
        user_id: payload.user_id,
        title: payload.title,
        body: payload.body,
        link_url: payload.link_url,
        image_url: payload.image_url,
        data: payload.metadata
      }
    });

    if (pushError) {
      console.error('Failed to send push notification:', pushError);
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Specific notification helpers
export const notifyNewOrder = async (
  sellerId: string,
  productTitle: string,
  buyerName: string,
  orderId: string,
  productImage?: string
) => {
  return sendNotification({
    user_id: sellerId,
    type: 'order',
    title: '🛒 New Order Received!',
    body: `${buyerName} placed an order for "${productTitle}"`,
    link_url: `/seller/order/${orderId}`,
    image_url: productImage,
    icon: '/pwa-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Order' },
      { action: 'dismiss', title: 'Later' }
    ]
  });
};

export const notifyOrderShipped = async (
  buyerId: string,
  productTitle: string,
  orderId: string,
  productImage?: string
) => {
  return sendNotification({
    user_id: buyerId,
    type: 'order',
    title: '📦 Order Shipped!',
    body: `Your order for "${productTitle}" is on the way!`,
    link_url: `/order/${orderId}`,
    image_url: productImage,
    icon: '/pwa-192x192.png',
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'Track Order' },
      { action: 'dismiss', title: 'OK' }
    ]
  });
};

export const notifyOrderDelivered = async (
  buyerId: string,
  productTitle: string,
  orderId: string,
  productImage?: string
) => {
  return sendNotification({
    user_id: buyerId,
    type: 'order',
    title: '✅ Order Delivered!',
    body: `Your order for "${productTitle}" has been delivered. Please confirm receipt.`,
    link_url: `/order-arrival/${orderId}`,
    image_url: productImage,
    icon: '/pwa-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Confirm Receipt' },
      { action: 'dismiss', title: 'Later' }
    ]
  });
};

export const notifyNewMessage = async (
  recipientId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string,
  senderAvatar?: string
) => {
  return sendNotification({
    user_id: recipientId,
    type: 'message',
    title: `💬 ${senderName}`,
    body: messagePreview,
    link_url: `/chat/${conversationId}`,
    icon: senderAvatar || '/pwa-192x192.png',
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'Reply' },
      { action: 'dismiss', title: 'Later' }
    ]
  });
};

export const notifyOrderProcessing = async (
  buyerId: string,
  productTitle: string,
  orderId: string,
  productImage?: string
) => {
  return sendNotification({
    user_id: buyerId,
    type: 'order',
    title: '⚙️ Order Processing',
    body: `Your order for "${productTitle}" is being prepared!`,
    link_url: `/order/${orderId}`,
    image_url: productImage,
    icon: '/pwa-192x192.png'
  });
};

export const notifyOrderCancelled = async (
  userId: string,
  productTitle: string,
  orderId: string,
  refundAmount: number
) => {
  return sendNotification({
    user_id: userId,
    type: 'order',
    title: '❌ Order Cancelled',
    body: `Order for "${productTitle}" was cancelled. Le ${refundAmount.toLocaleString()} refunded to your wallet.`,
    link_url: `/order/${orderId}`,
    icon: '/pwa-192x192.png',
    requireInteraction: false
  });
};
