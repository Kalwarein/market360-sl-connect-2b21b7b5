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
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  XCircle
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface OrderDetail {
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
  stores: {
    store_name: string;
    logo_url: string;
  };
  seller_id: string;
}

const OrderDetail = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

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
            price,
            store_id
          )
        `)
        .eq('id', orderId)
        .eq('buyer_id', user?.id)
        .single();

      if (error) throw error;

      if (data && data.products) {
        const { data: store } = await supabase
          .from('stores')
          .select('store_name, logo_url')
          .eq('id', data.products.store_id)
          .single();

        setOrder({
          ...data,
          stores: store || { store_name: '', logo_url: '' }
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

  const handleConfirmReceived = async () => {
    try {
      // Release escrow funds to seller
      const { data: sellerWallet } = await supabase
        .from('wallets')
        .select('id, balance_leones')
        .eq('user_id', order?.seller_id)
        .single();

      if (sellerWallet) {
        await supabase
          .from('wallets')
          .update({
            balance_leones: Number(sellerWallet.balance_leones) + Number(order?.escrow_amount)
          })
          .eq('id', sellerWallet.id);

        // Create transaction record
        await supabase.from('transactions').insert({
          wallet_id: sellerWallet.id,
          type: 'earning',
          amount: order?.escrow_amount,
          status: 'completed',
          reference: `Order #${order?.id.slice(0, 8)} - Escrow released`
        });
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          escrow_status: 'released'
        })
        .eq('id', orderId);

      // Notify seller
      await supabase.from('notifications').insert({
        user_id: order?.seller_id,
        type: 'order',
        title: 'Order Completed',
        body: `Buyer confirmed receipt. Funds released to your wallet.`,
        link_url: `/seller-dashboard`
      });

      toast({
        title: 'Order Completed',
        description: 'Thank you! Funds have been released to the seller.'
      });

      setShowConfirmDialog(false);
      loadOrderDetail();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm order',
        variant: 'destructive'
      });
    }
  };

  const handleReportProblem = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: 'Required',
        description: 'Please describe the problem',
        variant: 'destructive'
      });
      return;
    }

    try {
      await supabase
        .from('orders')
        .update({
          status: 'disputed',
          dispute_reason: disputeReason,
          dispute_opened_at: new Date().toISOString(),
          escrow_status: 'frozen'
        })
        .eq('id', orderId);

      // Notify admin
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'order' as const,
          title: 'Order Dispute',
          body: `Order ${orderId?.slice(0, 8)} has been disputed by buyer`,
          link_url: `/admin/orders`
        }));

        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: 'Dispute Opened',
        description: 'Admin will review your case shortly'
      });

      setShowDisputeDialog(false);
      loadOrderDetail();
    } catch (error) {
      console.error('Error reporting problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to report problem',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'processing':
      case 'packed':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'disputed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
      case 'packed':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
      case 'completed':
        return 'bg-green-500';
      case 'disputed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
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
              <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
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
            onClick={() => navigate('/orders')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Order Details</h1>
            <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Timeline */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              {getStatusIcon(order.status)}
              Order Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'pending' ? 'bg-primary' : 'bg-muted'}`}>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Order Placed</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {['processing', 'packed', 'shipped', 'delivered', 'completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Processing</p>
                    <p className="text-xs text-muted-foreground">Seller is preparing your order</p>
                  </div>
                </div>
              )}
              {['shipped', 'delivered', 'completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Shipped</p>
                    <p className="text-xs text-muted-foreground">Order is on the way</p>
                  </div>
                </div>
              )}
              {['completed'].includes(order.status) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Completed</p>
                    <p className="text-xs text-muted-foreground">Order delivered successfully</p>
                  </div>
                </div>
              )}
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
                <p className="text-sm text-muted-foreground">{order.stores.store_name}</p>
                <p className="text-xs text-muted-foreground">{order.products.product_code}</p>
                <p className="text-sm mt-1">Qty: {order.quantity}</p>
                <p className="font-bold text-lg text-primary mt-1">
                  Le {order.total_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
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
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-xs font-medium">Notes:</p>
                  <p className="text-xs">{order.delivery_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Escrow Status */}
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold mb-3">Payment Status</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm">Escrow Status:</span>
              <Badge variant={order.escrow_status === 'released' ? 'default' : 'secondary'}>
                {order.escrow_status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {order.escrow_status === 'holding' 
                ? 'Your payment is securely held until you confirm delivery' 
                : 'Payment has been released to seller'}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {order.status !== 'completed' && order.status !== 'disputed' && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/chat/${order.seller_id}`)}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Seller
            </Button>
            {order.status === 'delivered' && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Received
              </Button>
            )}
          </div>
        )}

        {order.status !== 'completed' && order.status !== 'disputed' && (
          <Button
            variant="destructive"
            onClick={() => setShowDisputeDialog(true)}
            className="w-full"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Report Problem
          </Button>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order Received?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            By confirming, you acknowledge that you have received the product in good condition. 
            The payment will be released to the seller.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReceived}>
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe the issue with your order. Our admin team will review and help resolve it.
            </p>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the problem..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReportProblem}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default OrderDetail;
