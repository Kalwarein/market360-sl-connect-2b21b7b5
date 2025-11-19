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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">My Orders</h1>
          {orders.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {orders.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="p-6 rounded-full bg-muted/50 mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-lg transition-all border-l-4"
                style={{
                  borderLeftColor: order.status === 'delivered' || order.status === 'completed' 
                    ? 'hsl(var(--primary))' 
                    : 'hsl(var(--muted))'
                }}
                onClick={() => navigate(`/order-detail/${order.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {order.products.images?.[0] ? (
                        <img
                          src={order.products.images[0]}
                          alt={order.products.title}
                          className="w-24 h-24 rounded-lg object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate mb-1">
                        {order.products.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {order.stores.store_name}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(order.status)} text-white`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Qty: {order.quantity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-primary">
                          Le {order.total_amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Orders;
