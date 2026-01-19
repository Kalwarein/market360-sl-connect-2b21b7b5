import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, CheckCircle2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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

interface OrderData {
  id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  delivery_name: string;
  delivery_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  updated_at: string;
  seller_id: string;
  products: {
    title: string;
    images: string[];
    price: number;
  };
}

const OrderArrival = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (orderId && user) {
      loadOrderDetails();
    }
  }, [orderId, user]);

  const loadOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (title, images, price)
        `)
        .eq('id', orderId)
        .eq('buyer_id', user?.id)
        .single();

      if (error) throw error;
      setOrder(data as OrderData);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!orderId || !user) return;

    setConfirming(true);
    try {
      // Call edge function to release escrow (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('release-escrow', {
        body: {
          order_id: orderId,
          buyer_id: user.id
        }
      });

      if (error) throw error;

      toast.success('Order confirmed! Thank you for shopping with Market360.');
      navigate('/orders');
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error('Failed to confirm order. Please try again.');
    } finally {
      setConfirming(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Order Delivery</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading order details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Order Delivered</h1>
            <p className="text-xs text-muted-foreground">Confirm receipt to complete</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Delivery Alert */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Order Delivered!</h3>
                <p className="text-sm text-muted-foreground">
                  Seller marked this order as delivered on {format(new Date(order.updated_at), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Awaiting Your Confirmation
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <img
                src={order.products.images[0]}
                alt={order.products.title}
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{order.products.title}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Quantity: {order.quantity}</p>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Le {order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Delivery Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Recipient</p>
                <p className="font-medium">{order.delivery_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{order.delivery_phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_region}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Delivered: {format(new Date(order.updated_at), 'MMMM dd, yyyy • h:mm a')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Instructions */}
        <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Important: Confirm Receipt
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Please check that the product matches your order</p>
              <p>• Verify the quantity and condition</p>
              <p>• Once confirmed, payment will be released to the seller</p>
              <p>• You cannot undo this action</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button 
            className="w-full h-12 text-lg font-semibold"
            size="lg"
            onClick={() => setShowConfirmDialog(true)}
            disabled={confirming || order.status === 'completed'}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {order.status === 'completed' ? 'Order Confirmed' : 'Confirm Order Received'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/order/${orderId}`)}
          >
            Report an Issue
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Receipt?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>By confirming, you acknowledge that:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>You have received the product</li>
                <li>The product matches your order</li>
                <li>Payment will be released to the seller</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReceived}
              disabled={confirming}
              className="bg-primary hover:bg-primary/90"
            >
              {confirming ? 'Confirming...' : 'Yes, Confirm Receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderArrival;
