import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILERSEND_API_KEY = Deno.env.get("MAILERSEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'order_confirmation' | 'new_order_seller' | 'order_status_update' | 'wallet_transaction' | 'new_message';
  to: string;
  data: any;
}

const generateOrderConfirmationEmail = (data: any) => {
  const { orderNumber, productName, productImage, quantity, totalAmount, deliveryAddress, storeName } = data;
  
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
          .product-card { background: #f7f9fb; border-radius: 12px; padding: 20px; margin: 20px 0; display: flex; gap: 20px; align-items: center; }
          .product-image { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
          .product-info h3 { margin: 0 0 8px 0; color: #0B2B22; }
          .product-info p { margin: 4px 0; color: #6B7280; }
          .price { color: #0FA86C; font-weight: bold; font-size: 18px; }
          .details-box { background: #f7f9fb; border-left: 4px solid #0FA86C; padding: 20px; margin: 20px 0; }
          .details-box h3 { margin: 0 0 12px 0; color: #0B2B22; }
          .details-box p { margin: 6px 0; color: #6B7280; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .button { display: inline-block; background: #0FA86C; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order!</h2>
            <p>Your order has been successfully placed and is being processed.</p>
            
            <div class="product-card">
              <img src="${productImage}" alt="${productName}" class="product-image" />
              <div class="product-info">
                <h3>${productName}</h3>
                <p>Quantity: ${quantity}</p>
                <p class="price">Le ${totalAmount.toLocaleString()}</p>
                <p style="font-size: 12px; color: #999;">From ${storeName}</p>
              </div>
            </div>

            <div class="details-box">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
            </div>

            <a href="https://market360-sl-connect.lovable.app/order-detail/${data.orderId}" class="button">Track Your Order</a>

            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              Your order is secured with Market360's escrow protection. Funds will only be released to the seller once you confirm delivery.
            </p>
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

const generateNewOrderSellerEmail = (data: any) => {
  const { orderNumber, productName, productImage, quantity, totalAmount, buyerName, deliveryAddress } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #0077CC 0%, #0FA86C 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .alert-badge { background: #FF9900; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
          .product-card { background: #f7f9fb; border-radius: 12px; padding: 20px; margin: 20px 0; display: flex; gap: 20px; align-items: center; }
          .product-image { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
          .product-info h3 { margin: 0 0 8px 0; color: #0B2B22; }
          .product-info p { margin: 4px 0; color: #6B7280; }
          .price { color: #0FA86C; font-weight: bold; font-size: 18px; }
          .details-box { background: #f7f9fb; border-left: 4px solid #0077CC; padding: 20px; margin: 20px 0; }
          .details-box h3 { margin: 0 0 12px 0; color: #0B2B22; }
          .details-box p { margin: 6px 0; color: #6B7280; }
          .footer { background: #0B2B22; color: #ffffff; padding: 30px; text-align: center; }
          .footer p { margin: 5px 0; font-size: 14px; }
          .button { display: inline-block; background: #0077CC; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Order Received!</h1>
          </div>
          <div class="content">
            <span class="alert-badge">ACTION REQUIRED</span>
            <h2>You have a new order to process</h2>
            <p>A customer has placed an order for your product. Please process it promptly.</p>
            
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

            <a href="https://market360-sl-connect.lovable.app/seller/order/${data.orderId}" class="button">Process Order Now</a>

            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              <strong>Important:</strong> Funds are held in escrow and will be released to your wallet once the buyer confirms delivery.
            </p>
          </div>
          <div class="footer">
            <p><strong>Market360 Seller Dashboard</strong></p>
            <p>Sierra Leone's Trusted Marketplace</p>
            <p style="font-size: 12px; margin-top: 15px;">© 2025 Market360. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateOrderStatusEmail = (data: any) => {
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

            <a href="https://market360-sl-connect.lovable.app/order-detail/${data.orderId}" class="button">View Order Details</a>
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

const generateWalletTransactionEmail = (data: any) => {
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

            <a href="https://market360-sl-connect.lovable.app/wallet" class="button">View Wallet</a>
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

const generateNewMessageEmail = (data: any) => {
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

            <a href="https://market360-sl-connect.lovable.app/chat/${conversationId}" class="button">Reply Now</a>
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to}`);

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
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: 'MS_noreply@trial-z3m5jgrp1r04dpyo.mlsender.net',
          name: 'Market360'
        },
        to: [{
          email: to
        }],
        subject,
        html,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`MailerSend API error: ${JSON.stringify(responseData)}`);
    }

    console.log('Email sent successfully:', responseData);

    return new Response(JSON.stringify(responseData), {
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
