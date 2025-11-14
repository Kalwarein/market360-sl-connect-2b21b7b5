import { useEffect, useState } from 'react';
import { Search, Store, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  product_code: string;
}

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('published', true)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sidebar />
            <div>
              <h1 className="text-2xl font-bold">Market360</h1>
              <p className="text-sm opacity-90">Discover Sierra Leone's marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-white text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {products.length} products available
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-3">Featured Products</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No products found</p>
                <p className="text-sm mt-1">Check back later for new listings</p>
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
                        <Store className="h-12 w-12 text-muted-foreground" />
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

      <BottomNav />
    </div>
  );
};

export default Home;