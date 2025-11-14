import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, MapPin, Package } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';

interface StoreData {
  id: string;
  store_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  city?: string;
  region?: string;
  _count?: {
    products: number;
  };
}

const Stores = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count products for each store
      const storesWithCounts = await Promise.all(
        (data || []).map(async (store) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('published', true);

          return { ...store, productCount: count || 0 };
        })
      );

      setStores(storesWithCounts);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = searchQuery
    ? stores.filter((store) =>
        store.store_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stores;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Store className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Stores</h1>
            <p className="text-sm opacity-90">Explore verified sellers</p>
          </div>
        </div>
        <Input
          placeholder="Search stores..."
          className="bg-white text-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No stores found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStores.map((store: any) => (
              <Card
                key={store.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => navigate(`/store/${store.id}`)}
              >
                <div className="h-32 relative">
                  {store.banner_url ? (
                    <img
                      src={store.banner_url}
                      alt={store.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 rounded-lg border bg-card flex-shrink-0 overflow-hidden -mt-8 relative z-10">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.store_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg line-clamp-1">
                        {store.store_name}
                      </h3>
                      {(store.city || store.region) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {[store.city, store.region].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Package className="h-3 w-3 mr-1" />
                          {store.productCount} Products
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {store.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {store.description}
                    </p>
                  )}
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

export default Stores;