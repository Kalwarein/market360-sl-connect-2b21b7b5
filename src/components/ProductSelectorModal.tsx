import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  moq?: number;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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
        .select('product_id, products(id, title, price, images, category, moq)')
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
          .select('id, title, price, images, category, moq')
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
    setSelectedProduct(product);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedProduct) {
      onSelectProduct(selectedProduct);
      onClose();
      setSearchQuery('');
      setSelectedProduct(null);
      setShowConfirmation(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedProduct(null);
    setShowConfirmation(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 border-b px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Select a Product</h2>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b bg-accent/5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-sm animate-pulse">
                    <Skeleton className="h-20 w-20 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-1/2 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground animate-fade-in">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-semibold">No products found</p>
                <p className="text-sm mt-2">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card hover:bg-accent hover:border-primary transition-all duration-300 hover:shadow-xl text-left hover:scale-[1.02] shadow-sm group"
                  >
                    <img
                      src={product.images[0] || '/placeholder.svg'}
                      alt={product.title}
                      className="h-20 w-20 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold line-clamp-2 mb-1 text-foreground group-hover:text-primary transition-colors">{product.title}</h4>
                      <p className="text-lg font-bold text-primary">Le {product.price.toLocaleString()}</p>
                      {product.moq && (
                        <p className="text-xs text-muted-foreground mt-1">MOQ: {product.moq}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && selectedProduct && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
              <h3 className="text-xl font-bold text-primary mb-5">Confirm Product Selection</h3>
              <div className="flex gap-4 mb-6 p-4 bg-surface rounded-xl">
                <img
                  src={selectedProduct.images[0] || '/placeholder.svg'}
                  alt={selectedProduct.title}
                  className="h-24 w-24 object-cover rounded-xl shadow-md"
                />
                <div className="flex-1">
                  <h4 className="font-semibold line-clamp-2 mb-2 text-foreground">{selectedProduct.title}</h4>
                  <p className="text-lg font-bold text-primary">Le {selectedProduct.price.toLocaleString()}</p>
                  {selectedProduct.moq && (
                    <p className="text-xs text-muted-foreground mt-1">MOQ: {selectedProduct.moq}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This product will be sent in your message. Do you want to continue?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelSelection}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-11 font-semibold"
                >
                  Confirm & Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectorModal;
