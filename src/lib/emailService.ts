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

export const sendEmail = async (type: EmailType, to: string, data: EmailData) => {
  try {
    console.log(`Sending ${type} email to ${to}`);
    
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        type,
        to,
        data,
      },
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
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
  }
) => {
  return sendEmail('order_confirmation', buyerEmail, orderData);
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
  }
) => {
  return sendEmail('new_order_seller', sellerEmail, orderData);
};

export const sendOrderStatusUpdateEmail = async (
  buyerEmail: string,
  orderData: {
    orderNumber: string;
    orderId: string;
    productName: string;
    status: string;
    buyerName: string;
  }
) => {
  return sendEmail('order_status_update', buyerEmail, orderData);
};

export const sendWalletTransactionEmail = async (
  userEmail: string,
  transactionData: {
    transactionType: 'deposit' | 'withdrawal' | 'earning' | 'refund';
    amount: number;
    balance: number;
    userName: string;
  }
) => {
  return sendEmail('wallet_transaction', userEmail, transactionData);
};

export const sendNewMessageEmail = async (
  recipientEmail: string,
  messageData: {
    senderName: string;
    productName?: string;
    messagePreview: string;
    conversationId: string;
  }
) => {
  return sendEmail('new_message', recipientEmail, messageData);
};
