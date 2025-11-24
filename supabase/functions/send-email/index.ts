import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'order_confirmation' | 'new_order_seller' | 'order_status_update' | 'wallet_transaction' | 'new_message' | 'seller_approved' | 'user_suspended' | 'user_banned' | 'appeal_approved' | 'appeal_rejected';
  to: string;
  data: any;
}

const generateOrderConfirmationEmail = (data: any, appUrl: string) => {
  const { orderNumber, productName, productImage, quantity, totalAmount, deliveryAddress, storeName } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: hsl(150 20% 97%); margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: hsl(0 0% 100%); }
          .header { background: linear-gradient(135deg, hsl(151 50% 45%) 0%, hsl(151 50% 55%) 100%); padding: 48px 24px; text-align: center; }
          .header h1 { color: hsl(0 0% 100%); margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 48px 32px; }
          .product-card { background: hsl(150 20% 97%); border-radius: 16px; padding: 24px; margin: 24px 0; display: flex; gap: 20px; align-items: center; }
          .product-image { width: 100px; height: 100px; object-fit: cover; border-radius: 12px; }
          .product-info h3 { margin: 0 0 8px 0; color: hsl(156 40% 15%); font-size: 18px; font-weight: 600; }
          .product-info p { margin: 4px 0; color: hsl(156 10% 50%); font-size: 14px; }
          .price { color: hsl(151 50% 45%); font-weight: 700; font-size: 20px; }
          .details-box { background: hsl(150 20% 97%); padding: 24px; margin: 24px 0; border-radius: 12px; }
          .details-box h3 { margin: 0 0 16px 0; color: hsl(156 40% 15%); font-size: 16px; font-weight: 600; }
          .details-box p { margin: 8px 0; color: hsl(156 10% 50%); font-size: 14px; line-height: 1.6; }
          .footer { background: hsl(156 40% 15%); color: hsl(0 0% 100%); padding: 32px; text-align: center; }
          .footer p { margin: 6px 0; font-size: 14px; }
          .button { display: inline-block; background: hsl(151 50% 45%); color: hsl(0 0% 100%); padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; transition: all 0.2s; }
          .button:hover { background: hsl(151 50% 38%); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Order Confirmed</h1>
          </div>
          <div class="content">
            <h2 style="color: hsl(156 40% 15%); font-size: 24px; margin: 0 0 12px 0;">Thank you for your order!</h2>
            <p style="color: hsl(156 10% 50%); margin: 0 0 24px 0;">Your order has been successfully placed and is being processed.</p>
            
            <div class="product-card">
              <img src="${productImage}" alt="${productName}" class="product-image" />
              <div class="product-info">
                <h3>${productName}</h3>
                <p>Quantity: ${quantity}</p>
                <p class="price">Le ${totalAmount.toLocaleString()}</p>
                <p style="font-size: 12px; color: hsl(156 10% 50%);">From ${storeName}</p>
              </div>
            </div>

            <div class="details-box">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
            </div>

            <a href="${appUrl}/order-detail/${data.orderId}" class="button">Track Your Order</a>

            <p style="margin-top: 32px; color: hsl(156 10% 50%); font-size: 14px; line-height: 1.6;">
              Your order is secured with Market360's escrow protection. Funds will only be released to the seller once you confirm delivery.
            </p>
          </div>
          <div class="footer">
            <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Market360</p>
            <p style="opacity: 0.9;">Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 16px; opacity: 0.7;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateNewOrderSellerEmail = (data: any, appUrl: string) => {
  const { orderNumber, productName, productImage, quantity, totalAmount, buyerName, deliveryAddress } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: hsl(150 20% 97%); margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: hsl(0 0% 100%); }
          .header { background: linear-gradient(135deg, hsl(203 100% 40%) 0%, hsl(151 50% 45%) 100%); padding: 48px 24px; text-align: center; }
          .header h1 { color: hsl(0 0% 100%); margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 48px 32px; }
          .alert-badge { background: hsl(38 92% 50%); color: hsl(0 0% 100%); padding: 10px 20px; border-radius: 24px; display: inline-block; margin-bottom: 24px; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; }
          .product-card { background: hsl(150 20% 97%); border-radius: 16px; padding: 24px; margin: 24px 0; display: flex; gap: 20px; align-items: center; }
          .product-image { width: 100px; height: 100px; object-fit: cover; border-radius: 12px; }
          .product-info h3 { margin: 0 0 8px 0; color: hsl(156 40% 15%); font-size: 18px; font-weight: 600; }
          .product-info p { margin: 4px 0; color: hsl(156 10% 50%); font-size: 14px; }
          .price { color: hsl(151 50% 45%); font-weight: 700; font-size: 20px; }
          .details-box { background: hsl(150 20% 97%); padding: 24px; margin: 24px 0; border-radius: 12px; }
          .details-box h3 { margin: 0 0 16px 0; color: hsl(156 40% 15%); font-size: 16px; font-weight: 600; }
          .details-box p { margin: 8px 0; color: hsl(156 10% 50%); font-size: 14px; line-height: 1.6; }
          .footer { background: hsl(156 40% 15%); color: hsl(0 0% 100%); padding: 32px; text-align: center; }
          .footer p { margin: 6px 0; font-size: 14px; }
          .button { display: inline-block; background: hsl(203 100% 40%); color: hsl(0 0% 100%); padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; transition: all 0.2s; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Order Received</h1>
          </div>
          <div class="content">
            <span class="alert-badge">ACTION REQUIRED</span>
            <h2 style="color: hsl(156 40% 15%); font-size: 24px; margin: 0 0 12px 0;">You have a new order to process</h2>
            <p style="color: hsl(156 10% 50%); margin: 0 0 24px 0;">A customer has placed an order for your product. Please process it promptly.</p>
            
            <div class="product-card">
              <img src="${productImage}" alt="${productName}" class="product-image" />
              <div class="product-info">
                <h3>${productName}</h3>
                <p>Quantity: ${quantity}</p>
                <p class="price">Le ${totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div class="details-box">
              <h3>Order Information</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Customer:</strong> ${buyerName}</p>
              <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
            </div>

            <a href="${appUrl}/seller/order/${data.orderId}" class="button">Process Order Now</a>

            <p style="margin-top: 32px; color: hsl(156 10% 50%); font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong> Funds are held in escrow and will be released to your wallet once the buyer confirms delivery.
            </p>
          </div>
          <div class="footer">
            <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Market360 Seller Dashboard</p>
            <p style="opacity: 0.9;">Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 16px; opacity: 0.7;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateOrderStatusEmail = (data: any, appUrl: string) => {
  const { orderNumber, productName, status, buyerName } = data;
  
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    processing: {
      title: '📦 Order Processing',
      message: 'Your order is being prepared by the seller.',
      color: '#0077CC'
    },
    shipped: {
      title: '🚚 Order Shipped',
      message: 'Your order is on its way to you!',
      color: '#0FA86C'
    },
    delivered: {
      title: '✓ Order Delivered',
      message: 'Your order has been delivered. Please confirm receipt to release payment to the seller.',
      color: '#0B8A6D'
    },
    cancelled: {
      title: '❌ Order Cancelled',
      message: 'This order has been cancelled. If you paid, a refund has been processed to your wallet.',
      color: '#6B7280'
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.processing;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: ${statusInfo.color}; padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .status-card { background: #f7f9fb; border-left: 4px solid ${statusInfo.color}; padding: 25px; margin: 20px 0; border-radius: 8px; }
          .status-card h3 { margin: 0 0 10px 0; color: #0B2B22; }
          .status-card p { margin: 0; color: #6B7280; line-height: 1.6; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .button { display: inline-block; background: ${statusInfo.color}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusInfo.title}</h1>
          </div>
          <div class="content">
            <p>Hello ${buyerName},</p>
            
            <div class="status-card">
              <h3>Order #${orderNumber}</h3>
              <p><strong>Product:</strong> ${productName}</p>
              <p style="margin-top: 15px;">${statusInfo.message}</p>
            </div>

            <a href="${appUrl}/order-detail/${data.orderId}" class="button">View Order Details</a>
          </div>
          <div class="footer">
            <p><strong>Market360</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateWalletTransactionEmail = (data: any, appUrl: string) => {
  const { transactionType, amount, balance, userName } = data;
  
  const transactionInfo: Record<string, { title: string; message: string; color: string }> = {
    deposit: {
      title: '💰 Deposit Confirmed',
      message: 'Your wallet has been topped up successfully.',
      color: '#0FA86C'
    },
    withdrawal: {
      title: '💸 Withdrawal Processed',
      message: 'Your withdrawal request has been processed.',
      color: '#0077CC'
    },
    earning: {
      title: '🎉 Payment Received',
      message: 'You have received payment for an order.',
      color: '#0B8A6D'
    },
    refund: {
      title: '↩️ Refund Issued',
      message: 'A refund has been added to your wallet.',
      color: '#FF9900'
    }
  };

  const txInfo = transactionInfo[transactionType] || transactionInfo.deposit;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: ${txInfo.color}; padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .amount-display { background: #f7f9fb; padding: 30px; border-radius: 12px; margin: 30px 0; }
          .amount-display .label { color: #6B7280; font-size: 14px; margin-bottom: 8px; }
          .amount-display .amount { color: ${txInfo.color}; font-size: 42px; font-weight: bold; margin: 10px 0; }
          .balance-info { background: #f7f9fb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .balance-info p { margin: 8px 0; color: #6B7280; }
          .balance-info .balance { color: #0FA86C; font-weight: bold; font-size: 24px; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .button { display: inline-block; background: ${txInfo.color}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${txInfo.title}</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>${txInfo.message}</p>
            
            <div class="amount-display">
              <div class="label">Transaction Amount</div>
              <div class="amount">Le ${amount.toLocaleString()}</div>
            </div>

            <div class="balance-info">
              <p>Current Wallet Balance</p>
              <div class="balance">Le ${balance.toLocaleString()}</div>
            </div>

            <a href="${appUrl}/wallet" class="button">View Wallet</a>
          </div>
          <div class="footer">
            <p><strong>Market360 Wallet</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateNewMessageEmail = (data: any, appUrl: string) => {
  const { senderName, productName, messagePreview, conversationId } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #0FA86C 0%, #0077CC 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .message-card { background: #f7f9fb; border-left: 4px solid #0FA86C; padding: 25px; margin: 20px 0; border-radius: 8px; }
          .message-card .sender { font-weight: bold; color: #0B2B22; margin-bottom: 10px; }
          .message-card .preview { color: #6B7280; line-height: 1.6; font-style: italic; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .button { display: inline-block; background: #0FA86C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <h2>You have a new message!</h2>
            <p>${senderName} sent you a message${productName ? ` about ${productName}` : ''}.</p>
            
            <div class="message-card">
              <div class="sender">From: ${senderName}</div>
              <div class="preview">"${messagePreview}"</div>
            </div>

            <a href="${appUrl}/chat/${conversationId}" class="button">Reply Now</a>
          </div>
          <div class="footer">
            <p><strong>Market360 Messages</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateUserSuspendedEmail = (data: any) => {
  const { userName, reason, expiresAt } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: #FF9900; padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .warning-box { background: #FFF3CD; border-left: 4px solid #FF9900; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .warning-box h3 { margin: 0 0 12px 0; color: #856404; }
          .warning-box p { margin: 6px 0; color: #856404; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏸️ Account Suspended</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Your Market360 account has been temporarily suspended.</p>
            
            <div class="warning-box">
              <h3>Suspension Details</h3>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Account will be restored on:</strong> ${expiresAt}</p>
            </div>

            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              You will be able to access your account once the suspension period expires. If you believe this suspension was made in error, you can submit an appeal when you log in.
            </p>
          </div>
          <div class="footer">
            <p><strong>Market360 Moderation Team</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateUserBannedEmail = (data: any) => {
  const { userName, reason } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .danger-box { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .danger-box h3 { margin: 0 0 12px 0; color: #991B1B; }
          .danger-box p { margin: 6px 0; color: #991B1B; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Account Banned</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Your Market360 account has been permanently banned.</p>
            
            <div class="danger-box">
              <h3>Ban Details</h3>
              <p><strong>Reason:</strong> ${reason}</p>
            </div>

            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              This is a permanent action. If you believe this ban was made in error, you can submit an appeal for account restoration when you log in.
            </p>
          </div>
          <div class="footer">
            <p><strong>Market360 Moderation Team</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateAppealApprovedEmail = (data: any) => {
  const { userName, adminResponse } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .success-box { background: #D1FAE5; border-left: 4px solid #0FA86C; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .success-box h3 { margin: 0 0 12px 0; color: #065F46; }
          .success-box p { margin: 6px 0; color: #065F46; line-height: 1.6; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .button { display: inline-block; background: #0FA86C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appeal Approved!</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Great news! Your appeal has been approved and your account restriction has been lifted.</p>
            
            <div class="success-box">
              <h3>Admin Response</h3>
              <p>${adminResponse}</p>
            </div>

            <a href="https://market360-sl-connect.lovable.app/" class="button">Access Your Account</a>

            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              You can now access your Market360 account without any restrictions. Welcome back!
            </p>
          </div>
          <div class="footer">
            <p><strong>Market360 Moderation Team</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateAppealRejectedEmail = (data: any) => {
  const { userName, adminResponse } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .info-box { background: #F3F4F6; border-left: 4px solid #6B7280; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .info-box h3 { margin: 0 0 12px 0; color: #374151; }
          .info-box p { margin: 6px 0; color: #374151; line-height: 1.6; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appeal Response</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Your appeal has been reviewed. After careful consideration, your appeal has been rejected.</p>
            
            <div class="info-box">
              <h3>Admin Response</h3>
              <p>${adminResponse}</p>
            </div>

            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              If you have any questions about this decision, please contact our support team.
            </p>
          </div>
          <div class="footer">
            <p><strong>Market360 Moderation Team</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};


const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    console.log(`Received request to send ${type} email to ${to}`);

    // IMPORTANT: Resend test mode - only verified email can receive emails
    // Until domain is verified, silently skip sending to other addresses
    const VERIFIED_EMAIL = 'expertryder1@gmail.com';
    
    if (to !== VERIFIED_EMAIL) {
      console.log(`⚠️ Email skipped: Resend test mode only allows sending to ${VERIFIED_EMAIL}`);
      console.log(`Would have sent ${type} email to ${to}`);
      console.log('To enable sending to all users, verify a domain at resend.com/domains');
      
      // Return success to prevent order failures
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email skipped - domain verification required',
        recipient: to 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    let html = '';
    let subject = '';

    switch (type) {
      case 'seller_approved':
        subject = 'Congratulations! Your Store is Approved 🎉';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to Market360! 🎊</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #0B2B22;">Hello ${data.sellerName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Great news! Your seller application for <strong>${data.businessName}</strong> has been approved!
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0FA86C;">
                <h3 style="color: #0FA86C; margin-top: 0;">Your Store: ${data.storeName}</h3>
                <p style="color: #666;">Your store is now live on Market360 and ready for customers!</p>
              </div>
              <h3 style="color: #0B2B22;">Next Steps:</h3>
              <ul style="line-height: 1.8; color: #333;">
                <li>Add your first products to your store</li>
                <li>Set up your store profile and branding</li>
                <li>Start receiving orders from customers</li>
                <li>Manage your inventory and orders from the seller dashboard</li>
              </ul>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any questions, our support team is here to help!
              </p>
            </div>
            <div style="background: #0B2B22; padding: 20px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 14px;">
                © 2024 Market360. All rights reserved.
              </p>
            </div>
          </div>
        `;
        break;
      case 'order_confirmation':
        html = generateOrderConfirmationEmail(data);
        subject = `Order Confirmed #${data.orderNumber} - Market360`;
        break;
      case 'new_order_seller':
        html = generateNewOrderSellerEmail(data);
        subject = `🔔 New Order #${data.orderNumber} - Action Required`;
        break;
      case 'order_status_update':
        html = generateOrderStatusEmail(data);
        subject = `Order Update #${data.orderNumber} - Market360`;
        break;
      case 'wallet_transaction':
        html = generateWalletTransactionEmail(data);
        subject = `Wallet ${data.transactionType === 'deposit' ? 'Top-Up' : 'Transaction'} - Market360`;
        break;
      case 'new_message':
        html = generateNewMessageEmail(data);
        subject = `New message from ${data.senderName} - Market360`;
        break;
      case 'user_suspended':
        html = generateUserSuspendedEmail(data);
        subject = '⏸️ Your Market360 Account Has Been Suspended';
        break;
      case 'user_banned':
        html = generateUserBannedEmail(data);
        subject = '🚫 Your Market360 Account Has Been Banned';
        break;
      case 'appeal_approved':
        html = generateAppealApprovedEmail(data);
        subject = '✅ Your Appeal Has Been Approved - Market360';
        break;
      case 'appeal_rejected':
        html = generateAppealRejectedEmail(data);
        subject = 'Appeal Response - Market360';
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const { error } = await resend.emails.send({
      from: 'Market360 <onboarding@resend.dev>',
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
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
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
