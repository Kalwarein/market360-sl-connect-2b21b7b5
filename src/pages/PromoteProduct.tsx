import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, Sparkles, TrendingUp, Zap, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
} from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  is_promoted: boolean;
  promoted_until: string | null;
}

const PROMOTION_COST = 5; // 5 Leones
const PROMOTION_DAYS = 7; // 7 days promotion

const PromoteProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (productId && user) {
      loadData();
    }
  }, [productId, user]);

  const loadData = async () => {
    try {
      // Load product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, title, price, images, is_promoted, promoted_until')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Load wallet balance using RPC
      const { data: balance } = await supabase
        .rpc('get_wallet_balance', { p_user_id: user?.id });

      setWalletBalance(balance || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!product || !user) return;
    
    if (walletBalance < PROMOTION_COST) {
      toast({
        title: 'Insufficient Balance',
        description: `You need at least ${PROMOTION_COST} Leones to promote this product.`,
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      // Create wallet_ledger entry for promotion (debit)
      const { error: ledgerError } = await supabase
        .from('wallet_ledger')
        .insert({
          user_id: user.id,
          amount: PROMOTION_COST,
          transaction_type: 'payment',
          status: 'success',
          reference: `Product Promotion - ${product.title}`,
          metadata: {
            product_id: product.id,
            product_title: product.title,
            promotion_days: PROMOTION_DAYS
          }
        });

      if (ledgerError) throw ledgerError;

      // Calculate promotion end date
      const promotedUntil = new Date();
      promotedUntil.setDate(promotedUntil.getDate() + PROMOTION_DAYS);

      // Update product as promoted
      const { error: productError } = await supabase
        .from('products')
        .update({
          is_promoted: true,
          promoted_until: promotedUntil.toISOString(),
        })
        .eq('id', product.id);

      if (productError) throw productError;

      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
      setWalletBalance(prev => prev - PROMOTION_COST);
      setProduct(prev => prev ? { ...prev, is_promoted: true, promoted_until: promotedUntil.toISOString() } : null);
    } catch (error) {
      console.error('Error promoting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to promote product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const isAlreadyPromoted = product?.is_promoted && product?.promoted_until && new Date(product.promoted_until) > new Date();
  const canAfford = walletBalance >= PROMOTION_COST;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Product not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Promote Product</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Preview */}
        <Card className="overflow-hidden">
          <div className="flex gap-4 p-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              <img
                src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2">{product.title}</h3>
              <p className="text-lg font-bold text-primary mt-1">
                Le {product.price.toLocaleString()}
              </p>
              {isAlreadyPromoted && (
                <Badge className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Currently Promoted
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Wallet Balance */}
        <Card className={`${canAfford ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Wallet Balance</p>
              <p className={`text-2xl font-bold ${canAfford ? 'text-emerald-600' : 'text-red-600'}`}>
                Le {walletBalance.toLocaleString()}
              </p>
            </div>
            {!canAfford && (
              <Button size="sm" onClick={() => navigate('/deposit')}>
                Top Up
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Promotion Benefits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Promotion Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Premium Badge</p>
                <p className="text-sm text-muted-foreground">
                  Your product gets a special "PROMOTED" crown badge
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Top Placement</p>
                <p className="text-sm text-muted-foreground">
                  Promoted products appear first in search results and categories
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Special Card Design</p>
                <p className="text-sm text-muted-foreground">
                  Eye-catching golden border and premium styling
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-1">Product Promotion</h3>
            <p className="text-muted-foreground mb-4">{PROMOTION_DAYS} Days of Premium Visibility</p>
            <div className="text-4xl font-bold text-amber-600 mb-4">
              Le {PROMOTION_COST}
            </div>
            
            {isAlreadyPromoted ? (
              <div className="bg-white/80 rounded-xl p-4">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium text-emerald-700">This product is already promoted!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Promotion ends: {new Date(product.promoted_until!).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                onClick={() => setShowConfirmDialog(true)}
                disabled={!canAfford}
              >
                {canAfford ? (
                  <>
                    <Crown className="h-5 w-5 mr-2" />
                    Promote Now for Le {PROMOTION_COST}
                  </>
                ) : (
                  'Insufficient Balance'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <AlertDialogTitle className="text-center">Confirm Promotion</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You will be charged <strong>Le {PROMOTION_COST}</strong> from your wallet. 
              Your product will be promoted for <strong>{PROMOTION_DAYS} days</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full" disabled={processing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromote}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm & Pay'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-center">Product Promoted!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your product is now promoted and will appear at the top of search results 
              and category listings for the next {PROMOTION_DAYS} days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                navigate('/seller-dashboard');
              }}
              className="rounded-full w-full"
            >
              Back to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromoteProduct;