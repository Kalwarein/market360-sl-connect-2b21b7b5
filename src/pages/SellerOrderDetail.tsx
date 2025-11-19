import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Eye
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

  const updateOrderStatus = async (newStatus: 'processing' | 'packed' | 'shipped' | 'delivered') => {
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      // Get status message
      const statusMessages = {
        processing: 'Your order has been accepted and is being processed',
        packed: 'Your order has been packed and ready for shipping',
        shipped: 'Your order is on the way to you',
        delivered: 'Your order has been delivered'
      };

      // Send system message to chat
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

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: order?.buyer_id,
        type: 'order',
        title: 'Order Update',
        body: statusMessages[newStatus],
        link_url: `/order-detail/${orderId}`
      });

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

    try {
      // Refund to buyer wallet
      const { data: buyerWallet } = await supabase
        .from('wallets')
        .select('id, balance_leones')
        .eq('user_id', order.buyer_id)
        .single();

      if (buyerWallet) {
        await supabase
          .from('wallets')
          .update({
            balance_leones: Number(buyerWallet.balance_leones) + Number(order.total_amount)
          })
          .eq('id', buyerWallet.id);

        await supabase.from('transactions').insert({
          wallet_id: buyerWallet.id,
          type: 'refund',
          amount: order.total_amount,
          status: 'completed',
          reference: `Order ${order.id} declined by seller`,
          metadata: { order_id: order.id }
        });
      }

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          escrow_status: 'refunded'
        })
        .eq('id', order.id);

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'order',
        title: 'Order Declined',
        body: `Seller declined your order for ${order.products.title}. Refund processed.`,
        link_url: `/order-detail/${order.id}`
      });

      // Send system message to chat
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', order.buyer_id)
        .eq('seller_id', user?.id)
        .eq('product_id', order.products.id)
        .single();

      if (conversation) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: user?.id,
          body: `🚫 Seller declined order. Refund of Le ${order.total_amount.toLocaleString()} processed.`,
          message_type: 'action'
        });
      }

      toast({
        title: 'Order Declined',
        description: 'Buyer has been notified and refunded'
      });

      loadOrderDetail();
    } catch (error) {
      console.error('Error declining order:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline order',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'processing':
      case 'packed':
        return 'bg-blue-500 text-white';
      case 'shipped':
        return 'bg-purple-500 text-white';
      case 'delivered':
      case 'completed':
        return 'bg-green-500 text-white';
      case 'disputed':
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Awaiting Acceptance',
      processing: 'Processing',
      packed: 'Packed & Ready',
      shipped: 'Shipped',
      delivered: 'Delivered',
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
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
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1">Buyer Notes:</p>
                  <p className="text-sm text-amber-900">{order.delivery_notes}</p>
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
                ? 'Payment will be released when buyer confirms delivery' 
                : 'Payment has been released to your wallet'}
            </p>
          </CardContent>
        </Card>

        {/* Order Actions */}
        {order.status !== 'completed' && order.status !== 'disputed' && (
          <div className="space-y-3">
            <h2 className="font-semibold">Order Actions</h2>
            
            {order.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => updateOrderStatus('processing')}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeclineOrder}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline Order
                </Button>
              </div>
            )}

            {order.status === 'processing' && (
              <Button
                onClick={() => updateOrderStatus('packed')}
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Mark as Packed
              </Button>
            )}

            {order.status === 'packed' && (
              <Button
                onClick={() => updateOrderStatus('shipped')}
                className="w-full"
              >
                <Truck className="h-4 w-4 mr-2" />
                Mark as Shipped
              </Button>
            )}

            {order.status === 'shipped' && (
              <Button
                onClick={() => updateOrderStatus('delivered')}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Delivered
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate(`/chat/${order.buyer_id}`)}
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
                <DropdownMenuItem onClick={() => navigate(`/chat/${order.buyer_id}`)}>
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
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Delivered</p>
                    <p className="text-xs text-muted-foreground">Awaiting buyer confirmation</p>
                  </div>
                </div>
              )}
              {order.status === 'completed' && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
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
    </div>
  );
};

export default SellerOrderDetail;
