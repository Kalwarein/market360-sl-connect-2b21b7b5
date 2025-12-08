import { 
  Eye, Edit, Megaphone, Trash2, X, Package, TrendingUp, 
  AlertTriangle, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    published: boolean;
    viewsCount?: number;
    savesCount?: number;
    ordersCount?: number;
    isPendingDeletion?: boolean;
    remainingTime?: string | null;
  };
  onViewProduct: () => void;
  onEditProduct: () => void;
  onPromoteProduct: () => void;
  onDeleteProduct: () => void;
  onCancelDeletion?: () => void;
}

export const ProductActionSheet = ({
  open,
  onOpenChange,
  product,
  onViewProduct,
  onEditProduct,
  onPromoteProduct,
  onDeleteProduct,
  onCancelDeletion,
}: ProductActionSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 pt-4">
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-base font-semibold line-clamp-2">
                {product.title}
              </SheetTitle>
              <p className="text-primary font-bold text-lg mt-1">
                Le {product.price.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={product.published && !product.isPendingDeletion ? 'default' : 'secondary'}
                  className={cn(
                    "text-[10px] rounded-full",
                    product.published && !product.isPendingDeletion && "bg-emerald-500 text-white",
                    product.isPendingDeletion && "bg-destructive/20 text-destructive"
                  )}
                >
                  {product.isPendingDeletion ? 'Pending Delete' : product.published ? 'Live' : 'Draft'}
                </Badge>
                {product.viewsCount !== undefined && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> {product.viewsCount}
                  </span>
                )}
                {product.ordersCount !== undefined && product.ordersCount > 0 && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> {product.ordersCount} sold
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-2 mt-4">
          {/* Pending Deletion Warning */}
          {product.isPendingDeletion && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Scheduled for deletion</span>
              </div>
              <p className="text-xs text-destructive/80 mt-1">
                {product.remainingTime || 'Will be permanently deleted soon'}
              </p>
            </div>
          )}

          {/* View Product */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 rounded-xl border-border/50 hover:bg-muted"
            onClick={() => {
              onViewProduct();
              onOpenChange(false);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">View Product</p>
              <p className="text-xs text-muted-foreground">See how buyers view this product</p>
            </div>
          </Button>

          {/* Edit Product */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 rounded-xl border-border/50 hover:bg-muted"
            onClick={() => {
              onEditProduct();
              onOpenChange(false);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Edit className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Edit Product</p>
              <p className="text-xs text-muted-foreground">Update details, price, images</p>
            </div>
          </Button>

          {/* Promote Product */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 rounded-xl border-border/50 hover:bg-muted"
            onClick={() => {
              onPromoteProduct();
              onOpenChange(false);
            }}
          >
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Promote Product</p>
              <p className="text-xs text-muted-foreground">Boost visibility with premium perks</p>
            </div>
          </Button>

          {/* Delete or Cancel Deletion */}
          {product.isPendingDeletion ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 rounded-xl border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
              onClick={() => {
                onCancelDeletion?.();
                onOpenChange(false);
              }}
            >
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-emerald-700">Cancel Deletion</p>
                <p className="text-xs text-emerald-600">Restore product and make it visible again</p>
              </div>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 rounded-xl border-destructive/30 hover:bg-destructive/5"
              onClick={() => {
                onDeleteProduct();
                onOpenChange(false);
              }}
            >
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-left">
                <p className="font-medium text-destructive">Delete Product</p>
                <p className="text-xs text-destructive/70">48-hour safety period before permanent deletion</p>
              </div>
            </Button>
          )}
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          className="w-full mt-4 h-12 rounded-xl text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      </SheetContent>
    </Sheet>
  );
};
