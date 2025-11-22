import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, MessageCircle, Star, Package, TrendingUp, Sparkles, Crown, Share2 } from 'lucide-react';
import { useStorePerks } from '@/hooks/useStorePerks';
import { ShareStoreDialog } from '@/components/ShareStoreDialog';
import { toast } from 'sonner';
import verifiedBadge from '@/assets/verified-badge.png';

interface Store {
  id: string;
  store_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  city?: string;
  region?: string;
  country?: string;
  owner_id: string;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  product_code: string;
}

const StorePage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [contacting, setContacting] = useState(false);
  const { 
    hasVerifiedBadge, 
    hasPremiumTheme, 
    hasTrendingPlacement,
    hasFeaturedSpotlight,
    hasProductHighlights,
    loading: perksLoading 
  } = useStorePerks(storeId);

  const handleContactSeller = async () => {
    if (!store || !user) return;
    
    setContacting(true);
    try {

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${store.owner_id}),and(buyer_id.eq.${store.owner_id},seller_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConversation) {
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: user.id,
          seller_id: store.owner_id,
          product_id: null
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      // Load store details
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Load store products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Store not found</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${hasPremiumTheme ? 'bg-gradient-to-br from-background via-background to-primary/5' : 'bg-background'}`}>
      {/* Featured Spotlight Banner */}
      {hasFeaturedSpotlight && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 px-4 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 animate-pulse">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-bold tracking-wide">✨ FEATURED STORE ✨</span>
            <Crown className="h-4 w-4" />
          </div>
        </div>
      )}
      
      {/* Banner */}
      <div className={`relative h-52 ${hasPremiumTheme ? 'ring-2 ring-primary/30 shadow-xl' : 'shadow-md'}`}>
        {store.banner_url ? (
          <img
            src={store.banner_url}
            alt={store.store_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${hasPremiumTheme ? 'bg-gradient-to-r from-primary via-primary-hover to-primary' : 'bg-gradient-to-r from-primary to-secondary'}`} />
        )}
        {hasPremiumTheme && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        )}
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl h-9 px-3 transition-all"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl h-9 px-3 transition-all"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Store Info */}
      <div className="px-4 -mt-20 relative z-10 mb-6">
        <Card className={`shadow-2xl border-border/50 backdrop-blur-sm ${hasPremiumTheme ? 'border-2 border-primary/30 bg-gradient-to-br from-card/95 to-primary/5' : 'bg-card/95'}`}>
          <CardContent className="p-5">
            <div className="flex gap-4">
              <div className={`h-28 w-28 rounded-2xl bg-background border-2 overflow-hidden flex-shrink-0 shadow-lg ${hasPremiumTheme ? 'ring-2 ring-primary/50' : ''}`}>
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className={`text-2xl font-bold leading-tight ${hasPremiumTheme ? 'bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent' : 'text-foreground'}`}>
                    {store.store_name}
                  </h1>
                  {hasVerifiedBadge && (
                    <div className="relative group">
                      <img 
                        src={verifiedBadge} 
                        alt="Verified Store" 
                        className="h-7 w-7 object-contain drop-shadow-xl animate-pulse"
                      />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg">
                        Verified Store
                      </span>
                    </div>
                  )}
                </div>
                {(store.city || store.region) && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {[store.city, store.region, store.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="secondary" className="shadow-sm">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    4.8
                  </Badge>
                  <Badge variant="outline" className="shadow-sm">{products.length} Products</Badge>
                  {hasTrendingPlacement && (
                    <Badge className="bg-rose-500 text-white shadow-md">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                  {hasPremiumTheme && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                {store.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {store.description}
                  </p>
                )}
              </div>
            </div>
            {!user ? (
              <div className="space-y-3 mt-4">
                <p className="text-center text-sm text-muted-foreground">
                  Sign up to contact sellers and view more features
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="rounded-xl shadow-sm" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="rounded-xl shadow-md bg-gradient-to-r from-primary to-secondary" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button 
                  className="rounded-xl shadow-md" 
                  size="lg"
                  onClick={handleContactSeller}
                  disabled={contacting}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {contacting ? 'Opening...' : 'Contact Seller'}
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl shadow-sm hover:bg-accent" 
                  size="lg"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Store
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Store Products</h2>
          <Badge variant="secondary" className="shadow-sm">{products.length} items</Badge>
        </div>
        
        {products.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No products available</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for new items</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className={`overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 border-border/50 ${
                  hasProductHighlights 
                    ? 'ring-2 ring-primary/50 shadow-[0_0_20px_rgba(15,168,108,0.3)]' 
                    : ''
                }`}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square bg-muted relative">
                  {hasProductHighlights && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none z-10" />
                  )}
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-xs shadow-md">
                    {product.category}
                  </Badge>
                  {hasProductHighlights && (
                    <Badge className="absolute top-2 left-2 bg-emerald-500 text-white text-xs shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">
                    {product.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {product.product_code}
                  </p>
                  <p className="text-primary font-bold text-base pt-1">
                    Le {product.price.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      {store && (
        <ShareStoreDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          store={store}
          productCount={products.length}
        />
      )}
    </div>
  );
};

export default StorePage;