import { useEffect, useState } from 'react';
import { Bell, ShoppingCart, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { PremiumSearchBar } from '@/components/PremiumSearchBar';
import { MarketplaceProductCard } from '@/components/MarketplaceProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
    loadUnreadCount();
    loadCartCount();
    loadNotificationCount();

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
      setAvailableCategories(['All', ...categories.sort()]);
    } catch (error) {
      console.error('Error loading categories:', error);
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
      let query = supabase
        .from('products')
        .select('*')
        .eq('published', true);

      if (activeTab === 'manufacturers') {
        query = query.eq('product_type', 'manufacturer');
      } else if (activeTab === 'worldwide') {
        query = query.eq('product_type', 'worldwide');
      }

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query
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
        let query = supabase
          .from('products')
          .select('*')
          .eq('published', true);

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
        setTopRanking(data || []);
        return;
      }

      let query = supabase
        .from('products')
        .select('*')
        .in('id', topProductIds)
        .eq('published', true);

      if (activeTab === 'manufacturers') {
        query = query.eq('product_type', 'manufacturer');
      } else if (activeTab === 'worldwide') {
        query = query.eq('product_type', 'worldwide');
      }

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTopRanking(data || []);
    } catch (error) {
      console.error('Error loading top ranking:', error);
    }
  };

  const loadNewArrivals = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('published', true);

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
      setNewArrivals(data || []);
    } catch (error) {
      console.error('Error loading new arrivals:', error);
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

  const renderProductSection = (title: string, products: Product[], viewAllPath: string) => (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <Button
          variant="link"
          className="text-primary hover:text-primary/80 p-0 h-auto"
          onClick={() => navigate(viewAllPath)}
        >
          View All →
        </Button>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-12 px-4">
          <p className="text-muted-foreground text-sm">
            {selectedCategory === 'All'
              ? 'No products available'
              : `No products found in "${selectedCategory}" category`}
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {products.map((product) => (
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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sidebar />
              <h1 className="text-xl font-bold text-primary">Market360</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => navigate('/notifications')}
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

      {/* Search Bar Section */}
      <div className="max-w-7xl mx-auto px-4 py-3">
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
      <div className="px-4 py-3 space-y-2">
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
                    : 'bg-card border-border hover:bg-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Sections */}
      <div className="space-y-6">
        {renderProductSection('Top Deals', topDeals, '/top-deals')}
        {renderProductSection('Top Ranking', topRanking, '/top-ranking')}
        {renderProductSection('New Arrivals', newArrivals, '/new-arrivals')}
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
