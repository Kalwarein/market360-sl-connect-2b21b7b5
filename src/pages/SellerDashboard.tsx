import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { Plus, Package, ShoppingBag, MessageSquare, Settings, DollarSign, TrendingUp, CheckCircle2, Store, Crown, ChevronRight } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SellerProductCard } from '@/components/SellerProductCard';
import { StoreUpgradePopup } from '@/components/StoreUpgradePopup';
import { StoreModerationScreen } from '@/components/StoreModerationScreen';

interface Store {
  id: string;
  store_name: string;
  logo_url?: string;
  banner_url?: string;
  status?: string;
  suspension_reason?: string;
  suspended_at?: string;
  suspension_expires_at?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  published: boolean;
  product_code: string;
  scheduled_deletion_at?: string | null;
  views_count?: number;
  saves_count?: number;
  orders_count?: number;
  created_at?: string;
  is_promoted?: boolean;
  promoted_until?: string | null;
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
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  useEffect(() => {
    if (!rolesLoading && !isSeller) {
      navigate('/become-seller');
      return;
    }

    if (user && isSeller) {
      loadDashboardData();
    }
  }, [user, isSeller, rolesLoading, navigate]);

  // Show upgrade popup on first visit (once per session)
  useEffect(() => {
    if (store && !loading) {
      const hasSeenPopup = sessionStorage.getItem(`seller_upgrade_popup_${store.id}`);
      if (!hasSeenPopup) {
        setShowUpgradePopup(true);
      }
    }
  }, [store, loading]);

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

  // Check if store is suspended or banned
  const isStoreSuspended = store?.status === 'suspended';
  const isStoreBanned = store?.status === 'banned';

  // Show moderation screen if store is suspended or banned
  if (store && (isStoreSuspended || isStoreBanned)) {
    return (
      <>
        <StoreModerationScreen store={store} />
        <BottomNav />
      </>
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
                <p className="text-2xl font-bold text-foreground">Le {totalRevenue.toLocaleString()}</p>
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
                  <SellerProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    image={product.images[0] || ''}
                    images={product.images}
                    productCode={product.product_code}
                    storeId={store?.id}
                    published={product.published}
                    scheduledDeletionAt={product.scheduled_deletion_at}
                    viewsCount={product.views_count || 0}
                    savesCount={product.saves_count || 0}
                    ordersCount={product.orders_count || 0}
                    createdAt={product.created_at}
                    onRefresh={loadDashboardData}
                  />
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
                            Le {order.total_amount.toLocaleString()}
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
                
                {/* Unlock Premium Button */}
                <div 
                  className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate('/perks')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Unlock Premium</p>
                        <p className="text-xs text-muted-foreground">Get verified badge & more</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />

      {/* Store Upgrade Popup */}
      <StoreUpgradePopup
        open={showUpgradePopup}
        onClose={() => {
          setShowUpgradePopup(false);
          if (store) {
            sessionStorage.setItem(`seller_upgrade_popup_${store.id}`, 'true');
          }
        }}
      />
    </div>
  );
};

export default SellerDashboard;
