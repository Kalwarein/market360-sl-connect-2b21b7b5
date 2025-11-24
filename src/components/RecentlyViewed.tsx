import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ViewedProduct {
  id: string;
  product_id: string;
  viewed_at: string;
  products: {
    id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
  };
}

export const RecentlyViewed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentlyViewed();
    }
  }, [user]);

  const loadRecentlyViewed = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('product_views')
        .select(`
          id,
          product_id,
          viewed_at,
          products:product_id (
            id,
            title,
            price,
            images,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Remove duplicates (keep only latest view of each product)
      const uniqueProducts = data?.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.product_id === item.product_id)
      ) || [];

      setViewedProducts(uniqueProducts);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || viewedProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Recently Viewed</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {viewedProducts.map((view) => (
          <Card
            key={view.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => navigate(`/product/${view.products.id}`)}
          >
            <CardContent className="p-0">
              <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={view.products.images[0] || '/placeholder.svg'}
                  alt={view.products.title}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground mb-1 truncate">
                  {view.products.category}
                </p>
                <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                  {view.products.title}
                </h3>
                <p className="text-sm font-bold text-primary">
                  Le {view.products.price.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
