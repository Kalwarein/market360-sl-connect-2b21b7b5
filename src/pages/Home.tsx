import { useEffect, useState } from 'react';
import { Bell, ShoppingCart, MessageSquare, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { PremiumSearchBar } from '@/components/PremiumSearchBar';
import { MarketplaceProductCard } from '@/components/MarketplaceProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  moq?: number;
}

const Home = () => {
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const [topRanking, setTopRanking] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    loadCategories();
    loadUnreadCount();
    loadCartCount();
  }, [user]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadTopDeals(),
      loadTopRanking(),
      loadNewArrivals(),
    ]);
    setLoading(false);
  };

  const loadTopDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('published', true)
        .order('price', { ascending: true })
        .limit(10);

      if (error) throw error;
      setTopDeals(data || []);
    } catch (error) {
      console.error('Error loading top deals:', error);
    }
  };

  const loadTopRanking = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: viewData, error: viewError } = await supabase
        .from('product_views')
        .select('product_id')
        .gte('viewed_at', sevenDaysAgo.toISOString());

      if (viewError) throw viewError;

      const viewCounts = viewData.reduce((acc: { [key: string]: number }, view) => {
        acc[view.product_id] = (acc[view.product_id] || 0) + 1;
        return acc;
      }, {});

      const topProductIds = Object.entries(viewCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTopRanking(data || []);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', topProductIds)
        .eq('published', true);

      if (error) throw error;
      setTopRanking(data || []);
    } catch (error) {
      console.error('Error loading top ranking:', error);
    }
  };

  const loadNewArrivals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNewArrivals(data || []);
    } catch (error) {
      console.error('Error loading new arrivals:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('published', true);

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data.map(p => p.category)));
      setCategories(['All', ...uniqueCategories.slice(0, 10)]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadCartCount = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setCartCount(count || 0);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1">
        {/* Slim Header */}
        <header className="sticky top-0 z-20 bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-primary">Market360</h1>
              </div>
              
              <div className="flex-1 max-w-2xl">
                <div className="relative flex items-center gap-2">
                  <div className="flex-1">
                    <PremiumSearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSearch={handleSearch}
                      placeholder="Search products, stores, or categories..."
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/search')}
                    className="rounded-full"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/notifications')}
                  className="rounded-full relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/cart')}
                  className="rounded-full relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/messages')}
                  className="rounded-full"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Global Tabs */}
        <div className="sticky top-[73px] z-10 bg-card border-b border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
            <TabsList className="w-full justify-start rounded-none bg-transparent border-0 h-12 px-4">
              <TabsTrigger
                value="products"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
              >
                Products
              </TabsTrigger>
              <TabsTrigger
                value="manufacturers"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
              >
                Manufacturers
              </TabsTrigger>
              <TabsTrigger
                value="worldwide"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
              >
                Worldwide
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        <main className="pb-20 md:pb-0">
          <Tabs value={activeTab} className="max-w-7xl mx-auto">
            <TabsContent value="products" className="mt-0">
              {/* Categories Row */}
              <div className="border-b border-border bg-card">
                <ScrollArea className="w-full">
                  <div className="flex gap-4 px-4 py-3">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="whitespace-nowrap"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              <div className="space-y-8 p-4">
                {/* Top Deals Section */}
                {topDeals.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Top Deals</h2>
                        <p className="text-sm text-muted-foreground">Score the lowest prices on Market360</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/top-deals')}
                        className="gap-2"
                      >
                        View All
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {topDeals.map((product) => (
                          <MarketplaceProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            price={product.price}
                            image={product.images[0]}
                            moq={product.moq || 1}
                            tag="Top"
                          />
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </section>
                )}

                {/* Top Ranking Section */}
                {topRanking.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Top Ranking</h2>
                        <p className="text-sm text-muted-foreground">Navigate trends with data-driven rankings</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/top-ranking')}
                        className="gap-2"
                      >
                        View All
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {topRanking.map((product) => (
                          <MarketplaceProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            price={product.price}
                            image={product.images[0]}
                            moq={product.moq || 1}
                            tag="Hot Selling"
                          />
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </section>
                )}

                {/* New Arrivals Section */}
                {newArrivals.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">New Arrivals</h2>
                        <p className="text-sm text-muted-foreground">Stay ahead with the latest offerings</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/new-arrivals')}
                        className="gap-2"
                      >
                        View All
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {newArrivals.map((product) => (
                          <MarketplaceProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            price={product.price}
                            image={product.images[0]}
                            moq={product.moq || 1}
                            tag="New"
                          />
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </section>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manufacturers" className="mt-0 p-4">
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-foreground mb-2">Manufacturers</h2>
                <p className="text-muted-foreground">Coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="worldwide" className="mt-0 p-4">
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-foreground mb-2">Worldwide / Sierra Leone Regions</h2>
                <p className="text-muted-foreground">Coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
