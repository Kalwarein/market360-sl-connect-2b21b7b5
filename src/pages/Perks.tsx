import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Crown, 
  Zap, 
  Star, 
  Sparkles, 
  Megaphone,
  CheckCircle2,
  Wallet as WalletIcon,
  Award,
  Clock,
  Info,
  Shield,
  Palette,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getRemainingDays } from '@/hooks/usePerkAnalytics';
import { cn } from '@/lib/utils';

interface Perk {
  id: string;
  icon: any;
  title: string;
  description: string;
  price: number;
  features: string[];
  gradient: string;
  iconBg: string;
  iconColor: string;
  duration: string;
  durationDays: number;
  perkType: string;
  category: 'trust' | 'visibility' | 'ui' | 'premium';
}

interface ActivePerkInfo {
  perkType: string;
  expiresAt: string;
  remainingDays: number;
}

const Perks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState(0);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [activatedPerks, setActivatedPerks] = useState<ActivePerkInfo[]>([]);

  // UPDATED PERKS - Removed Top of Category and Trending Placement
  // Each perk has clear, non-overlapping responsibilities
  const perks: Perk[] = [
    {
      id: '1',
      icon: Award,
      title: 'Verified Badge',
      description: 'Display "Verified Store" label everywhere - builds trust with buyers (NO visibility boost)',
      price: 29,
      features: [
        '"Verified Store" on all products', 
        'Badge on store profile', 
        'Trust indicator in chats', 
        'Buyer confidence boost'
      ],
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      duration: '30 days',
      durationDays: 30,
      perkType: 'verified_badge',
      category: 'trust'
    },
    {
      id: '2',
      icon: Eye,
      title: 'Boosted Visibility',
      description: 'Your store appears in "Premium Stores" section on the home page',
      price: 117,
      features: [
        'Premium Stores homepage section', 
        'Store-level exposure', 
        'Increased discoverability', 
        'No badge required'
      ],
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      duration: '90 days',
      durationDays: 90,
      perkType: 'boosted_visibility',
      category: 'visibility'
    },
    {
      id: '3',
      icon: Sparkles,
      title: 'Product Highlights',
      description: 'Premium UI styling for your product cards and product details pages',
      price: 75,
      features: [
        'Premium product card styling', 
        'Enhanced product details page', 
        'Professional typography', 
        'Cleaner layouts'
      ],
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      duration: '60 days',
      durationDays: 60,
      perkType: 'product_highlights',
      category: 'ui'
    },
    {
      id: '4',
      icon: Palette,
      title: 'Premium Theme',
      description: 'Exclusive premium store page design with enhanced layouts and styling',
      price: 150,
      features: [
        'Premium store page layout', 
        'Enhanced spacing & typography', 
        'Professional design elements', 
        'Stand out from basic stores'
      ],
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      duration: '90 days',
      durationDays: 90,
      perkType: 'premium_theme',
      category: 'ui'
    },
    {
      id: '5',
      icon: Megaphone,
      title: 'Featured Spotlight',
      description: 'MAXIMUM visibility - homepage banners, featured sections, spotlight badge',
      price: 170,
      features: [
        'Homepage spotlight banners', 
        'Featured Spotlight badge', 
        'Maximum exposure everywhere', 
        'Priority over all other perks'
      ],
      gradient: 'from-red-500 to-orange-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      duration: '60 days',
      durationDays: 60,
      perkType: 'featured_spotlight',
      category: 'premium'
    }
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load wallet balance using RPC (ledger-based)
      const { data: balance, error: balanceError } = await supabase
        .rpc('get_wallet_balance', { p_user_id: user.id });
      
      if (!balanceError && balance !== null) {
        setWalletBalance(balance);
      }

      // Check if user has a store
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (storeData) {
        setStoreId(storeData.id);
        
        // Load active perks with expiry info
        const { data: perksData } = await supabase
          .from('store_perks')
          .select('perk_type, expires_at')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString());
        
        if (perksData) {
          setActivatedPerks(perksData.map(p => ({
            perkType: p.perk_type,
            expiresAt: p.expires_at || '',
            remainingDays: p.expires_at ? getRemainingDays(p.expires_at) : 0
          })));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (perk: Perk) => {
    if (!storeId) {
      toast({
        title: "No Store Found",
        description: "You need to be a seller to purchase perks. Apply to become a seller first.",
        variant: "destructive"
      });
      return;
    }

    if (walletBalance < perk.price) {
      toast({
        title: "Insufficient Balance",
        description: "Please top up your wallet to purchase this perk.",
        variant: "destructive"
      });
      navigate('/wallet');
      return;
    }

    setSelectedPerk(perk);
    setShowConfirmDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPerk || !storeId || !user) return;
    
    setPurchasing(true);
    
    try {
      const daysToAdd = selectedPerk.durationDays;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysToAdd);

      // Create wallet_ledger entry for perk purchase (debit)
      const { error: ledgerError } = await supabase
        .from('wallet_ledger')
        .insert({
          user_id: user.id,
          amount: selectedPerk.price,
          transaction_type: 'payment',
          status: 'success',
          reference: `Perk: ${selectedPerk.title}`,
          metadata: {
            perk_type: selectedPerk.perkType,
            perk_name: selectedPerk.title,
            duration_days: daysToAdd
          }
        });

      if (ledgerError) throw ledgerError;

      // Add perk to store_perks
      const { error: perkError } = await supabase
        .from('store_perks')
        .insert({
          store_id: storeId,
          perk_type: selectedPerk.perkType,
          perk_name: selectedPerk.title,
          price_paid: selectedPerk.price,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          metadata: {
            duration_days: daysToAdd,
            features: selectedPerk.features,
            category: selectedPerk.category
          }
        });

      if (perkError) throw perkError;

      // Create activation notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          title: '✨ Perk Activated!',
          body: `Your ${selectedPerk.title} is now active for ${daysToAdd} days!`,
          metadata: {
            perk_type: selectedPerk.perkType,
            duration_days: daysToAdd
          }
        });

      toast({
        title: "✨ Perk Activated!",
        description: `${selectedPerk.title} is now active for ${daysToAdd} days.`
      });

      // Reload data
      await loadData();
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPurchasing(false);
      setShowConfirmDialog(false);
      setSelectedPerk(null);
    }
  };

  const getActivePerkInfo = (perkType: string): ActivePerkInfo | undefined => {
    return activatedPerks.find(p => p.perkType === perkType);
  };

  const getCategoryLabel = (category: Perk['category']) => {
    switch (category) {
      case 'trust': return { label: 'TRUST', color: 'bg-blue-500' };
      case 'visibility': return { label: 'VISIBILITY', color: 'bg-purple-500' };
      case 'ui': return { label: 'UI UPGRADE', color: 'bg-emerald-500' };
      case 'premium': return { label: 'MAXIMUM POWER', color: 'bg-red-500' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Store Perks</h1>
            <p className="text-sm text-muted-foreground">Upgrade your store with powerful perks</p>
          </div>
          <Crown className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="p-6">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Wallet Balance</p>
                  <p className="text-2xl font-bold">LE {walletBalance.toLocaleString()}</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/wallet')}
                className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
              >
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner - Seller Required */}
      {!storeId && (
        <div className="mx-6 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Seller Account Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You need to be a seller to purchase premium perks. Apply to become a seller first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Perk Categories Explanation */}
      <div className="mx-6 mb-6 p-4 bg-muted/50 border rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Each perk has a unique purpose:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Trust - Build buyer confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Visibility - Store exposure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>UI - Premium styling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Premium - Maximum power</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Perks Grid */}
      <div className="px-6 space-y-6">
        {perks.map((perk) => {
          const activePerk = getActivePerkInfo(perk.perkType);
          const isActivated = !!activePerk;
          const categoryInfo = getCategoryLabel(perk.category);
          
          return (
            <Card 
              key={perk.id} 
              className={cn(
                "overflow-hidden transition-all duration-500 hover:shadow-2xl group relative",
                isActivated && "border-2 border-primary shadow-lg",
                perk.category === 'premium' && !isActivated && "ring-2 ring-red-500/30"
              )}
            >
              {/* Category Badge */}
              <div className="absolute -top-3 left-6 z-20">
                <Badge className={cn("text-white font-bold px-3 py-1 shadow-lg border-0 text-[10px]", categoryInfo.color)}>
                  {categoryInfo.label}
                </Badge>
              </div>

              {/* Active badge with remaining days */}
              {isActivated && (
                <div className="absolute -top-3 right-6 z-20">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold px-4 py-1.5 shadow-lg border-0">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    ACTIVE • {activePerk?.remainingDays}d left
                  </Badge>
                </div>
              )}

              {/* Gradient Header */}
              <div className={cn("h-2 bg-gradient-to-r", perk.gradient)} />

              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={cn(
                      "relative h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0",
                      "group-hover:scale-110 transition-transform duration-300",
                      perk.iconBg
                    )}>
                      <perk.icon className={cn("h-8 w-8 relative z-10", perk.iconColor)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                        {perk.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {perk.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground font-medium">LE</span>
                      <p className={cn(
                        "text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                        perk.gradient
                      )}>
                        {perk.price}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium mt-1 flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {perk.duration}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-6 pb-6">
                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {perk.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm group/feature">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-tight">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Action Button */}
                <Button
                  className={cn(
                    "w-full h-12 text-base font-bold text-white",
                    "hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all duration-300",
                    "shadow-lg hover:shadow-xl",
                    `bg-gradient-to-r ${perk.gradient}`,
                    isActivated && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handlePurchaseClick(perk)}
                  disabled={!storeId || isActivated}
                >
                  {isActivated ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Active • {activePerk?.remainingDays} days left
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Activate Now
                    </>
                  )}
                </Button>

                {/* Value proposition */}
                {!isActivated && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    💎 {perk.duration} of {perk.category === 'premium' ? 'maximum power' : perk.category === 'trust' ? 'buyer trust' : perk.category === 'visibility' ? 'store exposure' : 'premium styling'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to activate <strong>{selectedPerk?.title}</strong>
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Price:</span>
                  <span className="font-bold">LE {selectedPerk?.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-bold text-primary">{selectedPerk?.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New Balance:</span>
                  <span className="font-bold">
                    LE {((walletBalance || 0) - (selectedPerk?.price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-sm">
                This perk will activate immediately!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchasing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPurchase}
              disabled={purchasing}
              className="bg-primary hover:bg-primary/90"
            >
              {purchasing ? 'Processing...' : 'Confirm Purchase'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Perks;
