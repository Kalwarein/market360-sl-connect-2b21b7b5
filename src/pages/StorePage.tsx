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
import { StoreReviewSubmissionModal } from '@/components/StoreReviewSubmissionModal';
import { ReviewStatistics } from '@/components/ReviewStatistics';
import { StoreReviewList } from '@/components/StoreReviewList';
import { StoreUpgradePopup } from '@/components/StoreUpgradePopup';
import { AdminStorePanel } from '@/components/AdminStorePanel';
import { useUserRoles } from '@/hooks/useUserRoles';
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
  status?: string;
  suspended_at?: string;
  suspension_reason?: string;
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [contacting, setContacting] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const { 
    hasVerifiedBadge, 
    hasPremiumTheme, 
    hasFeaturedSpotlight,
    hasProductHighlights,
    loading: perksLoading 
  } = useStorePerks(storeId);

  // Check user roles
  const { isAdmin } = useUserRoles();

  // Check if current user is the store owner
  const isStoreOwner = user && store?.owner_id === user.id;

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

  // Show upgrade popup for store owner
  useEffect(() => {
    if (isStoreOwner && !loading && store) {
      // Check if user has seen the popup recently (24 hours)
      const lastSeen = localStorage.getItem(`store_upgrade_popup_${storeId}`);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (!lastSeen || (now - parseInt(lastSeen)) > oneDay) {
        setShowUpgradePopup(true);
      }
    }
  }, [isStoreOwner, loading, store, storeId]);

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
  const isFeaturedStore = hasFeaturedSpotlight;

  // Premium Featured Store Layout with Premium Theme
  if (isPremiumStore) {
    return (
      <div className={`min-h-screen pb-20 ${isFeaturedStore ? 'bg-gradient-to-b from-amber-50/50 via-background to-background' : 'bg-gradient-to-b from-primary/5 via-background to-background'}`}>
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 ${isFeaturedStore ? 'bg-amber-400' : 'bg-primary'}`} />
          <div className={`absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 ${isFeaturedStore ? 'bg-orange-400' : 'bg-secondary'}`} />
        </div>

        {/* Header Actions */}
        <div className="relative px-4 pt-4 flex items-center justify-between z-10">
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl h-9 px-3 backdrop-blur-sm ${isFeaturedStore ? 'border-amber-200 hover:bg-amber-50' : 'border-primary/20 hover:bg-primary/5'}`}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl h-9 px-3 backdrop-blur-sm ${isFeaturedStore ? 'border-amber-200 hover:bg-amber-50' : 'border-primary/20 hover:bg-primary/5'}`}
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>

        {/* Admin Store Panel - Only visible to admins */}
        {isAdmin && store && (
          <div className="relative px-4 pt-4 z-10">
            <AdminStorePanel store={store} onStatusChange={loadStoreData} />
          </div>
        )}

        {/* Premium Hero Section */}
        <div className="relative px-4 pt-6 z-10">
          {/* Verified Banner for Premium Stores */}
          {hasVerifiedBadge && (
            <div className="mb-6">
              <Card className={`border-0 shadow-2xl overflow-hidden ${isFeaturedStore ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600' : 'bg-gradient-to-r from-primary via-primary to-secondary'}`}>
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
                        <p className="text-sm text-white/80">This seller has been verified by 360Mall</p>
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
            <Badge className={`px-6 py-2 rounded-full shadow-lg text-sm font-bold ${
              isFeaturedStore 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground'
            }`}>
              <Crown className="h-5 w-5 mr-2 fill-current" />
              {isFeaturedStore ? 'FEATURED SPOTLIGHT STORE' : 'PREMIUM THEME STORE'}
            </Badge>
          </div>

          {/* Store Hero Card - Enhanced for Premium Theme */}
          <Card className={`overflow-hidden shadow-2xl ${
            isFeaturedStore 
              ? 'border-2 border-amber-300/50 ring-4 ring-amber-100/50' 
              : 'border-2 border-primary/20 ring-4 ring-primary/10'
          }`}>

            {/* Store Banner */}
            <div className="relative h-56 overflow-hidden">
              {store.banner_url ? (
                <img 
                  src={store.banner_url} 
                  alt={store.store_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full ${
                  isFeaturedStore 
                    ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600' 
                    : 'bg-gradient-to-br from-primary via-primary-hover to-accent'
                }`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
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

              {/* Store Logo Overlay on Banner */}
              <div className="absolute -bottom-14 left-6 z-20">
                <div className={`h-28 w-28 rounded-2xl overflow-hidden shadow-2xl bg-card ${
                  isFeaturedStore 
                    ? 'border-4 border-amber-400 ring-4 ring-amber-200/50' 
                    : 'border-4 border-primary/30 ring-4 ring-primary/20'
                }`}>
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      isFeaturedStore 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                        : 'bg-gradient-to-br from-primary to-accent'
                    }`}>
                      <Crown className="h-14 w-14 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="pt-16 pb-6 px-6 space-y-6">
              {/* Store Name and Verified Badge */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-3xl md:text-4xl font-black ${isFeaturedStore ? 'text-amber-900' : 'text-foreground'}`}>
                    {store.store_name}
                  </h1>
                  {hasVerifiedBadge && (
                    <CheckCircle className={`h-8 w-8 flex-shrink-0 ${
                      isFeaturedStore ? 'text-amber-500 fill-amber-500' : 'text-primary fill-primary'
                    }`} />
                  )}
                </div>

                {/* Location */}
                {(store.city || store.region) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className={`h-4 w-4 ${isFeaturedStore ? 'text-amber-600' : 'text-primary'}`} />
                    <span className="font-medium text-sm">
                      {[store.city, store.region, store.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!user ? (
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  <Button 
                    variant="outline"
                    className={`rounded-xl h-12 font-bold border-2 ${
                      isFeaturedStore ? 'border-amber-300 hover:bg-amber-50' : 'hover:border-primary'
                    }`} 
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className={`rounded-xl shadow-2xl font-bold h-12 ${
                      isFeaturedStore 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                        : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90'
                    }`}
                    onClick={() => navigate('/auth')}
                  >
                    Create Account
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  <Button 
                    className={`rounded-xl shadow-2xl font-bold h-12 ${
                      isFeaturedStore 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                        : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90'
                    }`}
                    onClick={handleContactSeller}
                    disabled={contacting}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {contacting ? 'Opening...' : 'Contact Seller'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`rounded-xl h-12 font-bold border-2 ${
                      isFeaturedStore ? 'border-amber-300 hover:bg-amber-50' : 'hover:border-primary'
                    }`} 
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share Store
                  </Button>
                </div>
              )}

              {/* Store Stats Cards - Horizontal on Premium Theme */}
              <div className="grid grid-cols-3 gap-3">
                {/* Rating Card */}
                <Card className={`border-2 shadow-lg ${
                  isFeaturedStore ? 'border-amber-200 bg-amber-50/50' : 'border-primary/20 bg-primary/5'
                }`}>
                  <CardContent className="p-4 text-center">
                    <Star className={`h-6 w-6 mx-auto mb-1 ${isFeaturedStore ? 'text-amber-500 fill-amber-500' : 'text-primary fill-primary'}`} />
                    <p className={`text-2xl font-black ${isFeaturedStore ? 'text-amber-700' : 'text-primary'}`}>4.9</p>
                    <p className="text-xs text-muted-foreground font-medium">Rating</p>
                  </CardContent>
                </Card>

                {/* Products Card */}
                <Card className={`border-2 shadow-lg ${
                  isFeaturedStore ? 'border-amber-200 bg-amber-50/50' : 'border-accent/20 bg-accent/5'
                }`}>
                  <CardContent className="p-4 text-center">
                    <Package className={`h-6 w-6 mx-auto mb-1 ${isFeaturedStore ? 'text-amber-600' : 'text-accent'}`} />
                    <p className="text-2xl font-black text-foreground">{products.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Products</p>
                  </CardContent>
                </Card>

                {/* Premium Status Card */}
                <Card className={`border-2 shadow-lg ${
                  isFeaturedStore ? 'border-amber-200 bg-gradient-to-br from-amber-100 to-orange-100' : 'border-secondary/20 bg-gradient-to-br from-primary/10 to-secondary/10'
                }`}>
                  <CardContent className="p-4 text-center">
                    <Crown className={`h-6 w-6 mx-auto mb-1 ${isFeaturedStore ? 'text-amber-600 fill-amber-600' : 'text-primary fill-primary'}`} />
                    <p className="text-lg font-black text-foreground">Premium</p>
                    <p className="text-xs text-muted-foreground font-medium">Status</p>
                  </CardContent>
                </Card>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`font-bold border-2 rounded-full px-4 py-2 ${
                  isFeaturedStore 
                    ? 'bg-amber-100 text-amber-700 border-amber-200' 
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  <Shield className="h-4 w-4 mr-1.5" />
                  Trusted Seller
                </Badge>
                {hasVerifiedBadge && (
                  <Badge className={`font-bold border-2 rounded-full px-4 py-2 ${
                    isFeaturedStore 
                      ? 'bg-orange-100 text-orange-700 border-orange-200' 
                      : 'bg-accent/10 text-accent border-accent/20'
                  }`}>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Verified
                  </Badge>
                )}
                <Badge className={`font-bold border-2 rounded-full px-4 py-2 ${
                  isFeaturedStore 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                    : 'bg-secondary/10 text-secondary-foreground border-secondary/20'
                }`}>
                  <Zap className="h-4 w-4 mr-1.5" />
                  Fast Response
                </Badge>
              </div>

              {/* Description */}
              {store.description && (
                <Card className={`border-2 shadow-lg ${
                  isFeaturedStore ? 'border-amber-100 bg-amber-50/30' : 'border-muted bg-muted/50'
                }`}>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-base mb-2 text-foreground">About This Store</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {store.description}
                    </p>
                  </CardContent>
                </Card>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Products Section - Premium Grid */}
        <div className="relative px-4 mt-8 z-10">
          {products.length === 0 ? (
            <Card className={`border-2 ${isFeaturedStore ? 'border-amber-200' : 'border-border'}`}>
              <CardContent className="p-12 text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isFeaturedStore ? 'bg-amber-100' : 'bg-muted'
                }`}>
                  <Package className={`h-8 w-8 ${isFeaturedStore ? 'text-amber-500' : 'text-muted-foreground'}`} />
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
                  <h2 className={`text-2xl font-bold ${isFeaturedStore ? 'text-amber-900' : 'text-foreground'}`}>All Products</h2>
                  <Badge className={`font-bold border rounded-full ${
                    isFeaturedStore 
                      ? 'bg-amber-100 text-amber-700 border-amber-200' 
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {products.length} items
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className={`cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl ${
                        isFeaturedStore 
                          ? 'border-2 border-amber-200 hover:border-amber-300 hover:ring-4 hover:ring-amber-100' 
                          : 'border-2 border-primary/10 hover:border-primary/30 hover:ring-4 hover:ring-primary/10'
                      }`}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isFeaturedStore ? 'bg-amber-50' : 'bg-muted'
                          }`}>
                            <Package className={`h-12 w-12 ${isFeaturedStore ? 'text-amber-300' : 'text-muted-foreground'}`} />
                          </div>
                        )}
                        <Badge className={`absolute top-2 right-2 backdrop-blur-sm text-xs shadow-md ${
                          isFeaturedStore 
                            ? 'bg-amber-500/90 text-white' 
                            : 'bg-primary/90 text-primary-foreground'
                        }`}>
                          {product.category}
                        </Badge>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-semibold line-clamp-2 text-foreground mb-2">
                          {product.title}
                        </h3>
                        <p className={`text-lg font-bold ${isFeaturedStore ? 'text-amber-600' : 'text-primary'}`}>
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

      {/* Admin Store Panel - Only visible to admins */}
      {isAdmin && store && (
        <div className="px-4 pt-4 relative z-20">
          <AdminStorePanel store={store} onStatusChange={loadStoreData} />
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
                  {hasFeaturedSpotlight && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                      <Zap className="h-3 w-3 mr-1" />
                      Featured
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

      {/* Reviews Section */}
      <div className="px-4 space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Store Reviews</h2>
          {user && (
            <Button 
              onClick={() => setShowReviewModal(true)}
              className="gap-2 bg-gradient-to-r from-primary to-secondary"
            >
              <Star className="h-4 w-4" />
              Write Review
            </Button>
          )}
        </div>

        <ReviewStatistics reviews={reviews} />
        <StoreReviewList 
          storeId={storeId || ''} 
          onReviewsLoaded={setReviews}
        />
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
        <>
          <ShareStoreDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            store={store}
            productCount={products.length}
          />
          
          <StoreReviewSubmissionModal
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            storeId={store.id}
            onReviewSubmitted={() => {
              setReviews([]);
            }}
          />

          {/* Upgrade Popup for Store Owner */}
          <StoreUpgradePopup
            open={showUpgradePopup}
            onClose={() => {
              setShowUpgradePopup(false);
              localStorage.setItem(`store_upgrade_popup_${storeId}`, Date.now().toString());
            }}
          />
        </>
      )}
    </div>
  );
};

export default StorePage;