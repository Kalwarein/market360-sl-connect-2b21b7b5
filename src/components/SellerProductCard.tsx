import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Heart, Package, AlertTriangle, CheckCircle, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';
import { cn } from '@/lib/utils';
import { ProductActionSheet } from '@/components/ProductActionSheet';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SellerProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  images?: string[];
  productCode: string;
  storeId?: string;
  published: boolean;
  scheduledDeletionAt?: string | null;
  viewsCount?: number;
  savesCount?: number;
  ordersCount?: number;
  createdAt?: string;
  onRefresh?: () => void;
}

export const SellerProductCard = ({
  id,
  title,
  price,
  image,
  images = [],
  productCode,
  storeId,
  published,
  scheduledDeletionAt,
  viewsCount = 0,
  savesCount = 0,
  ordersCount = 0,
  createdAt,
  onRefresh,
}: SellerProductCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasVerifiedBadge } = useStorePerks(storeId || null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  
  const isPendingDeletion = !!scheduledDeletionAt;
  
  useEffect(() => {
    if (!scheduledDeletionAt) {
      setRemainingTime(null);
      return;
    }
    
    const updateRemainingTime = () => {
      const now = new Date().getTime();
      const deletionTime = new Date(scheduledDeletionAt).getTime();
      const diff = deletionTime - now;
      
      if (diff <= 0) {
        setRemainingTime('Deleting...');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemainingTime(`${hours}h ${minutes}m remaining`);
    };
    
    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000);
    return () => clearInterval(interval);
  }, [scheduledDeletionAt]);

  const handleScheduleDeletion = async () => {
    setIsProcessing(true);
    try {
      const deletionTime = new Date();
      deletionTime.setHours(deletionTime.getHours() + 48);
      
      const { error } = await supabase
        .from('products')
        .update({ 
          scheduled_deletion_at: deletionTime.toISOString(),
          published: false
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Deletion Scheduled',
        description: 'Product will be permanently deleted in 48 hours.',
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error scheduling deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule deletion',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          scheduled_deletion_at: null,
          published: true
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Product Restored',
        description: 'Product is now visible to buyers again.',
      });
      
      onRefresh?.();
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel deletion',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-300 rounded-2xl",
          "hover:shadow-lg active:scale-[0.98]",
          isPendingDeletion && "ring-2 ring-destructive/40 opacity-80",
          hasVerifiedBadge && !isPendingDeletion && "ring-2 ring-primary/20 shadow-md",
          !hasVerifiedBadge && !isPendingDeletion && "border border-border/50 shadow-sm"
        )}
        onClick={() => setShowActionSheet(true)}
      >
        {/* Pending Deletion Banner */}
        {isPendingDeletion && (
          <div className="bg-destructive text-white text-[10px] font-bold py-1.5 px-3 flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Pending Deletion — {remainingTime}
          </div>
        )}

        <div className="flex gap-3 p-3">
          {/* Product Image */}
          <div className={cn(
            "w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative",
            isPendingDeletion && "opacity-60 grayscale"
          )}>
            <img
              src={image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {hasVerifiedBadge && !isPendingDeletion && (
              <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5 shadow">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                {title}
              </h3>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[9px] rounded-full flex-shrink-0 px-2",
                  published && !isPendingDeletion && "bg-emerald-100 text-emerald-700",
                  !published && !isPendingDeletion && "bg-muted text-muted-foreground",
                  isPendingDeletion && "bg-destructive/10 text-destructive"
                )}
              >
                {isPendingDeletion ? 'Deleting' : published ? 'Live' : 'Draft'}
              </Badge>
            </div>
            
            <p className="text-[10px] text-muted-foreground">SKU: {productCode}</p>
            
            <p className="text-base font-bold text-primary">Le {price.toLocaleString()}</p>
            
            {/* Analytics Row */}
            <div className="flex items-center gap-3 pt-1.5 border-t border-border/40">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{viewsCount}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Heart className="h-3 w-3" />
                <span>{savesCount}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>{ordersCount}</span>
              </div>
              {ordersCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 ml-auto">
                  <TrendingUp className="h-3 w-3" />
                  <span>Selling</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Sheet Modal */}
      <ProductActionSheet
        open={showActionSheet}
        onOpenChange={setShowActionSheet}
        product={{
          id,
          title,
          price,
          image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
          published,
          viewsCount,
          savesCount,
          ordersCount,
          isPendingDeletion,
          remainingTime,
        }}
        onViewProduct={() => navigate(`/product/${id}?view=preview`)}
        onEditProduct={() => navigate(`/product-management/${id}`)}
        onPromoteProduct={() => navigate(`/promote-product?productId=${id}`)}
        onDeleteProduct={() => setShowDeleteDialog(true)}
        onCancelDeletion={() => setShowCancelDialog(true)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This product will be hidden immediately and permanently deleted in <strong>48 hours</strong>. 
              You can cancel anytime before then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleScheduleDeletion}
              className="rounded-full bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Deletion Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-center">Restore Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will cancel the scheduled deletion. Your product will be published and visible to buyers again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full">Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelDeletion}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Restore Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};