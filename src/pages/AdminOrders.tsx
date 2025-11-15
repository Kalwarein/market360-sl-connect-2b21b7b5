import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, ShoppingBag, Clock, Package as PackageIcon, Truck, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  buyer_profile: {
    name: string;
    email: string;
  };
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch related data
      const ordersWithRelations = await Promise.all(
        (data || []).map(async (order) => {
          const [productRes, profileRes] = await Promise.all([
            supabase.from('products').select('title, images, store_id').eq('id', order.product_id).single(),
            supabase.from('profiles').select('name, email').eq('id', order.buyer_id).single(),
          ]);
          
          let storeName = '';
          if (productRes.data?.store_id) {
            const storeRes = await supabase.from('stores').select('store_name').eq('id', productRes.data.store_id).single();
            storeName = storeRes.data?.store_name || '';
          }
          
          return {
            ...order,
            products: productRes.data,
            stores: { store_name: storeName },
            buyer_profile: profileRes.data,
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

  const filteredOrders = orders.filter(
    (order) =>
      order.products?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_profile?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
      case 'packed':
        return <PackageIcon className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <PackageIcon className="h-4 w-4" />;
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
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <p className="text-sm opacity-90">{orders.length} total orders</p>
      </div>

      <div className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={order.products?.images[0]}
                    alt={order.products?.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.products?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Store: {order.stores?.store_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Buyer: {order.buyer_profile?.email}
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
                    <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
