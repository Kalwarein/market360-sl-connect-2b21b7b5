import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PremiumSearchBar } from '@/components/PremiumSearchBar';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  stores: {
    store_name: string;
    owner_id: string;
  };
}

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'results'>(
    initialQuery ? 'results' : 'trending'
  );

  useEffect(() => {
    loadTrendingProducts();
    loadRecentSearches();
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const loadTrendingProducts = async () => {
    try {
      // Get products with most views in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: viewsData } = await supabase
        .from('product_views')
        .select('product_id')
        .gte('viewed_at', sevenDaysAgo.toISOString());

      if (viewsData) {
        // Count views per product
        const viewCounts = viewsData.reduce((acc: Record<string, number>, view) => {
          acc[view.product_id] = (acc[view.product_id] || 0) + 1;
          return acc;
        }, {});

        // Get top 20 product IDs
        const topProductIds = Object.entries(viewCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 20)
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

      // If no trending data, fallback to recent products
      if (!viewsData || viewsData.length === 0) {
        const { data: products } = await supabase
          .from('products')
          .select('*, stores(store_name, owner_id)')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        setTrendingProducts(products || []);
      }
    } catch (error) {
      console.error('Error loading trending products:', error);
    }
  };

  const loadRecentSearches = () => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  };

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const performSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      setActiveTab('trending');
      return;
    }

    setLoading(true);
    setActiveTab('results');
    
    try {
      saveRecentSearch(query);
      setSearchParams({ q: query });

      // Search in title, description, category, and tags
      const { data: products, error } = await supabase
        .from('products')
        .select('*, stores(store_name, owner_id)')
        .eq('published', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSearchResults(products || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-primary p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Search Products</h1>
        </div>

        <PremiumSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={() => performSearch()}
          placeholder="Search electronics, tools, fashion..."
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'trending' | 'results')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              Results ({searchResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Searches
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecentSearchClick(search)}
                      className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Products */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Now
              </h2>
              <p className="text-sm text-muted-foreground">
                Most viewed products this week
              </p>
              
              {trendingProducts.length === 0 ? (
                <ProductGridSkeleton count={6} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {trendingProducts.map((product) => (
                    <ProductCard 
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images[0]}
                      category="Trending"
                      store_name={product.stores?.store_name}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results">
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="text-5xl">🔍</div>
                <h3 className="text-xl font-semibold">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or browse trending products
                </p>
                <Button
                  onClick={() => setActiveTab('trending')}
                  className="mt-4"
                >
                  View Trending
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.length} products for "{searchQuery}"
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {searchResults.map((product) => (
                    <ProductCard 
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images[0]}
                      category="Search Result"
                      store_name={product.stores?.store_name}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Search;
