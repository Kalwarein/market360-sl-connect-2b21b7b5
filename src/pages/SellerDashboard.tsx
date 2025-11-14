import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { Plus, Package, ShoppingBag, MessageSquare, Settings, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Store {
  id: string;
  store_name: string;
  logo_url?: string;
  banner_url?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  published: boolean;
  product_code: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  quantity: number;
  product_id: string;
  products: {
    title: string;
  };
}

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSeller, loading: rolesLoading } = useUserRoles();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rolesLoading && !isSeller) {
      navigate('/become-seller');
      return;
    }

    if (user && isSeller) {
      loadDashboardData();
    }
  }, [user, isSeller, rolesLoading, navigate]);

  const loadDashboardData = async () => {
    try {
      // Load store
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      setStore(storeData);

      if (storeData) {
        // Load products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        setProducts(productsData || []);

        // Load orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, products(title)')
          .eq('seller_id', user?.id)
          .order('created_at', { ascending: false });

        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <h1 className="text-2xl font-bold">{store?.store_name || 'My Store'}</h1>
        <p className="text-sm opacity-90">Seller Dashboard</p>
      </div>

      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <Package className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <ShoppingBag className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <DollarSign className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">Le {totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CheckCircle2 className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Button 
              onClick={() => navigate('/add-product')} 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>

            {products.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No products yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start adding products to your store
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <CardContent className="p-4 flex gap-4">
                      <img
                        src={product.images[0] || '/placeholder.svg'}
                        alt={product.title}
                        className="h-20 w-20 rounded object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium line-clamp-1">{product.title}</h3>
                            <p className="text-sm text-muted-foreground">{product.product_code}</p>
                          </div>
                          <Badge variant={product.published ? "default" : "secondary"}>
                            {product.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-lg font-bold text-primary mt-1">
                          Le {Number(product.price).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-3">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{order.products?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Qty: {order.quantity}
                        </p>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-primary">
                        Le {Number(order.total_amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Messages coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Store Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Store Name</label>
                  <p className="text-muted-foreground">{store?.store_name}</p>
                </div>
                <Button variant="outline" className="w-full">
                  Edit Store Details
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default SellerDashboard;
