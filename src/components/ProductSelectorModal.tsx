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
      <DialogContent className="fixed inset-0 max-w-full w-full h-full rounded-none p-0 border-0 bg-background animate-fade-in z-[100]">
        {/* Header with close button */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-2xl font-semibold">Select a Product</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-10 w-10 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search bar */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Scrollable product list */}
        <div className="overflow-y-auto h-[calc(100vh-140px)] px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-sm">
                    <Skeleton className="h-20 w-20 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No products found</p>
                <p className="text-sm mt-2">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent transition-all duration-200 hover:shadow-md text-left hover:scale-[1.02]"
                  >
                    <img
                      src={product.images[0] || '/placeholder.svg'}
                      alt={product.title}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold line-clamp-2 mb-1">{product.title}</h4>
                      <p className="text-lg font-bold text-[#0FA86C]">Le {product.price.toLocaleString()}</p>
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
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-semibold mb-4">Confirm Product Selection</h3>
              <div className="flex gap-4 mb-6">
                <img
                  src={selectedProduct.images[0] || '/placeholder.svg'}
                  alt={selectedProduct.title}
                  className="h-24 w-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold line-clamp-2 mb-2">{selectedProduct.title}</h4>
                  <p className="text-lg font-bold text-[#0FA86C]">Le {selectedProduct.price.toLocaleString()}</p>
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
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
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
