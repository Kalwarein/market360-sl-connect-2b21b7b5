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
        .slice(0, 100)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setProducts(data || []);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', topProductIds)
        .eq('published', true);

      if (error) throw error;

      const productsWithViews = (data || []).map((product) => ({
        ...product,
        view_count: viewCounts[product.id] || 0,
      }));

      productsWithViews.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      setProducts(productsWithViews);
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
        filtered = filtered.filter((p) => (p.view_count || 0) > 50);
        break;
      case 'most_popular':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'best_reviewed':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
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
