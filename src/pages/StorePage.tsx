import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, MessageCircle, Star, Package, Crown, Share2, Shield, Zap, Award, CheckCircle } from 'lucide-react';
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

      // Load all store products
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

  const isPremiumStore = hasFeaturedSpotlight || hasPremiumTheme;

  // Premium Featured Store Layout
  if (isPremiumStore) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        {/* Header Actions */}
        <div className="px-4 pt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 px-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 px-3"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>

        {/* Premium Hero Section */}
        <div className="px-4 pt-6">
          {/* Verified Banner for Premium Stores */}
          {hasVerifiedBadge && (
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                        <img 
                          src={verifiedBadge} 
                          alt="Verified" 
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                      <div className="text-white">
                        <h3 className="text-xl font-bold mb-1">Verified Store</h3>
                        <p className="text-sm text-blue-100">This seller has been verified by 360Mall</p>
                      </div>
                    </div>
                    <Shield className="h-16 w-16 text-white/30" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Premium Banner */}
          <div className="flex items-center justify-center mb-6">
            <Badge className="bg-primary text-primary-foreground px-6 py-2 rounded-full shadow-lg text-sm font-bold">
              <Crown className="h-5 w-5 mr-2 fill-current" />
              PREMIUM FEATURED STORE
            </Badge>
          </div>

          {/* Store Hero Card */}
          <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">

            {/* Store Banner */}
            <div className="relative h-48 overflow-hidden">
              {store.banner_url ? (
                <img 
                  src={store.banner_url} 
                  alt={store.store_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary via-primary-hover to-accent" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Verified Badge - Floating */}
              {hasVerifiedBadge && (
                <div className="absolute top-4 right-4 z-10">
                  <img 
                    src={verifiedBadge} 
                    alt="Verified" 
                    className="h-16 w-16 object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </div>

            <CardContent className="p-6">
              {/* Two-Column Layout for Desktop, Stack on Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
                
                {/* Left Column - Logo and Key Stats */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  {/* Logo */}
                  <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-xl bg-card">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                        <Crown className="h-16 w-16 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Store Stats Cards */}
                  <div className="w-full space-y-3">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-primary mb-1">
                          <Star className="h-5 w-5 fill-primary" />
                          <span className="font-bold text-2xl">4.9</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Rating</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-accent/5 border-accent/20">
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Package className="h-5 w-5 text-accent" />
                          <span className="font-bold text-2xl text-foreground">{products.length}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Products</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-secondary/5 border-secondary/20">
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Award className="h-5 w-5 text-secondary-foreground" />
                          <span className="font-bold text-xl text-foreground">Premium</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Featured Store</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Column - Store Information */}
                <div className="space-y-4">
                  {/* Store Name and Verified Badge */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        {store.store_name}
                      </h1>
                      {hasVerifiedBadge && (
                        <CheckCircle className="h-7 w-7 text-primary fill-primary flex-shrink-0" />
                      )}
                    </div>

                    {/* Location */}
                    {(store.city || store.region) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          {[store.city, store.region, store.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary/10 text-primary font-semibold border border-primary/20 rounded-full px-3 py-1">
                      <Shield className="h-3.5 w-3.5 mr-1.5" />
                      Trusted Seller
                    </Badge>
                    <Badge className="bg-accent/10 text-accent font-semibold border border-accent/20 rounded-full px-3 py-1">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Verified
                    </Badge>
                    <Badge className="bg-secondary/10 text-secondary-foreground font-semibold border border-secondary/20 rounded-full px-3 py-1">
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Fast Response
                    </Badge>
                  </div>

                  {/* Description */}
                  {store.description && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-foreground leading-relaxed">
                          {store.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons - Moved here for better flow */}
                  {!user ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline"
                        className="rounded-xl h-11" 
                        onClick={() => navigate('/auth')}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="rounded-xl shadow-lg font-bold h-11"
                        onClick={() => navigate('/auth')}
                      >
                        Create Account
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        className="rounded-xl shadow-lg font-bold h-11"
                        onClick={handleContactSeller}
                        disabled={contacting}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {contacting ? 'Opening...' : 'Contact Seller'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="rounded-xl h-11" 
                        onClick={() => setShareDialogOpen(true)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Store
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="px-4 mt-8">
          {products.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">No products available</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon for new items</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* All Products Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">All Products</h2>
                  <Badge className="bg-primary/10 text-primary font-bold border border-primary/20 rounded-full">
                    {products.length} items
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border border-border rounded-2xl"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-medium line-clamp-2 text-foreground mb-2">
                          {product.title}
                        </h3>
                        <p className="text-lg font-bold text-primary">
                          Le {product.price.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <ShareStoreDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          store={store}
          productCount={products.length}
        />
      </div>
    );
  }


  // Standard Store Layout
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Banner */}
      <div className="relative h-52 shadow-md">
        {store.banner_url ? (
          <img
            src={store.banner_url}
            alt={store.store_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" />
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

      {/* Verified Banner for Standard Stores */}
      {hasVerifiedBadge && (
        <div className="px-4 pt-4 -mt-16 relative z-20">
          <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                  <img 
                    src={verifiedBadge} 
                    alt="Verified" 
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div className="text-white flex-1">
                  <h3 className="text-base font-bold mb-0.5 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 fill-current" />
                    Verified Store
                  </h3>
                  <p className="text-xs text-blue-100">This seller has been verified by 360Mall</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Store Info */}
      <div className="px-4 -mt-20 relative z-10 mb-6">
        <Card className="shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardContent className="p-5">
            <div className="flex gap-4">
              <div className="h-28 w-28 rounded-2xl bg-background border-2 overflow-hidden flex-shrink-0 shadow-lg">
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
                  <h1 className="text-2xl font-bold leading-tight text-foreground">
                    {store.store_name}
                  </h1>
                  {hasVerifiedBadge && (
                    <div className="relative group">
                      <img 
                        src={verifiedBadge} 
                        alt="Verified Store" 
                        className="h-7 w-7 object-contain drop-shadow-xl"
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
                      <Zap className="h-3 w-3 mr-1" />
                      Trending
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

      {products.length === 0 ? (
        <div className="px-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No products available</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for new items</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* All Products Section */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">All Products</h2>
              <Badge variant="secondary" className="shadow-sm">{products.length} items</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 border-border/50"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="aspect-square bg-muted relative">
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
          </div>
        </>
      )}

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