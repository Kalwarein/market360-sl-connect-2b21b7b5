import { supabase } from '@/integrations/supabase/client';

export type EmailType = 'order_confirmation' | 'new_order_seller' | 'order_status_update' | 'wallet_transaction' | 'new_message';

interface EmailData {
  // Order confirmation data
  orderNumber?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  totalAmount?: number;
  deliveryAddress?: string;
  storeName?: string;
  orderId?: string;
  buyerName?: string;
  
  // Order status data
  status?: string;
  
  // Wallet transaction data
  transactionType?: 'deposit' | 'withdrawal' | 'earning' | 'refund';
  amount?: number;
  balance?: number;
  userName?: string;
  
  // Message data
  senderName?: string;
  messagePreview?: string;
  conversationId?: string;
}

export const sendEmail = async (type: EmailType, to: string, data: EmailData, userId?: string) => {
  try {
    // Critical notifications that should ALWAYS be sent regardless of user preferences
    const criticalNotifications = ['new_order_seller', 'order_confirmation'];
    const isCritical = criticalNotifications.includes(type);

    // Check if user has email notifications enabled (skip for critical notifications)
    if (userId && !isCritical) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      const notifPrefs = profile?.notification_preferences as any;
      const emailEnabled = notifPrefs?.email_notifications !== false;
      
      if (!emailEnabled) {
        console.log(`Email notifications disabled for user ${userId}, skipping ${type} email`);
        return null;
      }
    }

    console.log(`Sending ${type} email to ${to}${isCritical ? ' (CRITICAL - bypassing preferences)' : ''}`);
    
    // Get app URL dynamically
    const appUrl = window.location.origin;
    
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        type,
        to,
        data,
        appUrl, // Pass the dynamic app URL
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      // Don't throw error for domain verification issues to prevent order failures
      if (error.message?.includes('verify a domain')) {
        console.log('Email skipped due to domain verification requirement');
        return { success: false, reason: 'domain_verification_required' };
      }
      throw error;
    }

    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Gracefully handle email failures to not block critical flows
    return { success: false, error: error };
  }
};

// Helper functions for specific email types

export const sendOrderConfirmationEmail = async (
  buyerEmail: string,
  orderData: {
    orderNumber: string;
    orderId: string;
    productName: string;
    productImage: string;
    quantity: number;
    totalAmount: number;
    deliveryAddress: string;
    storeName: string;
  },
  userId?: string
) => {
  return sendEmail('order_confirmation', buyerEmail, orderData, userId);
};

export const sendNewOrderSellerEmail = async (
  sellerEmail: string,
  orderData: {
    orderNumber: string;
    orderId: string;
    productName: string;
    productImage: string;
    quantity: number;
    totalAmount: number;
    buyerName: string;
    deliveryAddress: string;
  },
  userId?: string
) => {
  return sendEmail('new_order_seller', sellerEmail, orderData, userId);
};

export const sendOrderStatusUpdateEmail = async (
  buyerEmail: string,
  orderData: {
    orderNumber: string;
    orderId: string;
    productName: string;
    status: string;
    buyerName: string;
  },
  userId?: string
) => {
  return sendEmail('order_status_update', buyerEmail, orderData, userId);
};

export const sendWalletTransactionEmail = async (
  userEmail: string,
  transactionData: {
    transactionType: 'deposit' | 'withdrawal' | 'earning' | 'refund';
    amount: number;
    balance: number;
    userName: string;
  },
  userId?: string
) => {
  return sendEmail('wallet_transaction', userEmail, transactionData, userId);
};

export const sendNewMessageEmail = async (
  recipientEmail: string,
  messageData: {
    senderName: string;
    productName?: string;
    messagePreview: string;
    conversationId: string;
  },
  userId?: string
) => {
  return sendEmail('new_message', recipientEmail, messageData, userId);
};
