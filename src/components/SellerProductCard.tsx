import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, Trash2, Eye, Heart, Package, BarChart3, 
  Megaphone, Settings, Clock, AlertTriangle, X, 
  CheckCircle, TrendingUp, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  
  const allImages = images.length > 0 ? images : [image];
  const isPendingDeletion = !!scheduledDeletionAt;
  
  // Calculate remaining time for deletion
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
      
      setRemainingTime(`${hours}h ${minutes}m`);
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
        description: 'Product will be permanently deleted in 48 hours. It is now hidden from buyers.',
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
        title: 'Deletion Cancelled',
        description: 'Product has been restored and is now visible to buyers.',
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
          "group relative overflow-hidden transition-all duration-300 rounded-2xl",
          "hover:shadow-xl cursor-pointer",
          isPendingDeletion && "border-2 border-destructive/50 bg-destructive/5",
          hasVerifiedBadge && !isPendingDeletion && "border-2 border-primary/30 shadow-lg",
          !hasVerifiedBadge && !isPendingDeletion && "border border-border/50 shadow-sm hover:border-primary/30"
        )}
        onClick={() => navigate(`/product/${id}/manage`)}
      >
        {/* Pending Deletion Banner */}
        {isPendingDeletion && (
          <div className="absolute top-0 left-0 right-0 bg-destructive text-white text-[10px] font-bold py-1 px-2 flex items-center justify-center gap-1 z-10">
            <AlertTriangle className="h-3 w-3" />
            Pending Deletion — {remainingTime}
          </div>
        )}

        <CardContent className={cn("p-4", isPendingDeletion && "pt-8")}>
          <div className="flex gap-4">
            {/* Image */}
            <div className={cn(
              "w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative",
              isPendingDeletion && "opacity-50 grayscale"
            )}>
              <img
                src={allImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {hasVerifiedBadge && !isPendingDeletion && (
                <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">SKU: {productCode}</p>
                </div>
                
                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${id}/manage`);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${id}`);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Product
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate('/perks');
                    }}>
                      <Megaphone className="h-4 w-4 mr-2" />
                      Promote Product
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isPendingDeletion ? (
                      <DropdownMenuItem 
                        className="text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelDialog(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Deletion
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Product
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Price & Status */}
              <div className="flex items-center justify-between mt-2">
                <p className="text-lg font-bold text-primary">Le {price.toLocaleString()}</p>
                <Badge
                  variant={published && !isPendingDeletion ? 'default' : 'secondary'}
                  className={cn(
                    "rounded-full text-[10px]",
                    published && !isPendingDeletion ? "bg-emerald-500 text-white" : "",
                    isPendingDeletion && "bg-destructive/20 text-destructive"
                  )}
                >
                  {isPendingDeletion ? 'Pending Delete' : published ? 'Live' : 'Draft'}
                </Badge>
              </div>
              
              {/* Analytics Row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{viewsCount}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{savesCount}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span>{ordersCount}</span>
                </div>
                {ordersCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 ml-auto">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Selling</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Deletion Button */}
          {isPendingDeletion && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 rounded-full border-destructive text-destructive hover:bg-destructive hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelDialog(true);
              }}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancel Deletion
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Schedule Product Deletion?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This product will be hidden from buyers immediately and permanently deleted in <strong>48 hours</strong>. 
              You can cancel the deletion anytime before it's finalized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleScheduleDeletion}
              className="rounded-full bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Schedule Deletion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Deletion Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-center">Restore Product?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will cancel the scheduled deletion and restore your product. 
              It will be published and visible to buyers again.
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