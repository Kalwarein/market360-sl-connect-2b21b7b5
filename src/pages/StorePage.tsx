import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, MessageCircle, Star, Package, TrendingUp, Sparkles, Crown, Share2, Shield, Zap, Award, CheckCircle } from 'lucide-react';
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

  const isPremiumStore = hasFeaturedSpotlight || hasPremiumTheme;

  // Premium Featured Store Layout
  if (isPremiumStore) {
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden">
        {/* Animated Golden Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div 
          className="fixed inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
        
        {/* Header Actions */}
        <div className="relative z-20 px-4 pt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-200 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-amber-500/30 rounded-xl h-9 px-3 transition-all shadow-lg"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-200 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-amber-500/30 rounded-xl h-9 px-3 transition-all shadow-lg"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>

        {/* Premium Hero Section */}
        <div className="relative z-10 px-4 pt-6">
          {/* Premium Crown Banner */}
          <div className="flex items-center justify-center mb-6 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-6 py-2 rounded-full shadow-2xl border-2 border-yellow-300 animate-pulse">
              <div className="flex items-center gap-2 font-bold">
                <Crown className="h-5 w-5 fill-current" />
                <span className="text-sm tracking-wider">PREMIUM FEATURED STORE</span>
                <Crown className="h-5 w-5 fill-current" />
              </div>
            </div>
          </div>

          {/* Store Hero Card */}
          <Card 
            className="relative overflow-hidden border-2 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
              borderImage: 'linear-gradient(135deg, #ffd700, #ffed4e, #ffd700, #ffb700) 1',
              boxShadow: '0 0 60px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Shimmer Effect */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.5) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite'
              }}
            />

            {/* Store Banner */}
            <div className="relative h-48 overflow-hidden">
              {store.banner_url ? (
                <img 
                  src={store.banner_url} 
                  alt={store.store_name}
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.85) contrast(1.1)' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-900 via-yellow-700 to-amber-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Sparkle Effects */}
              <Star className="absolute top-6 left-6 h-6 w-6 text-yellow-300 fill-yellow-300 animate-pulse" style={{ animationDelay: '0s' }} />
              <Star className="absolute top-10 right-10 h-5 w-5 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Star className="absolute bottom-8 left-1/3 h-4 w-4 text-amber-300 fill-amber-300 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <CardContent className="relative p-6">
              {/* Golden Logo Frame */}
              <div className="absolute -top-16 left-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl blur-lg opacity-75 animate-pulse" />
                  <div 
                    className="relative h-32 w-32 rounded-2xl overflow-hidden"
                    style={{
                      border: '4px solid',
                      borderImage: 'linear-gradient(135deg, #ffd700, #ffed4e, #ffd700, #ffb700) 1',
                      boxShadow: '0 8px 32px rgba(255, 215, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-800 to-yellow-900">
                        <Crown className="h-16 w-16 text-yellow-300 fill-yellow-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Store Info */}
              <div className="pl-40 min-h-[100px]">
                <div className="flex items-center gap-3 mb-3">
                  {/* Typewriter Store Name */}
                  <h1 
                    className="text-3xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 2px 8px rgba(255, 215, 0, 0.6))',
                      animation: 'typewriter 3s steps(40) 1s 1 normal both'
                    }}
                  >
                    {store.store_name}
                  </h1>
                  
                  {/* Verified Badge */}
                  {hasVerifiedBadge && (
                    <div className="relative animate-pulse">
                      <div className="absolute inset-0 bg-amber-500/50 blur-xl rounded-full" />
                      <img 
                        src={verifiedBadge} 
                        alt="Verified" 
                        className="h-12 w-12 object-contain drop-shadow-2xl relative z-10"
                      />
                    </div>
                  )}
                </div>

                {/* Location */}
                {(store.city || store.region) && (
                  <div className="flex items-center gap-2 text-amber-200/90 mb-4">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <span className="font-medium text-sm">
                      {[store.city, store.region, store.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Badge className="bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold border-2 border-yellow-300 shadow-lg">
                    <Shield className="h-3 w-3 mr-1" />
                    Trusted Seller
                  </Badge>
                  <Badge className="bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold border border-emerald-400/50 shadow-lg">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                  <Badge className="bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold border border-violet-400/50 shadow-lg">
                    <Zap className="h-3 w-3 mr-1" />
                    Fast Response
                  </Badge>
                  <Badge className="bg-gradient-to-r from-rose-600 to-pink-500 text-white font-bold border border-rose-400/50 shadow-lg">
                    <Award className="h-3 w-3 mr-1" />
                    Top Rated
                  </Badge>
                </div>

                {/* Store Stats */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-lg">4.9</span>
                  </div>
                  <div className="h-5 w-px bg-amber-500/30" />
                  <span className="text-amber-200 font-semibold">{products.length} Products</span>
                  <div className="h-5 w-px bg-amber-500/30" />
                  <span className="text-amber-200 font-semibold">500+ Sales</span>
                </div>

                {/* Description */}
                {store.description && (
                  <p className="text-amber-100/80 text-sm leading-relaxed line-clamp-2">
                    {store.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {!user ? (
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button 
                    variant="outline"
                    className="rounded-xl border-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 shadow-lg" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="rounded-xl shadow-2xl font-bold relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                      color: '#000',
                      border: '2px solid #ffb700'
                    }}
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    <span className="relative z-10">Create Account</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button 
                    className="rounded-xl shadow-2xl font-bold border-2"
                    style={{
                      background: 'linear-gradient(135deg, #0FA86C, #0B8A6D)',
                      borderColor: '#0FA86C'
                    }}
                    size="lg"
                    onClick={handleContactSeller}
                    disabled={contacting}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {contacting ? 'Opening...' : 'Contact Seller'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 shadow-lg" 
                    size="lg"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Store
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Bottom Golden Accent */}
            <div 
              className="h-2 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%)'
              }}
            />
          </Card>
        </div>

        {/* Products Section */}
        <div className="relative z-10 px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Store Products
            </h2>
            <Badge 
              className="bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold border-2 border-yellow-300"
            >
              {products.length} items
            </Badge>
          </div>
          
          {products.length === 0 ? (
            <Card className="border-2 border-amber-500/30 bg-black/40 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-amber-400" />
                </div>
                <p className="text-amber-200 font-medium">No products available</p>
                <p className="text-sm text-amber-300/60 mt-1">Check back soon for new items</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden cursor-pointer transition-all duration-300 border-2 bg-black/40 backdrop-blur-sm hover:scale-105"
                  style={{
                    borderImage: 'linear-gradient(135deg, #ffd700, #ffed4e) 1',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="aspect-square bg-zinc-900 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none z-10" />
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-amber-500/50" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-amber-500 text-black font-bold text-xs shadow-xl">
                      {product.category}
                    </Badge>
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-xs shadow-xl">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <CardContent className="p-3 space-y-1 bg-black/60">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-amber-100">
                      {product.title}
                    </h3>
                    <p className="text-xs text-amber-300/70 font-mono">
                      {product.product_code}
                    </p>
                    <p 
                      className="font-bold text-lg pt-1"
                      style={{
                        background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
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
                      <TrendingUp className="h-3 w-3 mr-1" />
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