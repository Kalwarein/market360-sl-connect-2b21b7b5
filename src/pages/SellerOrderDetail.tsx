import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { sendOrderStatusUpdateEmail } from '@/lib/emailService';
import DeliveryQRScanner from '@/components/DeliveryQRScanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MoreVertical,
  FileText,
  Eye,
  AlertTriangle,
  QrCode,
  Shield
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface SellerOrderDetail {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  quantity: number;
  escrow_status: string;
  escrow_amount: number;
  delivery_name: string;
  delivery_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_country: string;
  delivery_notes: string;
  products: {
    id: string;
    title: string;
    images: string[];
    product_code: string;
    price: number;
  };
  buyer_id: string;
  buyer_profile: {
    name: string;
    email: string;
    phone: string;
  };
}

const SellerOrderDetail = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeliveryWarning, setShowDeliveryWarning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (orderId && user) {
      loadOrderDetail();
    }
  }, [orderId, user]);

  const loadOrderDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (
            id,
            title,
            images,
            product_code,
            price
          )
        `)
        .eq('id', orderId)
        .eq('seller_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('name, email, phone')
          .eq('id', data.buyer_id)
          .single();

        setOrder({
          ...data,
          buyer_profile: buyerProfile || { name: '', email: '', phone: '' }
        } as any);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'processing' | 'packed' | 'shipped' | 'delivered') => {
    if (newStatus === 'delivered') {
      setShowDeliveryWarning(true);
      return;
    }
    await updateOrderStatus(newStatus);
  };

  const confirmDelivered = async () => {
    setShowDeliveryWarning(false);
    await updateOrderStatus('delivered');
  };

  const updateOrderStatus = async (newStatus: 'processing' | 'packed' | 'shipped' | 'delivered') => {
    setActionLoading(true);
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      const statusMessages = {
        processing: 'Your order has been accepted and is being processed',
        packed: 'Your order has been packed and ready for shipping',
        shipped: 'Your order is on the way to you',
        delivered: 'Your order has been delivered'
      };

      const orderNumber = `#360-${orderId?.substring(0, 8).toUpperCase()}`;

      const notificationConfig = {
        processing: {
          emoji: '⚙️',
          title: 'Order Processing',
          body: `Your order for "${order?.products.title}" is being prepared!`
        },
        packed: {
          emoji: '📦',
          title: 'Order Packed',
          body: `Your order for "${order?.products.title}" has been packed and is ready for shipping!`
        },
        shipped: {
          emoji: '🚚',
          title: 'Order Shipped!',
          body: `Your order for "${order?.products.title}" is on the way to you!`
        },
        delivered: {
          emoji: '✅',
          title: 'Order Delivered!',
          body: `Your order for "${order?.products.title}" has been delivered. Please show your QR code to the seller to confirm.`
        }
      };

      const config = notificationConfig[newStatus];

      try {
        await supabase.functions.invoke('create-order-notification', {
          body: {
            user_id: order?.buyer_id,
            type: 'order',
            title: `${config.emoji} ${config.title}`,
            body: config.body,
            link_url: `/order/${orderId}`,
            image_url: order?.products.images[0],
            icon: '/pwa-192x192.png',
            requireInteraction: newStatus === 'delivered',
            metadata: { 
              order_id: orderId, 
              status: newStatus,
              product_title: order?.products.title,
              amount: order?.total_amount,
              updated_at: new Date().toISOString()
            }
          }
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      if (newStatus === 'delivered') {
        try {
          if (order?.buyer_profile?.phone) {
            const orderNumber = `#360-${orderId?.substring(0, 8).toUpperCase()}`;
            await supabase.functions.invoke('send-sms', {
              body: {
                to: order.buyer_profile.phone,
                message: `📦 Market360 - Product Delivered!\n\n${order.products.title} has been delivered.\n\nOrder: ${orderNumber}\n\nShow your QR code to the seller to confirm delivery and release payment.`
              }
            });
          }
        } catch (smsError) {
          console.error('Failed to send SMS to buyer:', smsError);
        }
      }

      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', order?.buyer_id)
        .eq('seller_id', user?.id)
        .eq('product_id', order?.products?.id)
        .maybeSingle();

      if (conversation) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: user?.id!,
          body: `📦 Order Update: ${statusMessages[newStatus]}`,
          message_type: 'text'
        });
      }

      try {
        if (order?.buyer_profile?.email) {
          const statusLabels = {
            processing: 'Processing',
            packed: 'Packed',
            shipped: 'Shipped',
            delivered: 'Delivered'
          };

          await sendOrderStatusUpdateEmail(order.buyer_profile.email, {
            orderNumber,
            orderId: orderId!,
            productName: order.products.title,
            status: statusLabels[newStatus],
            buyerName: order.buyer_profile.name || 'Customer'
          }, order.buyer_id);
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      toast({
        title: 'Success',
        description: `Order marked as ${newStatus}`
      });

      loadOrderDetail();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineOrder = async () => {
    if (!order || order.status !== 'pending') {
      toast({
        title: 'Cannot Decline',
        description: 'Order can only be declined when pending',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('process-order-refund', {
        body: {
          order_id: order.id,
          refund_type: 'seller_decline',
          initiator_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Order Declined',
        description: 'Buyer has been notified and refunded',
        duration: 5000
      });

      loadOrderDetail();
    } catch (error) {
      console.error('Error declining order:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline order. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChatWithBuyer = async () => {
    if (!order) return;
    try {
      let { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', order.buyer_id)
        .eq('seller_id', user?.id)
        .eq('product_id', order.products.id)
        .maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            buyer_id: order.buyer_id,
            seller_id: user?.id,
            product_id: order.products.id
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConv.id;
      }

      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast({ title: 'Error', description: 'Failed to open chat', variant: 'destructive' });
    }
  };

  const handleQRScanSuccess = (data: { amount_released: number; order_id: string; product_title: string }) => {
    toast({
      title: '🎉 Payment Received!',
      description: `Le ${data.amount_released.toLocaleString()} added to your wallet`,
      duration: 5000
    });
    loadOrderDetail();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'processing':
      case 'packed':
        return 'bg-blue-500 text-white';
      case 'shipped':
        return 'bg-purple-500 text-white';
      case 'delivered':
      case 'completed':
        return 'bg-emerald-500 text-white';
      case 'disputed':
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted-foreground text-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Awaiting Acceptance',
      processing: 'Processing',
      packed: 'Packed & Ready',
      shipped: 'Shipped',
      delivered: 'Awaiting QR Scan',
      completed: 'Completed',
      disputed: 'Disputed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Order not found</p>
              <Button onClick={() => navigate('/seller-dashboard')}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  const canScanQR = order.status === 'delivered' && order.escrow_status === 'holding';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/seller-dashboard')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Order Details</h1>
            <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* QR Scanner Section - For delivered orders awaiting confirmation */}
        {canScanQR && user && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <QrCode className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-lg">Confirm Delivery</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scan the buyer's QR code to receive your payment instantly
                </p>
              </div>
              
              <DeliveryQRScanner 
                sellerId={user.id}
                onSuccess={handleQRScanSuccess}
              />

              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
                  <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> Only scan the QR code after you have physically delivered the product to the buyer.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Order Message */}
        {order.status === 'completed' && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">Order Completed</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">Payment has been released to your wallet</p>
            </CardContent>
          </Card>
        )}

        {/* Buyer Info */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Buyer Information
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.buyer_profile.name || order.buyer_profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.buyer_profile.phone || 'Not provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Product Details</h2>
            <div className="flex gap-4">
              <img
                src={order.products.images[0]}
                alt={order.products.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium">{order.products.title}</h3>
                <p className="text-xs text-muted-foreground">{order.products.product_code}</p>
                <p className="text-sm mt-1">Quantity: {order.quantity}</p>
                <p className="font-bold text-lg text-primary mt-1">
                  Le {order.total_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.delivery_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.delivery_phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{order.shipping_address}</p>
                  <p>{order.shipping_city}, {order.shipping_region}</p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
              {order.delivery_notes && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">Buyer Notes:</p>
                  <p className="text-sm text-amber-900 dark:text-amber-300">{order.delivery_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Escrow Status */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Payment Status</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Escrow Amount:</span>
              <span className="font-bold text-primary">Le {order.escrow_amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant={order.escrow_status === 'released' ? 'default' : 'secondary'}>
                {order.escrow_status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {order.escrow_status === 'holding' 
                ? 'Payment will be released when you scan the buyer\'s QR code' 
                : 'Payment has been released to your wallet'}
            </p>
          </CardContent>
        </Card>

        {/* Order Actions */}
        {order.status !== 'completed' && order.status !== 'disputed' && order.status !== 'cancelled' && (
          <div className="space-y-3">
            <h2 className="font-semibold">Order Actions</h2>
            
            {order.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => updateOrderStatus('processing')}
                  className="w-full"
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Processing...' : 'Accept Order'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeclineOrder}
                  className="w-full"
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {actionLoading ? 'Declining...' : 'Decline Order'}
                </Button>
              </div>
            )}

            {order.status === 'processing' && (
              <Button
                onClick={() => updateOrderStatus('packed')}
                className="w-full"
                disabled={actionLoading}
              >
                <Package className="h-4 w-4 mr-2" />
                {actionLoading ? 'Updating...' : 'Mark as Packed'}
              </Button>
            )}

            {order.status === 'packed' && (
              <Button
                onClick={() => updateOrderStatus('shipped')}
                className="w-full"
                disabled={actionLoading}
              >
                <Truck className="h-4 w-4 mr-2" />
                {actionLoading ? 'Updating...' : 'Mark as Shipped'}
              </Button>
            )}

            {order.status === 'shipped' && (
              <Button
                onClick={() => handleStatusChange('delivered')}
                className="w-full"
                disabled={actionLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {actionLoading ? 'Updating...' : 'Arrived at Buyer Location'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleChatWithBuyer}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Buyer
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <MoreVertical className="h-4 w-4 mr-2" />
                  More Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleChatWithBuyer}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Chat History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/product/${order.products.id}`)}>
                  <Package className="h-4 w-4 mr-2" />
                  View Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Print Receipt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Order Timeline */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Order Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'pending' ? 'bg-primary' : 'bg-muted'}`}>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Order Received</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {['processing', 'packed', 'shipped', 'delivered', 'completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Accepted</p>
                    <p className="text-xs text-muted-foreground">Processing order</p>
                  </div>
                </div>
              )}
              {['packed', 'shipped', 'delivered', 'completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Packed</p>
                    <p className="text-xs text-muted-foreground">Ready for shipping</p>
                  </div>
                </div>
              )}
              {['shipped', 'delivered', 'completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Shipped</p>
                    <p className="text-xs text-muted-foreground">On the way</p>
                  </div>
                </div>
              )}
              {['delivered', 'completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <QrCode className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Arrived at Buyer</p>
                    <p className="text-xs text-muted-foreground">
                      {order.status === 'delivered' ? 'Awaiting QR scan confirmation' : 'Delivery confirmed'}
                    </p>
                  </div>
                </div>
              )}
              {order.status === 'completed' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Completed</p>
                    <p className="text-xs text-muted-foreground">Funds released to wallet</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />

      {/* Delivery Warning Dialog */}
      <AlertDialog open={showDeliveryWarning} onOpenChange={setShowDeliveryWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-950">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <AlertDialogTitle>Arrived at Buyer Location?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 text-base">
              <p>You're about to mark this order as <strong>Delivered</strong>.</p>
              <div className="bg-primary/10 p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold text-primary">QR-Based Confirmation:</p>
                <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Ask the buyer to show their QR code</li>
                  <li>Scan the QR code to confirm delivery</li>
                  <li>Payment will be released instantly to your wallet</li>
                </ul>
              </div>
              <p className="text-sm">Make sure you're at the buyer's location before proceeding.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelivered}
              className="bg-primary hover:bg-primary/90"
            >
              Yes, I'm at the Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SellerOrderDetail;
