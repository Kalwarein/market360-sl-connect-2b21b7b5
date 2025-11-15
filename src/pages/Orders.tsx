import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { format } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  quantity: number;
  products: {
    title: string;
    images: string[];
  };
  stores: {
    store_name: string;
  };
}

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch related data
      const ordersWithRelations = await Promise.all(
        (data || []).map(async (order) => {
          const { data: product } = await supabase
            .from('products')
            .select('title, images, store_id')
            .eq('id', order.product_id)
            .single();
          
          let storeName = '';
          if (product?.store_id) {
            const { data: store } = await supabase
              .from('stores')
              .select('store_name')
              .eq('id', product.store_id)
              .single();
            storeName = store?.store_name || '';
          }
          
          return {
            ...order,
            products: product || { title: '', images: [] },
            stores: { store_name: storeName },
          };
        })
      );
      
      setOrders(ordersWithRelations as any);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
      case 'packed':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'disputed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
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
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-sm opacity-90">{orders.length} total orders</p>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Button onClick={() => navigate('/')}>Start Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={order.products.images[0]}
                    alt={order.products.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.products.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.stores?.store_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {order.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        <span className="mr-1">{getStatusIcon(order.status)}</span>
                        {order.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      Le {order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;
