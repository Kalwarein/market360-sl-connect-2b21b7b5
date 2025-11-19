import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
}

interface ProductSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

const ProductSelectorModal = ({ open, onClose, onSelectProduct }: ProductSelectorModalProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadProducts();
    }
  }, [open, user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Get recently viewed products
      const { data: viewedProducts } = await supabase
        .from('product_views')
        .select('product_id, products(id, title, price, images, category)')
        .eq('user_id', user?.id)
        .order('viewed_at', { ascending: false })
        .limit(20);

      // Get user's store products if they're a seller
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .maybeSingle();

      let storeProducts: any[] = [];
      if (store) {
        const { data } = await supabase
          .from('products')
          .select('id, title, price, images, category')
          .eq('store_id', store.id)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10);
        
        storeProducts = data || [];
      }

      // Combine and deduplicate products
      const viewedProductsList = (viewedProducts || [])
        .map((v: any) => v.products)
        .filter(Boolean);
      
      const allProducts = [...viewedProductsList, ...storeProducts];
      const uniqueProducts = Array.from(
        new Map(allProducts.map((p: any) => [p.id, p])).values()
      );

      setProducts(uniqueProducts);
      setFilteredProducts(uniqueProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    onClose();
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No products found' : 'No products available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <p className="text-sm text-primary font-semibold">
                      Le {product.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectorModal;
