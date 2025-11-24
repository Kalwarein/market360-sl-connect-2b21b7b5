import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Crown, 
  Zap, 
  TrendingUp, 
  Star, 
  Sparkles, 
  Megaphone,
  CheckCircle2,
  Wallet as WalletIcon,
  Award,
  Flame
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
  perkType: string;
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
  const [activatedPerks, setActivatedPerks] = useState<string[]>([]);

  const perks: Perk[] = [
    {
      id: '1',
      icon: Award,
      title: 'Verified Badge',
      description: 'Display a verified checkmark next to your store name everywhere',
      price: 75,
      features: ['Verified checkmark badge', 'Increased buyer trust', 'Priority in search', 'Enhanced product cards'],
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      duration: '17 days',
      perkType: 'verified_badge'
    },
    {
      id: '2',
      icon: Zap,
      title: 'Boosted Visibility',
      description: 'Always appear at the top of store listings',
      price: 90,
      features: ['Top position in listings', '5x visibility boost', 'Featured placement', 'Analytics tracking'],
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      duration: '17 days',
      perkType: 'boosted_visibility'
    },
    {
      id: '3',
      icon: Star,
      title: 'Top of Category',
      description: 'Pin your store at the top of your category',
      price: 110,
      features: ['Always at top', 'Category dominance', 'Maximum exposure', 'Premium placement'],
      gradient: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      duration: '17 days',
      perkType: 'top_of_category'
    },
    {
      id: '4',
      icon: TrendingUp,
      title: 'Trending Placement',
      description: 'Feature your store in the Trending section',
      price: 120,
      features: ['Trending badge', 'Homepage feature', 'Hot seller status', 'Impulse buyer traffic'],
      gradient: 'from-rose-500 to-rose-600',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
      duration: '17 days',
      perkType: 'trending_placement'
    },
    {
      id: '5',
      icon: Sparkles,
      title: 'Product Highlights',
      description: 'Add glowing frames around your product listings',
      price: 85,
      features: ['Glowing product frames', 'Eye-catching design', 'Stand out from competition', 'All products highlighted'],
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      duration: '17 days',
      perkType: 'product_highlights'
    },
    {
      id: '6',
      icon: Crown,
      title: 'Premium Theme',
      description: 'Unlock exclusive premium store theme designs',
      price: 95,
      features: ['Premium UI theme', 'Luxury appearance', 'Custom colors', 'Professional look'],
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      duration: '17 days',
      perkType: 'premium_theme'
    },
    {
      id: '7',
      icon: Megaphone,
      title: 'Featured Spotlight',
      description: 'Get featured as a pop-up banner across the marketplace',
      price: 150,
      features: ['Full-screen banner', 'Maximum visibility', 'Homepage takeover', 'Ultimate promotion'],
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      duration: '17 days',
      perkType: 'featured_spotlight'
    }
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load wallet balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance_leones')
        .eq('user_id', user.id)
        .single();
      
      if (walletData) {
        setWalletBalance(walletData.balance_leones);
      }

      // Check if user has a store
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (storeData) {
        setStoreId(storeData.id);
        
        // Load active perks
        const { data: perksData } = await supabase
          .from('store_perks')
          .select('perk_type')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString());
        
        if (perksData) {
          setActivatedPerks(perksData.map(p => p.perk_type));
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
      // Calculate expiry date - all perks now last 17 days
      const daysToAdd = 17;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysToAdd);

      // Deduct from wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance_leones')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;

      const newBalance = walletData.balance_leones - selectedPerk.price;

      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance_leones: newBalance })
        .eq('id', walletData.id);

      if (updateError) throw updateError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          wallet_id: walletData.id,
          amount: -selectedPerk.price,
          type: 'withdrawal',
          reference: `Perk: ${selectedPerk.title}`,
          status: 'completed',
          metadata: {
            perk_type: selectedPerk.perkType,
            perk_name: selectedPerk.title
          }
        });

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
            duration: selectedPerk.duration,
            features: selectedPerk.features
          }
        });

      if (perkError) throw perkError;

      toast({
        title: "✨ Perk Activated!",
        description: `${selectedPerk.title} is now active for ${selectedPerk.duration}.`
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
            <h1 className="text-lg font-bold">Premium Upgrades</h1>
            <p className="text-sm text-muted-foreground">Boost your store with premium perks</p>
          </div>
          <Flame className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="p-6">
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Wallet Balance</p>
                  <p className="text-2xl font-bold">SLL {walletBalance.toLocaleString()}</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate('/wallet')}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
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

      {/* Professional Perks Grid */}
      <div className="px-6 space-y-6">
        {perks.map((perk, index) => {
          const isActivated = activatedPerks.includes(perk.perkType);
          const isPopular = index === 1 || index === 0; // Boosted Visibility and Verified Badge
          
          return (
            <Card 
              key={perk.id} 
              className={`overflow-hidden transition-all duration-500 hover:shadow-2xl group relative ${
                isActivated ? 'border-2 border-primary shadow-lg' : 'border'
              } ${isPopular ? 'ring-2 ring-primary/30' : ''}`}
            >
              {/* Popular badge */}
              {isPopular && !isActivated && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-4 py-1.5 shadow-lg border-0">
                    ⭐ MOST POPULAR
                  </Badge>
                </div>
              )}

              {/* Active badge */}
              {isActivated && (
                <div className="absolute -top-3 right-6 z-20">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold px-4 py-1.5 shadow-lg border-0">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    ACTIVE
                  </Badge>
                </div>
              )}

              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${perk.gradient}`} />

              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon with animated background */}
                    <div className={`relative h-16 w-16 rounded-2xl ${perk.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`absolute inset-0 bg-gradient-to-r ${perk.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity`} />
                      <perk.icon className={`h-8 w-8 ${perk.iconColor} relative z-10`} />
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
                      <span className="text-sm text-muted-foreground font-medium">SLL</span>
                      <p className={`text-3xl font-black bg-gradient-to-r ${perk.gradient} bg-clip-text text-transparent`}>
                        {perk.price}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center justify-end gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {perk.duration}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-6 pb-6">
                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {perk.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm group/feature">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover/feature:scale-110 transition-transform" />
                      <span className="text-muted-foreground group-hover/feature:text-foreground transition-colors leading-tight">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Action Button */}
                <Button
                  className={`w-full h-12 text-base font-bold bg-gradient-to-r ${perk.gradient} text-white hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl ${
                    isActivated ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => handlePurchaseClick(perk)}
                  disabled={!storeId || isActivated}
                >
                  {isActivated ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Already Active
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
                    💎 Premium feature • {perk.duration} of maximum visibility
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
                You are about to purchase <strong>{selectedPerk?.title}</strong>
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Price:</span>
                  <span className="font-bold">SLL {selectedPerk?.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span className="font-bold">{selectedPerk?.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New Balance:</span>
                  <span className="font-bold">
                    SLL {((walletBalance || 0) - (selectedPerk?.price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-sm">
                This perk will activate immediately and enhance your store for {selectedPerk?.duration}.
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
