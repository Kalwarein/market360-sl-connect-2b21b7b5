import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ProductCard } from '@/components/ProductCard';
import { PremiumSearchBar } from '@/components/PremiumSearchBar';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { QuickAccessGrid } from '@/components/QuickAccessGrid';
import { PromoBanner } from '@/components/PromoBanner';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  product_code: string;
  stores?: {
    store_name: string;
    owner_id: string;
  };
}

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(store_name, owner_id)')
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
        .select('*, stores(store_name, owner_id)')
        .eq('published', true)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] || '',
      store_name: product.stores?.store_name || 'Unknown Store',
      product_code: product.product_code,
    });

    toast({
      title: 'Added to cart',
      description: `${product.title} has been added to your cart`,
    });
  };

  const handleChat = async (product: Product) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to chat with seller',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!product.stores?.owner_id) return;

    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', product.stores.owner_id)
        .eq('product_id', product.id)
        .single();

      if (existing) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: user.id,
          seller_id: product.stores.owner_id,
          product_id: product.id,
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/chat/${newConvo.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Premium Header */}
      <div className="gradient-hero text-white p-6 pb-8 rounded-b-[2rem] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sidebar />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Market360</h1>
              <p className="text-sm opacity-90 font-medium">Sierra Leone's Premier Marketplace</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Premium Search Bar */}
        <PremiumSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search for products, categories..."
        />
      </div>

      {/* Quick Stats Card */}
      <div className="px-4 -mt-6">
        <Card className="card-premium shadow-floating">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Products</p>
                  <p className="text-2xl font-bold text-foreground">{products.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm font-semibold text-primary">Just now</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Banners */}
      <div className="px-4 mt-6">
        <PromoBanner />
      </div>

      {/* Quick Access Grid */}
      <div className="px-4 mt-6">
        <h2 className="text-xl font-bold mb-4">Quick Access</h2>
        <QuickAccessGrid />
      </div>

      {/* Products Section */}
      <div className="px-4 mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          {!loading && products.length > 0 && (
            <button 
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => navigate('/stores')}
            >
              View All
            </button>
          )}
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : products.length === 0 ? (
          <Card className="card-premium">
            <CardContent className="p-12 text-center">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Check back later for new listings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                image={product.images[0]}
                category={product.category}
                store_name={product.stores?.store_name}
                onAddToCart={() => handleAddToCart(product)}
                onChat={() => handleChat(product)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;