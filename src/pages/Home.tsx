import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, ShoppingCart, MessageSquare, Search, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCache } from '@/contexts/CacheContext';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { PremiumSearchBar } from '@/components/PremiumSearchBar';
import { MarketplaceProductCard } from '@/components/MarketplaceProductCard';
import { StoreCard } from '@/components/StoreCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuidedTour } from '@/components/GuidedTour';
import OnboardingPrompt from '@/components/OnboardingPrompt';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  moq?: number;
}

interface Store {
  id: string;
  store_name: string;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  region: string | null;
  productCount?: number;
}

interface CategorySection {
  category: string;
  products: Product[];
}

const Home = () => {
  const { 
    getCache, 
    setCache, 
    hasInitiallyLoaded, 
    markInitiallyLoaded 
  } = useCache();
  
  // Use scroll restoration
  useScrollRestoration();
  
  // Initialize state from cache immediately
  const [categorySections, setCategorySections] = useState<CategorySection[]>(() => 
    getCache<CategorySection[]>('home_categorySections') || []
  );
  const [featuredStores, setFeaturedStores] = useState<Store[]>(() => 
    getCache<Store[]>('home_featuredStores') || []
  );
  const [topDeals, setTopDeals] = useState<Product[]>(() => 
    getCache<Product[]>('home_topDeals') || []
  );
  const [topRanking, setTopRanking] = useState<Product[]>(() => 
    getCache<Product[]>('home_topRanking') || []
  );
  const [newArrivals, setNewArrivals] = useState<Product[]>(() => 
    getCache<Product[]>('home_newArrivals') || []
  );
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => 
    getCache<string[]>('home_categories') || ['All']
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categorySearch, setCategorySearch] = useState('');
  
  // Only show loading if we have NO cached data at all
  const hasCachedData = hasInitiallyLoaded('home_data');
  const [loading, setLoading] = useState(!hasCachedData);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showCustomerCareTooltip, setShowCustomerCareTooltip] = useState(false);
  const isRefreshing = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
    loadUnreadCount();
    loadCartCount();
    loadNotificationCount();

    // Check if user has seen customer care tooltip
    const hasSeenTooltip = localStorage.getItem('customer_care_tooltip_seen');
    if (!hasSeenTooltip) {
      setTimeout(() => setShowCustomerCareTooltip(true), 2000);
    }

    // Real-time subscriptions
    if (!user) return;

    const messagesChannel = supabase
      .channel('messages-count-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadUnreadCount)
      .subscribe();

    const cartChannel = supabase
      .channel('cart-count-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, loadCartCount)
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-count-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadNotificationCount)
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(cartChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user]);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('published', true);

      if (error) throw error;

      const categories = Array.from(new Set(data?.map(p => p.category).filter(Boolean))) as string[];
      const result = ['All', ...categories.sort()];
      setAvailableCategories(result);
      setCache('home_categories', result);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadData = async () => {
    // Only show loading spinner if we haven't loaded before AND have no cache
    if (!hasCachedData && !isRefreshing.current) {
      setLoading(true);
    }
    isRefreshing.current = true;
    
    await Promise.all([
      loadTopDeals(),
      loadTopRanking(),
      loadNewArrivals(),
      loadCategorySections(),
      loadFeaturedStores(),
    ]);
    
    setLoading(false);
    markInitiallyLoaded('home_data');
    isRefreshing.current = false;
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
      const result = data || [];
      setTopDeals(result);
      setCache('home_topDeals', result);
    } catch (error) {
      console.error('Error loading top deals:', error);
    }
  };

  const loadTopRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const result = data || [];
      setTopRanking(result);
      setCache('home_topRanking', result);
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
      const result = data || [];
      setNewArrivals(result);
      setCache('home_newArrivals', result);
    } catch (error) {
      console.error('Error loading new arrivals:', error);
    }
  };

  const loadCategorySections = async () => {
    try {
      // Get top 8 categories with most products
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('category')
        .eq('published', true);

      if (error) throw error;

      const categoryCounts = allProducts.reduce((acc: { [key: string]: number }, product) => {
        if (product.category) {
          acc[product.category] = (acc[product.category] || 0) + 1;
        }
        return acc;
      }, {});

      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 8)
        .map(([cat]) => cat);

      // Load products for each category
      const sections = await Promise.all(
        topCategories.map(async (category) => {
          let query = supabase
            .from('products')
            .select('*')
            .eq('published', true)
            .eq('category', category);

          if (activeTab === 'manufacturers') {
            query = query.eq('product_type', 'manufacturer');
          } else if (activeTab === 'worldwide') {
            query = query.eq('product_type', 'worldwide');
          }

          if (selectedCategory !== 'All') {
            query = query.eq('category', selectedCategory);
          }

          const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          return {
            category,
            products: data || [],
          };
        })
      );

      const result = sections.filter(s => s.products.length > 0);
      setCategorySections(result);
      setCache('home_categorySections', result);
    } catch (error) {
      console.error('Error loading category sections:', error);
    }
  };

  const loadFeaturedStores = async () => {
    try {
      // Get stores with active featured_spotlight perk
      const { data: perks, error: perksError } = await supabase
        .from('store_perks')
        .select('store_id')
        .eq('is_active', true)
        .eq('perk_type', 'featured_spotlight')
        .gte('expires_at', new Date().toISOString());

      if (perksError) throw perksError;

      if (!perks || perks.length === 0) {
        setFeaturedStores([]);
        return;
      }

      const storeIds = perks.map(p => p.store_id);

      // Get store details
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .in('id', storeIds);

      if (storesError) throw storesError;

      // Get product counts for each store
      const storesWithCounts = await Promise.all(
        (stores || []).map(async (store) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('published', true);

          return {
            ...store,
            productCount: count || 0,
          };
        })
      );

      setFeaturedStores(storesWithCounts);
      setCache('home_featuredStores', storesWithCounts);
    } catch (error) {
      console.error('Error loading featured stores:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (!conversations) return;

      const conversationIds = conversations.map((c) => c.id);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
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

  const loadNotificationCount = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const filteredCategories = availableCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const renderCategorySection = (section: CategorySection, index: number) => {
    const isEven = index % 2 === 0;
    
    return (
      <div key={section.category} className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-foreground">{section.category}</h2>
          <Button
            variant="link"
            className="text-primary hover:text-primary/80 p-0 h-auto text-sm"
            onClick={() => navigate(`/search?q=${encodeURIComponent(section.category)}`)}
          >
            View All →
          </Button>
        </div>
        
        {isEven ? (
          // Horizontal scrollable layout
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {section.products.map((product, idx) => (
              <div key={product.id} data-tour={index === 0 && idx === 0 ? 'product-card' : undefined}>
                <MarketplaceProductCard
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  image={product.images?.[0] || '/placeholder.svg'}
                  moq={product.moq || 1}
                />
              </div>
            ))}
          </div>
        ) : (
          // Grid layout
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {section.products.slice(0, 6).map((product) => (
              <MarketplaceProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                image={product.images?.[0] || '/placeholder.svg'}
                moq={product.moq || 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFeaturedStores = () => {
    if (featuredStores.length === 0) return null;

    return (
      <div className="px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-foreground">✨ Featured Premium Stores</h2>
          <Button
            variant="link"
            className="text-primary hover:text-primary/80 p-0 h-auto text-sm"
            onClick={() => navigate('/stores')}
          >
            View All →
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featuredStores.map((store) => (
            <StoreCard
              key={store.id}
              id={store.id}
              name={store.store_name}
              logo={store.logo_url || undefined}
              banner={store.banner_url || undefined}
              city={store.city || undefined}
              region={store.region || undefined}
              productCount={store.productCount}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-20">
      <GuidedTour />
      <OnboardingPrompt />
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div data-tour="sidebar-trigger">
                <Sidebar />
              </div>
              <h1 className="text-xl font-bold text-primary">Market360</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" data-tour="customer-care">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-primary/10"
                  onClick={() => {
                    navigate('/report-issue');
                    if (showCustomerCareTooltip) {
                      setShowCustomerCareTooltip(false);
                      localStorage.setItem('customer_care_tooltip_seen', 'true');
                    }
                  }}
                  title="Customer Care - Report an Issue"
                >
                  <Headset className="h-5 w-5 text-primary" />
                </Button>
                
                {showCustomerCareTooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative bg-primary text-primary-foreground rounded-2xl shadow-2xl p-4 w-64 border-2 border-primary/20">
                      <button
                        onClick={() => {
                          setShowCustomerCareTooltip(false);
                          localStorage.setItem('customer_care_tooltip_seen', 'true');
                        }}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold hover:bg-destructive/90 transition-colors shadow-lg"
                      >
                        ×
                      </button>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 border-t-2 border-l-2 border-primary/20"></div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <Headset className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm mb-1">Customer Care</h3>
                          <p className="text-xs opacity-90 leading-relaxed">
                            Report fraud, suspicious activity, or any issues you experience. Our team will respond quickly to ensure your safety.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => navigate('/notifications')}
                data-tour="notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notificationCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => navigate('/cart')}
                data-tour="cart"
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
                className="relative rounded-full"
                onClick={() => navigate('/messages')}
                data-tour="messages"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content with top padding to account for fixed header */}
      <div className="pt-16">
      {/* Search Bar Section */}
      <div className="max-w-7xl mx-auto px-4 py-3" data-tour="search-bar">
        <PremiumSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search products, stores..."
        />
      </div>

      {/* Global Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="manufacturers">Manufacturers</TabsTrigger>
            <TabsTrigger value="worldwide">Worldwide</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Categories Row with Search */}
      <div className="px-4 py-3 space-y-2" data-tour="categories">
        <div className="flex gap-2 items-center">
          <div className="relative flex-shrink-0 w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-9 h-9 rounded-full text-sm bg-card border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {filteredCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCategorySearch('');
                }}
                className={`flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {/* Top Deals Section */}
            {topDeals.length > 0 && (
              <div className="px-4 py-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-foreground">🔥 Top Deals</h2>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto text-sm"
                    onClick={() => navigate('/top-deals')}
                  >
                    View All →
                  </Button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {topDeals.map((product) => (
                    <MarketplaceProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images?.[0] || '/placeholder.svg'}
                      moq={product.moq || 1}
                      tag="Top"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Top Ranking Section */}
            {topRanking.length > 0 && (
              <div className="px-4 py-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-foreground">⭐ Top Ranking</h2>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto text-sm"
                    onClick={() => navigate('/top-ranking')}
                  >
                    View All →
                  </Button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {topRanking.map((product) => (
                    <MarketplaceProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images?.[0] || '/placeholder.svg'}
                      moq={product.moq || 1}
                      tag="Hot Selling"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* New Arrivals Section */}
            {newArrivals.length > 0 && (
              <div className="px-4 py-3">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-foreground">✨ New Arrivals</h2>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto text-sm"
                    onClick={() => navigate('/new-arrivals')}
                  >
                    View All →
                  </Button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {newArrivals.map((product) => (
                    <MarketplaceProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images?.[0] || '/placeholder.svg'}
                      moq={product.moq || 1}
                      tag="New"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Featured Stores */}
            {renderFeaturedStores()}

            {/* Category Sections */}
            {categorySections.map((section, index) => (
              <div key={section.category}>
                {renderCategorySection(section, index)}
                
                {/* Insert featured stores after 2nd category */}
                {index === 1 && featuredStores.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-2xl p-6 text-center border border-amber-200/50">
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        🌟 Discover Premium Sellers
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Shop from verified featured stores with exclusive perks
                      </p>
                      <Button
                        onClick={() => navigate('/stores')}
                        className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      >
                        Browse All Stores
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categorySections.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-muted-foreground">No products available</p>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      <BottomNav />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Home;
