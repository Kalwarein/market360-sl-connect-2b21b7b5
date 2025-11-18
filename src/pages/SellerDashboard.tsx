import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { Plus, Package, ShoppingBag, MessageSquare, Settings, DollarSign, TrendingUp, CheckCircle2, Store } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
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
  const { hasPendingOrders, pendingCount } = useSellerNotifications();
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
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      setStore(storeData);

      if (storeData) {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        setProducts(productsData || []);

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
        <div className="p-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20">
      <div className="bg-card border-b border-border/50 backdrop-blur-lg">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {store?.logo_url ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-primary/20">
                <img src={store.logo_url} alt="Store" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{store?.store_name || 'My Store'}</h1>
              <p className="text-sm text-muted-foreground">Seller Dashboard</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/store-settings')}
              className="rounded-xl hover:bg-muted/50"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  {pendingCount > 0 && (
                    <Badge className="h-5 px-2 rounded-full bg-destructive text-white text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">SLL {totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-muted/30 rounded-2xl p-1 h-auto">
            <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm relative">
              Orders
              {pendingCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-destructive text-white text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Messages
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Your Products</h2>
              <Button
                onClick={() => navigate('/add-product')}
                className="rounded-xl bg-primary hover:bg-primary-hover shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.length === 0 ? (
                <Card className="col-span-full rounded-2xl shadow-sm border-border/50">
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products yet</p>
                    <Button
                      onClick={() => navigate('/add-product')}
                      className="mt-4 rounded-xl"
                    >
                      Add Your First Product
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                products.map((product) => (
                  <Card
                    key={product.id}
                    className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          {product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {product.product_code}</p>
                          <p className="text-lg font-bold text-primary mt-1">SLL {product.price.toLocaleString()}</p>
                          <Badge
                            variant={product.published ? 'default' : 'secondary'}
                            className="mt-2 rounded-full"
                          >
                            {product.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Incoming Orders</h2>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <Card className="rounded-2xl shadow-sm border-border/50">
                  <CardContent className="p-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card
                    key={order.id}
                    className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/seller/order/${order.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{order.products?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {order.quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            SLL {order.total_amount.toLocaleString()}
                          </p>
                          <Badge
                            variant={order.status === 'pending' ? 'destructive' : 'default'}
                            className="mt-2 rounded-full"
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <Card className="rounded-2xl shadow-sm border-border/50">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Message buyers directly</p>
                <Button
                  onClick={() => navigate('/messages')}
                  className="rounded-xl"
                >
                  Open Messages
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="rounded-2xl shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Store Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Store Name</p>
                  <p className="text-muted-foreground">{store?.store_name}</p>
                </div>
                <Button
                  onClick={() => navigate('/store-settings')}
                  variant="outline"
                  className="w-full rounded-xl border-border/50"
                >
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
