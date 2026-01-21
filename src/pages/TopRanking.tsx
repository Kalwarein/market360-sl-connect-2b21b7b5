import { useEffect, useState } from 'react';
import { ArrowLeft, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MarketplaceProductCard } from '@/components/MarketplaceProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  moq?: number;
  view_count?: number;
  category?: string;
  created_at?: string;
  store_id?: string;
  avgRating?: number;
  latestRating?: number;
}

type SortType = 'all' | 'hot_selling' | 'most_popular' | 'best_reviewed';

const TopRanking = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    loadTopRanking();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [selectedCategory, sortType, products]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('published', true);

      if (error) throw error;

      const uniqueCategories = Array.from(
        new Set(data?.map((p) => p.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTopRanking = async () => {
    try {
      // Get all products
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('published', true);

      if (error) throw error;

      if (!products || products.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      // Get all reviews for these products
      const { data: reviews } = await supabase
        .from('product_reviews')
        .select('product_id, rating, created_at')
        .in('product_id', productIds);

      // Calculate average rating and latest rating for each product
      const productStats: { [key: string]: { total: number; count: number; latest: { rating: number; date: string } | null } } = {};
      (reviews || []).forEach(review => {
        if (!productStats[review.product_id]) {
          productStats[review.product_id] = { total: 0, count: 0, latest: null };
        }
        productStats[review.product_id].total += review.rating;
        productStats[review.product_id].count += 1;
        
        // Track latest review
        if (!productStats[review.product_id].latest || 
            new Date(review.created_at) > new Date(productStats[review.product_id].latest!.date)) {
          productStats[review.product_id].latest = { rating: review.rating, date: review.created_at };
        }
      });

      // Sort by average rating (top reviews hierarchy)
      const result = products
        .map(p => ({
          ...p,
          avgRating: productStats[p.id] ? productStats[p.id].total / productStats[p.id].count : 0,
          latestRating: productStats[p.id]?.latest?.rating || 0
        }))
        .sort((a, b) => b.avgRating - a.avgRating);

      setProducts(result);
    } catch (error) {
      console.error('Error loading top ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    switch (sortType) {
      case 'hot_selling':
        filtered = filtered.filter((p) => (p.avgRating || 0) >= 4);
        break;
      case 'most_popular':
        filtered.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'best_reviewed':
        filtered.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
    }

    setFilteredProducts(filtered);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Top Ranking</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/search')}
              className="rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-card rounded-full border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'hot_selling', 'most_popular', 'best_reviewed'] as SortType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSortType(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  sortType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-accent'
                }`}
              >
                {type === 'all' ? 'All' : type === 'hot_selling' ? 'Hot selling' : type === 'most_popular' ? 'Most popular' : 'Best reviewed'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, index) => (
              <MarketplaceProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                image={product.images[0]}
                moq={product.moq || 1}
                tag={index < 3 ? 'Hot Selling' : undefined}
                avgRating={product.avgRating}
                rating={product.latestRating}
                storeId={product.store_id}
              />
            ))}
          </div>
        )}
      </div>

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

export default TopRanking;
