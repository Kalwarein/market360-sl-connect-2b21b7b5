import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminStorePanel } from '@/components/AdminStorePanel';
import { 
  ArrowLeft, Store, Package, User, Calendar, 
  MapPin, Eye, ShoppingBag, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface StoreData {
  id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner_id: string;
  city: string | null;
  region: string | null;
  country: string | null;
  created_at: string;
  status?: string;
  suspended_at?: string;
  suspension_reason?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  status?: string;
  published: boolean;
  created_at: string;
}

interface OwnerProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

const AdminStoreDetail = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      // Load store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Load owner
      if (storeData?.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .eq('id', storeData.owner_id)
          .single();

        setOwner(ownerData);
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Calculate stats
      const activeCount = (productsData || []).filter(p => p.published && (!p.status || p.status === 'active')).length;

      // Get orders for this store
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('seller_id', storeData?.owner_id);

      const completedOrders = (ordersData || []).filter(o => 
        o.status === 'completed' || o.status === 'delivered'
      );
      const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

      setStats({
        totalProducts: productsData?.length || 0,
        activeProducts: activeCount,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: 'SLE',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Store not found</p>
            <Button className="mt-4" onClick={() => navigate('/admin/stores')}>
              Back to Stores
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin/stores')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stores
        </Button>
        <div className="flex items-center gap-4">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.store_name}
              className="h-16 w-16 rounded-xl object-cover border-2 border-white"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Store className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{store.store_name}</h1>
            {store.city && (
              <p className="text-sm opacity-90 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {store.city}, {store.region}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Admin Panel */}
        <AdminStorePanel store={store} onStatusChange={loadStoreData} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-xs">Products</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-green-600">{stats.activeProducts} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs">Orders</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalRevenue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Store Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{owner?.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{owner?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{owner?.phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{format(new Date(store.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate(`/admin/users/${owner?.id}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatAmount(product.price)}
                    </p>
                  </div>
                  <Badge variant={product.published && product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status || (product.published ? 'active' : 'draft')}
                  </Badge>
                </div>
              ))}
              {products.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  And {products.length - 10} more products...
                </p>
              )}
              {products.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No products yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStoreDetail;
