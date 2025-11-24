import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'order_confirmation' | 'new_order_seller' | 'order_status_update' | 'wallet_transaction' | 'new_message' | 'seller_approved' | 'user_suspended' | 'user_banned' | 'appeal_approved' | 'appeal_rejected' | 'daily_reminder';
  to: string;
  data: any;
  appUrl?: string;
}

// Modern email template matching app design
const getEmailWrapper = (content: string, headerBg: string = 'linear-gradient(135deg, #45a876 0%, #54b883 100%)') => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #f4f6f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
      .header { background: ${headerBg}; padding: 48px 24px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.5px; }
      .content { padding: 40px 32px; color: #0f2418; }
      .footer { background: #0f2418; color: #ffffff; padding: 32px 24px; text-align: center; }
      .footer p { margin: 6px 0; font-size: 14px; opacity: 0.9; }
      .footer strong { font-size: 16px; font-weight: 600; }
      .button { display: inline-block; background: #45a876; color: #ffffff; padding: 16px 40px; text-decoration: none; font-weight: 600; transition: all 0.2s; }
      .button:hover { background: #3d9668; }
      p { color: #5f6b65; line-height: 1.6; margin: 12px 0; }
      h2 { color: #0f2418; font-size: 24px; margin: 0 0 12px 0; font-weight: 600; }
      h3 { color: #0f2418; font-size: 18px; margin: 24px 0 12px 0; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="container">
      ${content}
      <div class="footer">
        <p><strong>Market360</strong></p>
        <p>Sierra Leone's Trusted Marketplace</p>
        <p style="font-size: 13px; margin-top: 16px; opacity: 0.7;">© 2025 Market360. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

const generateOrderConfirmationEmail = (data: any, appUrl: string) => {
  const { orderNumber, productName, productImage, quantity, totalAmount, deliveryAddress, storeName, orderId } = data;
  
  const content = `
    <div class="header">
      <h1>✓ Order Confirmed</h1>
    </div>
    <div class="content">
      <h2>Thank you for your order</h2>
      <p>Your order has been successfully placed and is being processed.</p>
      
      <div style="background: #f9faf9; padding: 24px; margin: 24px 0; display: flex; gap: 20px; align-items: center;">
        <img src="${productImage}" alt="${productName}" style="width: 100px; height: 100px; object-fit: cover;" />
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">${productName}</h3>
          <p style="margin: 4px 0; font-size: 14px;">Quantity: ${quantity}</p>
          <p style="color: #45a876; font-weight: 600; font-size: 20px; margin: 8px 0;">Le ${totalAmount.toLocaleString()}</p>
          <p style="font-size: 13px; color: #999; margin: 8px 0 0 0;">From ${storeName}</p>
        </div>
      </div>

      <div style="background: #f9faf9; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">Order Details</h3>
        <p style="margin: 8px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        <p style="margin: 8px 0;"><strong>Delivery Address:</strong> ${deliveryAddress}</p>
      </div>

      <a href="${appUrl}/order-detail/${orderId}" class="button">Track Your Order</a>

      <p style="margin-top: 32px; font-size: 14px;">
        Your order is secured with Market360's escrow protection. Funds will only be released to the seller once you confirm delivery.
      </p>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateNewOrderSellerEmail = (data: any, appUrl: string) => {
  const { orderNumber, productName, productImage, quantity, totalAmount, buyerName, deliveryAddress, orderId } = data;
  
  const content = `
    <div class="header">
      <h1>🔔 New Order Received</h1>
    </div>
    <div class="content">
      <div style="background: linear-gradient(135deg, #45a876 0%, #54b883 100%); color: white; padding: 10px 20px; display: inline-block; margin-bottom: 24px; font-weight: 600;">ACTION REQUIRED</div>
      <h2>You have a new order to process</h2>
      <p>A customer has placed an order for your product. Please process it promptly.</p>
      
      <div style="background: #f9faf9; padding: 24px; margin: 24px 0; display: flex; gap: 20px; align-items: center;">
        <img src="${productImage}" alt="${productName}" style="width: 100px; height: 100px; object-fit: cover;" />
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">${productName}</h3>
          <p style="margin: 4px 0; font-size: 14px;">Quantity: ${quantity}</p>
          <p style="color: #45a876; font-weight: 600; font-size: 20px; margin: 8px 0;">Le ${totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <div style="background: #f9faf9; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px;">Order Information</h3>
        <p style="margin: 8px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        <p style="margin: 8px 0;"><strong>Customer:</strong> ${buyerName}</p>
        <p style="margin: 8px 0;"><strong>Delivery Address:</strong> ${deliveryAddress}</p>
      </div>

      <a href="${appUrl}/seller/order/${orderId}" class="button">Process Order Now</a>

      <p style="margin-top: 32px; font-size: 14px;">
        <strong>Important:</strong> Funds are held in escrow and will be released to your wallet once the buyer confirms delivery.
      </p>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateOrderStatusEmail = (data: any, appUrl: string) => {
  const { orderNumber, productName, status, buyerName, orderId } = data;
  
  const statusInfo: Record<string, { title: string; message: string; color: string }> = {
    processing: { title: '📦 Order Processing', message: 'Your order is being prepared by the seller.', color: '#45a876' },
    shipped: { title: '🚚 Order Shipped', message: 'Your order is on its way to you!', color: '#45a876' },
    delivered: { title: '✓ Order Delivered', message: 'Your order has been delivered. Please confirm receipt to release payment to the seller.', color: '#45a876' },
    cancelled: { title: '❌ Order Cancelled', message: 'This order has been cancelled. If you paid, a refund has been processed to your wallet.', color: '#5f6b65' }
  };

  const info = statusInfo[status] || statusInfo.processing;
  
  const content = `
    <div class="header" style="background: ${info.color};">
      <h1>${info.title}</h1>
    </div>
    <div class="content">
      <p>Hello ${buyerName},</p>
      
      <div style="background: #f9faf9; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 10px 0;">Order #${orderNumber}</h3>
        <p style="margin: 8px 0;"><strong>Product:</strong> ${productName}</p>
        <p style="margin-top: 16px;">${info.message}</p>
      </div>

      <a href="${appUrl}/order-detail/${orderId}" class="button" style="background: ${info.color};">View Order Details</a>
    </div>
  `;
  
  return getEmailWrapper(content, info.color);
};

const generateWalletTransactionEmail = (data: any, appUrl: string) => {
  const { transactionType, amount, balance, userName } = data;
  
  const txInfo: Record<string, { title: string; message: string; emoji: string }> = {
    deposit: { title: 'Deposit Confirmed', message: 'Your wallet has been topped up successfully.', emoji: '💰' },
    withdrawal: { title: 'Withdrawal Processed', message: 'Your withdrawal request has been processed.', emoji: '💸' },
    earning: { title: 'Payment Received', message: 'You have received payment for an order.', emoji: '🎉' },
    refund: { title: 'Refund Issued', message: 'A refund has been added to your wallet.', emoji: '↩️' }
  };

  const info = txInfo[transactionType] || txInfo.deposit;
  
  const content = `
    <div class="header">
      <h1>${info.emoji} ${info.title}</h1>
    </div>
    <div class="content" style="text-align: center;">
      <p>Hello ${userName},</p>
      <p>${info.message}</p>
      
      <div style="background: #f9faf9; padding: 32px; margin: 32px 0;">
        <p style="color: #5f6b65; font-size: 14px; margin-bottom: 8px;">Transaction Amount</p>
        <div style="color: #45a876; font-size: 42px; font-weight: 600; margin: 10px 0;">Le ${amount.toLocaleString()}</div>
      </div>

      <div style="background: #f9faf9; padding: 24px; margin: 24px 0;">
        <p style="margin-bottom: 8px;">Current Wallet Balance</p>
        <div style="color: #45a876; font-weight: 600; font-size: 24px;">Le ${balance.toLocaleString()}</div>
      </div>

      <a href="${appUrl}/wallet" class="button">View Wallet</a>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateNewMessageEmail = (data: any, appUrl: string) => {
  const { senderName, productName, messagePreview, conversationId } = data;
  
  const content = `
    <div class="header">
      <h1>💬 New Message</h1>
    </div>
    <div class="content">
      <h2>You have a new message</h2>
      <p><strong>${senderName}</strong> sent you a message${productName ? ` about ${productName}` : ''}.</p>
      
      <div style="background: #f9faf9; padding: 24px; margin: 24px 0; border-left: 4px solid #45a876;">
        <p style="font-style: italic; margin: 0;">"${messagePreview}"</p>
      </div>

      <a href="${appUrl}/chat/${conversationId}" class="button">Reply to Message</a>

      <p style="margin-top: 32px; font-size: 14px;">
        Quick responses help maintain great customer relationships on Market360.
      </p>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateDailyReminderEmail = (data: any, appUrl: string) => {
  const { userName, timeOfDay, message } = data;
  
  const timeEmoji = timeOfDay === 'morning' ? '🌅' : '🌆';
  const greeting = timeOfDay === 'morning' ? 'Good Morning' : 'Good Evening';
  
  const content = `
    <div class="header">
      <h1>${timeEmoji} ${greeting}</h1>
    </div>
    <div class="content" style="text-align: center;">
      <h2>Hello ${userName}!</h2>
      <p style="font-size: 16px;">${message}</p>
      
      <div style="background: #f9faf9; padding: 32px; margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0;">Quick Actions</h3>
        <p style="margin: 8px 0;">✓ Check new products and deals</p>
        <p style="margin: 8px 0;">✓ Browse stores near you</p>
        <p style="margin: 8px 0;">✓ Track your orders</p>
        <p style="margin: 8px 0;">✓ Chat with sellers</p>
      </div>

      <a href="${appUrl}" class="button">Open Market360</a>

      <p style="margin-top: 32px; font-size: 13px; color: #999;">
        You're receiving this because you're a valued member of Market360. You can manage your email preferences in settings.
      </p>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateSellerApprovedEmail = (data: any, appUrl: string) => {
  const { sellerName, businessName, storeName } = data;
  
  const content = `
    <div class="header">
      <h1>🎉 Welcome to Market360!</h1>
    </div>
    <div class="content">
      <h2>Hello ${sellerName},</h2>
      <p style="font-size: 16px;">
        Great news! Your seller application for <strong>${businessName}</strong> has been approved!
      </p>
      
      <div style="background: #f9faf9; padding: 24px; margin: 24px 0;">
        <h3 style="color: #45a876; margin: 0 0 8px 0;">Your Store: ${storeName}</h3>
        <p style="margin: 0;">Your store is now live on Market360 and ready for customers!</p>
      </div>
      
      <h3>Next Steps:</h3>
      <ul style="line-height: 1.8; padding-left: 20px;">
        <li>Add your first products to your store</li>
        <li>Set up your store profile and branding</li>
        <li>Start receiving orders from customers</li>
        <li>Manage your inventory and orders from the seller dashboard</li>
      </ul>

      <a href="${appUrl}/seller-dashboard" class="button">Go to Dashboard</a>

      <p style="margin-top: 32px; font-size: 14px;">
        If you have any questions, our support team is here to help!
      </p>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateUserSuspendedEmail = (data: any, appUrl: string) => {
  const { userName, reason, expiresAt } = data;
  
  const content = `
    <div class="header" style="background: #ff9900;">
      <h1>⏸️ Account Suspended</h1>
    </div>
    <div class="content">
      <h2>Hello ${userName},</h2>
      <p>Your Market360 account has been temporarily suspended.</p>
      
      <div style="background: #fff3cd; padding: 24px; margin: 24px 0; border-left: 4px solid #ff9900;">
        <h3 style="margin: 0 0 12px 0;">Reason for Suspension:</h3>
        <p style="margin: 0;">${reason}</p>
        ${expiresAt ? `<p style="margin: 16px 0 0 0;"><strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}</p>` : ''}
      </div>

      <p>If you believe this is an error, you can submit an appeal.</p>

      <a href="${appUrl}/moderation" class="button" style="background: #ff9900;">Submit Appeal</a>
    </div>
  `;
  
  return getEmailWrapper(content, '#ff9900');
};

const generateUserBannedEmail = (data: any, appUrl: string) => {
  const { userName, reason } = data;
  
  const content = `
    <div class="header" style="background: #dc2626;">
      <h1>🚫 Account Banned</h1>
    </div>
    <div class="content">
      <h2>Hello ${userName},</h2>
      <p>Your Market360 account has been permanently banned.</p>
      
      <div style="background: #fee; padding: 24px; margin: 24px 0; border-left: 4px solid #dc2626;">
        <h3 style="margin: 0 0 12px 0;">Reason for Ban:</h3>
        <p style="margin: 0;">${reason}</p>
      </div>

      <p>If you believe this is an error, you can submit an appeal.</p>

      <a href="${appUrl}/moderation" class="button" style="background: #dc2626;">Submit Appeal</a>
    </div>
  `;
  
  return getEmailWrapper(content, '#dc2626');
};

const generateAppealApprovedEmail = (data: any, appUrl: string) => {
  const { userName, adminResponse } = data;
  
  const content = `
    <div class="header">
      <h1>✅ Appeal Approved</h1>
    </div>
    <div class="content">
      <h2>Hello ${userName},</h2>
      <p>Good news! Your appeal has been approved and your account restrictions have been lifted.</p>
      
      <div style="background: #f0fdf4; padding: 24px; margin: 24px 0; border-left: 4px solid #45a876;">
        <h3 style="margin: 0 0 12px 0;">Admin Response:</h3>
        <p style="margin: 0;">${adminResponse}</p>
      </div>

      <p>You can now access all Market360 features again.</p>

      <a href="${appUrl}" class="button">Continue Shopping</a>
    </div>
  `;
  
  return getEmailWrapper(content);
};

const generateAppealRejectedEmail = (data: any, appUrl: string) => {
  const { userName, adminResponse } = data;
  
  const content = `
    <div class="header" style="background: #5f6b65;">
      <h1>Appeal Response</h1>
    </div>
    <div class="content">
      <h2>Hello ${userName},</h2>
      <p>Your appeal has been reviewed by our moderation team.</p>
      
      <div style="background: #f9faf9; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0;">Admin Response:</h3>
        <p style="margin: 0;">${adminResponse}</p>
      </div>

      <p style="font-size: 14px;">
        If you have any questions about this decision, please contact our support team.
      </p>
    </div>
  `;
  
  return getEmailWrapper(content, '#5f6b65');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data, appUrl }: EmailRequest = await req.json();

    console.log(`Received request to send ${type} email to ${to}`);

    // Default app URL
    const defaultAppUrl = Deno.env.get("APP_URL") || "https://market360-sl-connect.lovable.app";
    const finalAppUrl = appUrl || defaultAppUrl;

    // IMPORTANT: Resend test mode - only verified email can receive emails
    const VERIFIED_EMAIL = 'expertryder1@gmail.com';
    
    if (to !== VERIFIED_EMAIL) {
      console.log(`⚠️ Email skipped: Resend test mode only allows sending to ${VERIFIED_EMAIL}`);
      console.log(`Would have sent ${type} email to ${to}`);
      console.log('To enable sending to all users, verify a domain at resend.com/domains');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email skipped - domain verification required',
        recipient: to 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let html = '';
    let subject = '';
    let from = 'Market360 <onboarding@resend.dev>';

    switch (type) {
      case 'order_confirmation':
        html = generateOrderConfirmationEmail(data, finalAppUrl);
        subject = `Order Confirmed #${data.orderNumber} - Market360`;
        break;
      case 'new_order_seller':
        html = generateNewOrderSellerEmail(data, finalAppUrl);
        subject = `🔔 New Order #${data.orderNumber} - Action Required`;
        break;
      case 'order_status_update':
        html = generateOrderStatusEmail(data, finalAppUrl);
        subject = `Order Update #${data.orderNumber} - Market360`;
        break;
      case 'wallet_transaction':
        html = generateWalletTransactionEmail(data, finalAppUrl);
        subject = `Wallet ${data.transactionType === 'deposit' ? 'Top-Up' : 'Transaction'} - Market360`;
        break;
      case 'new_message':
        html = generateNewMessageEmail(data, finalAppUrl);
        subject = `New message from ${data.senderName} - Market360`;
        break;
      case 'daily_reminder':
        html = generateDailyReminderEmail(data, finalAppUrl);
        subject = data.timeOfDay === 'morning' ? '🌅 Good Morning from Market360' : '🌆 Good Evening from Market360';
        break;
      case 'seller_approved':
        html = generateSellerApprovedEmail(data, finalAppUrl);
        subject = 'Congratulations! Your Store is Approved 🎉';
        break;
      case 'user_suspended':
        html = generateUserSuspendedEmail(data, finalAppUrl);
        subject = '⏸️ Your Market360 Account Has Been Suspended';
        break;
      case 'user_banned':
        html = generateUserBannedEmail(data, finalAppUrl);
        subject = '🚫 Your Market360 Account Has Been Banned';
        break;
      case 'appeal_approved':
        html = generateAppealApprovedEmail(data, finalAppUrl);
        subject = '✅ Your Appeal Has Been Approved - Market360';
        break;
      case 'appeal_rejected':
        html = generateAppealRejectedEmail(data, finalAppUrl);
        subject = 'Appeal Response - Market360';
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    console.log('Email sent successfully via Resend');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
