import { useEffect, useState } from 'react';
import { TrendingUp, Package, Eye, Star, MessageSquare, ShoppingBag, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { PromoBanner } from '@/components/PromoBanner';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PRODUCT_CATEGORIES } from '@/lib/productCategories';

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
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productCount, setProductCount] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const banners = [
    {
      title: 'Welcome to Market360',
      subtitle: 'Your Trusted Marketplace in Sierra Leone',
      gradient: 'from-primary/90 to-secondary/90',
    },
    {
      title: 'Shop with Confidence',
      subtitle: 'Secure payments & buyer protection',
      gradient: 'from-secondary/90 to-accent/90',
    },
    {
      title: 'Fast Delivery',
      subtitle: 'Get your products delivered quickly',
      gradient: 'from-accent/90 to-primary/90',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadProducts(),
      loadTrendingProducts(),
      loadRecentlyViewed(),
      loadTopSellers(),
      loadProductCount(),
    ]);
    setLoading(false);
  };

  const loadProductCount = async () => {
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error loading product count:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(store_name, owner_id)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadTrendingProducts = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: viewsData } = await supabase
        .from('product_views')
        .select('product_id')
        .gte('viewed_at', sevenDaysAgo.toISOString());

      if (viewsData && viewsData.length > 0) {
        const viewCounts = viewsData.reduce((acc: Record<string, number>, view) => {
          acc[view.product_id] = (acc[view.product_id] || 0) + 1;
          return acc;
        }, {});

        const topProductIds = Object.entries(viewCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 8)
          .map(([id]) => id);

        if (topProductIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('*, stores(store_name, owner_id)')
            .in('id', topProductIds)
            .eq('published', true);

          setTrendingProducts(products || []);
        }
      }
    } catch (error) {
      console.error('Error loading trending products:', error);
    }
  };

  const loadRecentlyViewed = async () => {
    if (!user) return;
    try {
      const { data: viewsData } = await supabase
        .from('product_views')
        .select('product_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(8);

      if (viewsData && viewsData.length > 0) {
        const productIds = [...new Set(viewsData.map((v) => v.product_id))];
        const { data: products } = await supabase
          .from('products')
          .select('*, stores(store_name, owner_id)')
          .in('id', productIds)
          .eq('published', true);

        setRecentlyViewedProducts(products || []);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const loadTopSellers = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('product_id')
        .eq('status', 'completed');

      if (orders && orders.length > 0) {
        const salesCount = orders.reduce((acc: Record<string, number>, order) => {
          acc[order.product_id] = (acc[order.product_id] || 0) + 1;
          return acc;
        }, {});

        const topIds = Object.entries(salesCount)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 8)
          .map(([id]) => id);

        if (topIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('*, stores(store_name, owner_id)')
            .in('id', topIds)
            .eq('published', true);

          setTopSellers(products || []);
        }
      }
    } catch (error) {
      console.error('Error loading top sellers:', error);
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

  const shopByCategories = PRODUCT_CATEGORIES.slice(0, 12);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary/95 to-secondary/95 backdrop-blur-lg shadow-md">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Sidebar />

            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Market360
            </h1>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <NotificationBell />
            </div>
          </div>

          {/* Search Bar */}
          <PremiumSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search products, categories..."
          />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Product Count Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-muted/20 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{productCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Available Products</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>

        {/* Homepage Carousel Banner */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg animate-fade-in">
          {banners.map((banner, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                index === currentBannerIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
            >
              <div className={`relative bg-gradient-to-r ${banner.gradient} p-8 rounded-2xl overflow-hidden`}>
                {/* Shimmer Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s infinite',
                  }}
                />
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">{banner.title}</h2>
                  <p className="text-white/90 text-sm">{banner.subtitle}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Indicator Dots */}
          <div className="flex justify-center gap-2 mt-3">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentBannerIndex ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Shop by Category */}
        <section className="animate-fade-in">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shopByCategories.map((category, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-background to-primary/5 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Category Filter Row */}
        <CategoryFilter />

        {/* Promo Banner */}
        <PromoBanner />

        {/* Featured Products */}
        <section className="animate-fade-in">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Featured Products
          </h2>
          {loading ? (
            <ProductGridSkeleton />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <ProductCard
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    image={product.images[0]}
                    category={product.category}
                    store_name={product.stores?.store_name}
                    onAddToCart={() => handleAddToCart(product)}
                    onChat={() => handleChat(product)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No products available
              </CardContent>
            </Card>
          )}
        </section>

        {/* Trending in Sierra Leone */}
        {trendingProducts.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trending in Sierra Leone
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trendingProducts.map((product) => (
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
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentlyViewedProducts.map((product) => (
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
          </section>
        )}

        {/* Top Sellers */}
        {topSellers.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Top Sellers
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {topSellers.map((product) => (
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
          </section>
        )}
      </div>

      <BottomNav />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Home;
