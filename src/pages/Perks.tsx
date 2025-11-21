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
      description: 'Display a verified checkmark next to your store name',
      price: 45,
      features: ['Verified checkmark badge', 'Increased buyer trust', 'Priority in search', 'Visible everywhere'],
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      duration: '30 days',
      perkType: 'verified_badge'
    },
    {
      id: '2',
      icon: Zap,
      title: 'Boosted Visibility',
      description: 'Get 3x more views with boosted store visibility',
      price: 60,
      features: ['3x visibility boost', 'Higher in search results', 'Featured in recommendations', 'Analytics tracking'],
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      duration: '14 days',
      perkType: 'boosted_visibility'
    },
    {
      id: '3',
      icon: Star,
      title: 'Top of Category',
      description: 'Pin your store at the top of your category',
      price: 75,
      features: ['Always at top', 'Category dominance', 'Maximum exposure', 'Premium placement'],
      gradient: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      duration: '7 days',
      perkType: 'top_of_category'
    },
    {
      id: '4',
      icon: TrendingUp,
      title: 'Trending Placement',
      description: 'Feature your store in the Trending section',
      price: 85,
      features: ['Trending badge', 'Homepage feature', 'Hot seller status', 'Impulse buyer traffic'],
      gradient: 'from-rose-500 to-rose-600',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
      duration: '7 days',
      perkType: 'trending_placement'
    },
    {
      id: '5',
      icon: Sparkles,
      title: 'Product Highlights',
      description: 'Add glowing frames around your product listings',
      price: 55,
      features: ['Glowing product frames', 'Eye-catching design', 'Stand out from competition', 'All products highlighted'],
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      duration: '14 days',
      perkType: 'product_highlights'
    },
    {
      id: '6',
      icon: Crown,
      title: 'Premium Theme',
      description: 'Unlock exclusive premium store theme designs',
      price: 65,
      features: ['Premium UI theme', 'Luxury appearance', 'Custom colors', 'Professional look'],
      gradient: 'from-violet-500 to-violet-600',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      duration: '30 days',
      perkType: 'premium_theme'
    },
    {
      id: '7',
      icon: Megaphone,
      title: 'Featured Spotlight',
      description: 'Get featured as a pop-up banner across the marketplace',
      price: 100,
      features: ['Full-screen banner', 'Maximum visibility', 'Homepage takeover', 'Ultimate promotion'],
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      duration: '3 days',
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
      // Calculate expiry date
      const daysToAdd = selectedPerk.duration.includes('30') ? 30 : 
                       selectedPerk.duration.includes('14') ? 14 : 
                       selectedPerk.duration.includes('7') ? 7 : 3;
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

      {/* Perks Grid */}
      <div className="px-6 space-y-4">
        {perks.map((perk) => {
          const isActivated = activatedPerks.includes(perk.perkType);
          
          return (
            <Card 
              key={perk.id} 
              className={`overflow-hidden transition-all hover:shadow-lg ${
                isActivated ? 'border-2 border-primary' : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`h-12 w-12 rounded-xl ${perk.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <perk.icon className={`h-6 w-6 ${perk.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{perk.title}</CardTitle>
                        {isActivated && (
                          <Badge variant="default" className="bg-primary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{perk.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold bg-gradient-to-r ${perk.gradient} bg-clip-text text-transparent`}>
                      SLL {perk.price}
                    </p>
                    <p className="text-xs text-muted-foreground">{perk.duration}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {perk.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  className={`w-full bg-gradient-to-r ${perk.gradient} text-white hover:opacity-90`}
                  onClick={() => handlePurchaseClick(perk)}
                  disabled={!storeId || isActivated}
                >
                  {isActivated ? 'Already Active' : 'Purchase Now'}
                </Button>
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
