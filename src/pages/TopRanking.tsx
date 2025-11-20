import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MarketplaceProductCard } from '@/components/MarketplaceProductCard';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  moq?: number;
  view_count?: number;
}

const TopRanking = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTopRanking();
  }, []);

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
        .slice(0, 50)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(50);

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Top Ranking</h1>
            <p className="text-sm text-muted-foreground">Navigate trends with data-driven rankings</p>
          </div>
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
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
        )}
      </div>
    </div>
  );
};

export default TopRanking;
