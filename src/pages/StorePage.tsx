import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, MessageCircle, Star, Package } from 'lucide-react';

interface Store {
  id: string;
  store_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  city?: string;
  region?: string;
  country?: string;
  owner_id: string;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  product_code: string;
}

const StorePage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      // Load store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Load store products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Store not found</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Banner */}
      <div className="relative h-48">
        {store.banner_url ? (
          <img
            src={store.banner_url}
            alt={store.store_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-white bg-black/20 hover:bg-black/40"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Store Info */}
      <div className="px-4 -mt-16 relative z-10">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="h-24 w-24 rounded-lg bg-card border overflow-hidden flex-shrink-0">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-1">{store.store_name}</h1>
                {(store.city || store.region) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[store.city, store.region, store.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    4.8
                  </Badge>
                  <Badge variant="outline">{products.length} Products</Badge>
                </div>
                {store.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {store.description}
                  </p>
                )}
              </div>
            </div>
            <Button className="w-full mt-4" size="lg">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <div className="p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Store Products</h2>
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No products available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square bg-muted relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-primary text-xs">
                    {product.category}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {product.product_code}
                  </p>
                  <p className="text-primary font-bold">
                    Le {product.price.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePage;