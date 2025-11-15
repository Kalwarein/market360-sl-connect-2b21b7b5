import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Package, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  published: boolean;
  stores: {
    store_name: string;
  };
}

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(store_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Products Management</h1>
        <p className="text-sm opacity-90">{products.length} total products</p>
      </div>

      <div className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      product.published ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}
                  >
                    {product.published ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{product.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.stores?.store_name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">Le {product.price.toLocaleString()}</span>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
