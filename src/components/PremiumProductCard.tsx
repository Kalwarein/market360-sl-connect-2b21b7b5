import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, MessageSquare, Store, CheckCircle, TrendingUp, 
  Sparkles, Zap, Eye, Heart, Package, Clock, AlertTriangle,
  Edit, Trash2, BarChart3, Settings, Megaphone, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ProductTag {
  label: string;
  emoji?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium';
}

interface PremiumProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  store_name?: string;
  store_id?: string;
  store_logo?: string;
  moq?: number;
  condition?: string;
  tags?: string[];
  enhancementTags?: string[];
  customLabels?: string[];
  perks?: Array<{ icon: string; label: string; color: string }>;
  published?: boolean;
  createdAt?: string;
  scheduledDeletionAt?: string | null;
  viewsCount?: number;
  savesCount?: number;
  ordersCount?: number;
  isSellerView?: boolean;
  onAddToCart?: () => void;
  onChat?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancelDeletion?: () => void;
  onPromote?: () => void;
}

const tagVariants = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  premium: 'bg-gradient-to-r from-primary to-accent text-white',
};

const getTagConfig = (tag: string): ProductTag => {
  const configs: Record<string, ProductTag> = {
    'Fast Shipping': { label: 'Fast Shipping', emoji: '🚚', variant: 'success' },
    'New Arrival': { label: 'New', emoji: '✨', variant: 'info' },
    'Top Deals': { label: 'Top Deal', emoji: '🔥', variant: 'warning' },
    'Hot Selling': { label: 'Hot', emoji: '⚡', variant: 'danger' },
    'Trending': { label: 'Trending', emoji: '📈', variant: 'warning' },
    'Limited Stock': { label: 'Limited', emoji: '⏰', variant: 'danger' },
    '50% OFF': { label: '50% OFF', emoji: '💰', variant: 'danger' },
    'Best Seller': { label: 'Best Seller', emoji: '⭐', variant: 'premium' },
    'Verified Seller': { label: 'Verified', emoji: '✅', variant: 'success' },
    'Premium': { label: 'Premium', emoji: '💎', variant: 'premium' },
    'Bulk': { label: 'Bulk', emoji: '📦', variant: 'info' },
    'Eco-Friendly': { label: 'Eco', emoji: '🌱', variant: 'success' },
    'Handmade': { label: 'Handmade', emoji: '🎨', variant: 'info' },
    'Local': { label: 'Local', emoji: '🏠', variant: 'success' },
    'Made in Sierra Leone': { label: 'Made in SL', emoji: '🇸🇱', variant: 'success' },
    'Luxury': { label: 'Luxury', emoji: '👑', variant: 'premium' },
  };
  return configs[tag] || { label: tag, variant: 'default' };
};

const getConditionBadge = (condition: string) => {
  const configs: Record<string, { label: string; variant: string }> = {
    'brand_new': { label: 'Brand New', variant: 'success' },
    'like_new': { label: 'Like New', variant: 'info' },
    'refurbished': { label: 'Refurbished', variant: 'warning' },
    'used_excellent': { label: 'Used - Excellent', variant: 'default' },
    'used_good': { label: 'Used - Good', variant: 'default' },
  };
  return configs[condition] || { label: condition, variant: 'default' };
};

export const PremiumProductCard = ({
  id,
  title,
  price,
  originalPrice,
  image,
  images = [],
  category,
  store_name,
  store_id,
  store_logo,
  moq = 1,
  condition,
  tags = [],
  enhancementTags = [],
  customLabels = [],
  perks = [],
  published = true,
  createdAt,
  scheduledDeletionAt,
  viewsCount = 0,
  savesCount = 0,
  ordersCount = 0,
  isSellerView = false,
  onAddToCart,
  onChat,
  onEdit,
  onDelete,
  onCancelDeletion,
  onPromote,
}: PremiumProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasVerifiedBadge, hasPremiumTheme } = useStorePerks(store_id || null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  
  const allImages = images.length > 0 ? images : [image];
  const isPendingDeletion = !!scheduledDeletionAt;
  
  // Check if product is new (within 7 days)
  const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  
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
      
      setRemainingTime(`${hours}h ${minutes}m remaining`);
    };
    
    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 60000);
    
    return () => clearInterval(interval);
  }, [scheduledDeletionAt]);
  
  // Collect all display tags
  const displayTags: ProductTag[] = [];
  
  if (isNew && !isSellerView) {
    displayTags.push({ label: 'New', emoji: '✨', variant: 'info' });
  }
  
  if (hasVerifiedBadge) {
    displayTags.push({ label: 'Verified', emoji: '✅', variant: 'success' });
  }
  
  // Add enhancement tags
  enhancementTags.forEach(tag => {
    displayTags.push(getTagConfig(tag));
  });
  
  // Add custom labels
  customLabels.slice(0, 2).forEach(label => {
    displayTags.push({ label, variant: 'default' });
  });
  
  // Add perks as tags
  perks.slice(0, 2).forEach(perk => {
    displayTags.push({ label: perk.label, variant: 'success' });
  });

  const handleCardClick = () => {
    if (isSellerView) {
      navigate(`/product/${id}/manage`);
    } else {
      navigate(`/product/${id}`);
    }
  };

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-500",
        "hover:shadow-2xl hover:-translate-y-1 animate-fade-in rounded-2xl",
        isPendingDeletion && "border-2 border-destructive/50 opacity-75",
        hasVerifiedBadge && !isPendingDeletion && "border-2 border-primary/30 shadow-xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5",
        !hasVerifiedBadge && !isPendingDeletion && "border border-border/50 shadow-lg hover:border-primary/30"
      )}
      onClick={handleCardClick}
    >
      {/* Premium Glow Effect */}
      {hasVerifiedBadge && !isPendingDeletion && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      {/* Pending Deletion Overlay */}
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-destructive/10 z-10 flex items-center justify-center">
          <div className="bg-destructive/90 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            Pending Deletion
          </div>
        </div>
      )}

      <CardContent className="p-0 relative">
        {/* Image Container with Smart Cropping */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50 rounded-t-2xl">
          <img
            src={allImages[currentImageIndex] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
            alt={title}
            className={cn(
              "object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out",
              isPendingDeletion && "grayscale"
            )}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
            }}
          />
          
          {/* Shine Effect on Hover */}
          {!isPendingDeletion && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
          
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Top Row - Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
            {/* Left Side - Condition & Discount */}
            <div className="flex flex-col gap-1">
              {condition && (
                <Badge className={cn(
                  "text-[10px] font-bold shadow-lg backdrop-blur-sm",
                  getConditionBadge(condition).variant === 'success' && "bg-emerald-500 text-white",
                  getConditionBadge(condition).variant === 'info' && "bg-blue-500 text-white",
                  getConditionBadge(condition).variant === 'warning' && "bg-amber-500 text-white",
                  getConditionBadge(condition).variant === 'default' && "bg-muted text-foreground"
                )}>
                  {getConditionBadge(condition).label}
                </Badge>
              )}
              {discount && discount > 0 && (
                <Badge className="bg-destructive text-white text-[10px] font-bold shadow-lg">
                  -{discount}% OFF
                </Badge>
              )}
            </div>
            
            {/* Right Side - Verified Badge */}
            {hasVerifiedBadge && !isPendingDeletion && (
              <div className="animate-bounce-slow">
                <div className="bg-gradient-to-br from-primary to-accent backdrop-blur-sm rounded-full p-1.5 shadow-2xl ring-2 ring-white/50">
                  <CheckCircle className="h-4 w-4 text-white fill-current" />
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Tags Row */}
          {displayTags.length > 0 && (
            <div className="absolute bottom-12 left-0 right-0 px-2">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {displayTags.slice(0, 4).map((tag, idx) => (
                  <Badge 
                    key={idx}
                    className={cn(
                      "text-[9px] font-semibold whitespace-nowrap flex-shrink-0 shadow-sm",
                      tagVariants[tag.variant || 'default']
                    )}
                  >
                    {tag.emoji && <span className="mr-0.5">{tag.emoji}</span>}
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions - Buyer View */}
          {!isSellerView && !isPendingDeletion && (
            <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-2xl backdrop-blur-md bg-white/90 hover:bg-white border border-border/50 hover:scale-110 transition-transform duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onChat?.();
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 hover:scale-110 transition-transform duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.();
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Seller Quick Actions */}
          {isSellerView && !isPendingDeletion && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 h-7 text-[10px] rounded-full backdrop-blur-md bg-white/90 hover:bg-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 h-7 text-[10px] rounded-full backdrop-blur-md bg-white/90 hover:bg-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onPromote?.();
                }}
              >
                <Megaphone className="h-3 w-3 mr-1" />
                Promote
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 w-7 rounded-full backdrop-blur-md bg-white/90 hover:bg-destructive hover:text-white shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Cancel Deletion Button */}
          {isPendingDeletion && (
            <div className="absolute bottom-2 left-2 right-2 z-20">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs rounded-full bg-white hover:bg-white shadow-lg border-destructive text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelDeletion?.();
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel Deletion ({remainingTime})
              </Button>
            </div>
          )}

          {/* Image Dots Indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2 bg-card rounded-b-2xl">
          {/* Store Info */}
          {store_name && (
            <div className="flex items-center gap-1.5">
              {store_logo ? (
                <img src={store_logo} alt={store_name} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-[11px] text-muted-foreground truncate font-medium">{store_name}</span>
              {hasVerifiedBadge && (
                <CheckCircle className="h-3 w-3 text-primary fill-primary flex-shrink-0" />
              )}
            </div>
          )}
          
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.25rem] group-hover:text-primary transition-colors duration-300 leading-tight">
            {title}
          </h3>

          {/* Price & MOQ */}
          <div className="flex items-end justify-between">
            <div>
              <p className={cn(
                "text-lg font-black",
                hasVerifiedBadge ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" : "text-primary"
              )}>
                Le {price.toLocaleString()}
              </p>
              {originalPrice && originalPrice > price && (
                <p className="text-xs text-muted-foreground line-through">
                  Le {originalPrice.toLocaleString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">
                MOQ: {moq} pc{moq > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Seller Analytics Preview */}
          {isSellerView && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {viewsCount}
                </span>
                <span className="flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />
                  {savesCount}
                </span>
                <span className="flex items-center gap-0.5">
                  <Package className="h-3 w-3" />
                  {ordersCount}
                </span>
              </div>
              <Badge 
                variant={published ? 'default' : 'secondary'}
                className={cn(
                  "text-[9px] rounded-full",
                  published ? "bg-emerald-500 text-white" : "bg-muted"
                )}
              >
                {published ? 'Live' : 'Draft'}
              </Badge>
            </div>
          )}

          {/* Status Icons - Buyer View */}
          {!isSellerView && (
            <div className="flex items-center gap-2 pt-1">
              {hasVerifiedBadge && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Fast Shipping
                </span>
              )}
              {isNew && (
                <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                  <Sparkles className="h-3 w-3" />
                  New
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Premium Store Indicator (Bottom Border) */}
      {hasVerifiedBadge && !isPendingDeletion && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x" />
      )}
    </Card>
  );
};