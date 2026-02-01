import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, MapPin, Phone, User, MessageSquare, CheckCircle2, AlertCircle, Clock, Truck, XCircle, Shield, Store } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import DeliveryQRCode from '@/components/DeliveryQRCode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

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
  products: { id: string; title: string; images: string[]; product_code: string; price: number; };
  stores: { store_name: string; logo_url: string; };
  seller_id: string;
}

const OrderDetail = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    if (orderId && user) loadOrderDetail();
  }, [orderId, user]);

  const loadOrderDetail = async () => {
    try {
      const { data, error } = await supabase.from('orders').select(`*, products:product_id (id, title, images, product_code, price, store_id)`).eq('id', orderId).eq('buyer_id', user?.id).single();
      if (error) throw error;
      if (data && data.products) {
        const { data: store } = await supabase.from('stores').select('store_name, logo_url').eq('id', data.products.store_id).single();
        setOrder({ ...data, stores: store || { store_name: '', logo_url: '' } } as any);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({ title: 'Error', description: 'Failed to load order details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending') return;
    try {
      setShowCancelDialog(false);
      const { error } = await supabase.functions.invoke('process-order-refund', { body: { order_id: order.id, refund_type: 'buyer_cancel', initiator_id: user?.id } });
      if (error) throw error;
      toast({ title: '✅ Order Cancelled', description: 'Your refund has been processed to your wallet', duration: 5000 });
      loadOrderDetail();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
    }
  };

  const handleReportProblem = async () => {
    if (!disputeReason.trim()) return;
    try {
      setShowDisputeDialog(false);
      const { error } = await supabase.functions.invoke('process-order-refund', { body: { order_id: orderId, refund_type: 'dispute', reason: disputeReason, initiator_id: user?.id } });
      if (error) throw error;
      toast({ title: '⚠️ Dispute Filed', description: 'Refund processed. Admin will review.', duration: 5000 });
      setDisputeReason('');
      loadOrderDetail();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to file dispute', variant: 'destructive' });
    }
  };

  const handleChatWithSeller = async () => {
    if (!order) return;
    try {
      let { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user?.id)
        .eq('seller_id', order.seller_id)
        .eq('product_id', order.products.id)
        .maybeSingle();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            buyer_id: user?.id,
            seller_id: order.seller_id,
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
        return 'bg-amber-500';
      case 'processing':
      case 'packed':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
      case 'completed':
        return 'bg-emerald-500';
      case 'disputed':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground';
    }
  };

  if (loading) return <div className="min-h-screen bg-background pb-20"><div className="p-4 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div><BottomNav /></div>;
  if (!order) return <div className="min-h-screen bg-background pb-20 flex items-center justify-center"><div className="text-center"><XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h2 className="text-xl font-semibold mb-2">Order Not Found</h2><Button onClick={() => navigate('/orders')}>Back to Orders</Button></div><BottomNav /></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-lg font-semibold">Order Details</h1><p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p></div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Order Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full text-white ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg capitalize">{order.status}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <Badge variant="outline" className="capitalize flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {order.escrow_status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Order ID: <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section - Only for shipped/delivered orders with holding escrow */}
        {['shipped', 'delivered'].includes(order.status) && order.escrow_status === 'holding' && user && (
          <DeliveryQRCode 
            orderId={order.id}
            buyerId={user.id}
            orderStatus={order.status}
            escrowStatus={order.escrow_status}
          />
        )}

        {/* Completed Order Message */}
        {order.status === 'completed' && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">Order Completed</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">Thank you for your purchase!</p>
            </CardContent>
          </Card>
        )}

        {/* Product Information */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Details
            </h3>
            <div className="flex gap-4">
              <img 
                src={order.products.images[0]} 
                alt={order.products.title}
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <p className="font-semibold mb-1">{order.products.title}</p>
                <p className="text-sm text-muted-foreground mb-1">Code: {order.products.product_code}</p>
                <p className="text-sm font-semibold text-primary">Le {order.products.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Information */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store Details
            </h3>
            <div className="flex items-center gap-3">
              {order.stores.logo_url && (
                <img 
                  src={order.stores.logo_url} 
                  alt={order.stores.store_name}
                  className="w-12 h-12 rounded-full object-cover border"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{order.stores.store_name}</p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-primary"
                  onClick={handleChatWithSeller}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat with Seller
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-medium">{order.delivery_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.delivery_phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{order.shipping_address}</p>
                  <p className="text-sm text-muted-foreground">{order.shipping_city}, {order.shipping_region}</p>
                  <p className="text-sm text-muted-foreground">{order.shipping_country}</p>
                </div>
              </div>
              {order.delivery_notes && (
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Delivery Notes</p>
                    <p className="font-medium text-sm">{order.delivery_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({order.quantity} item{order.quantity > 1 ? 's' : ''})</span>
                <span className="font-medium">Le {(order.products.price * order.quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-lg text-primary">Le {order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                  {order.escrow_status === 'holding' ? 'Payment secured in escrow. Let the seller scan your QR code upon delivery.' : 
                   order.escrow_status === 'released' ? 'Payment released to seller' : 
                   'Payment processed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          {order.status === 'pending' && (
            <Button 
              onClick={() => setShowCancelDialog(true)} 
              variant="destructive" 
              className="w-full" 
              size="lg"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancel Order
            </Button>
          )}
          {!['cancelled', 'completed', 'disputed'].includes(order.status) && (
            <Button 
              onClick={() => setShowDisputeDialog(true)} 
              variant="outline" 
              className="w-full" 
              size="lg"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Report Problem
            </Button>
          )}
          <Button 
            onClick={handleChatWithSeller}
            variant="outline" 
            className="w-full" 
            size="lg"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Chat with Seller
          </Button>
        </div>
      </div>
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}><DialogContent><DialogHeader><DialogTitle>Report Problem</DialogTitle></DialogHeader><Textarea placeholder="Describe the issue..." value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={5} /><DialogFooter><Button variant="outline" onClick={() => setShowDisputeDialog(false)}>Cancel</Button><Button onClick={handleReportProblem} variant="destructive">Submit</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}><DialogContent><DialogHeader><DialogTitle>Cancel Order?</DialogTitle></DialogHeader><p className="text-sm">Payment will be refunded to your wallet.</p><DialogFooter><Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep</Button><Button onClick={handleCancelOrder} variant="destructive">Cancel Order</Button></DialogFooter></DialogContent></Dialog>
      <BottomNav />
    </div>
  );
};

export default OrderDetail;
