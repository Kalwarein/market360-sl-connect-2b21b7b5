import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Store, Package, Crown, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useStorePerks } from '@/hooks/useStorePerks';
import { cn } from '@/lib/utils';

interface MarketplaceProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  moq?: number;
  tag?: 'Top' | 'Hot Selling' | 'New';
  discount?: string;
  storeId?: string;
  storeName?: string;
  storeLogo?: string;
  condition?: string;
  enhancementTags?: string[];
  createdAt?: string;
  isPromoted?: boolean;
  promotedUntil?: string | null;
}

const tagStyles = {
  'Top': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30',
  'Hot Selling': 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/30',
  'New': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30',
};

const tagIcons = {
  'Top': '⭐',
  'Hot Selling': '🔥',
  'New': '✨',
};

export const MarketplaceProductCard = ({
  id,
  title,
  price,
  originalPrice,
  image,
  moq = 1,
  tag,
  discount,
  storeId,
  storeName,
  storeLogo,
  condition,
  enhancementTags = [],
  createdAt,
  isPromoted = false,
  promotedUntil,
}: MarketplaceProductCardProps) => {
  const navigate = useNavigate();
  const { hasVerifiedBadge } = useStorePerks(storeId || null);
  
  const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  
  const discountPercent = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : null;

  // Check if promotion is still active
  const isActivelyPromoted = isPromoted && promotedUntil && new Date(promotedUntil) > new Date();

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "min-w-[160px] max-w-[180px] cursor-pointer overflow-hidden group rounded-2xl",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
        // Promoted product styling
        isActivelyPromoted && [
          "ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20",
          "bg-gradient-to-b from-amber-50/50 to-transparent"
        ],
        // Verified seller styling
        hasVerifiedBadge && !isActivelyPromoted && 'ring-1 ring-primary/30 shadow-md',
        // Default styling
        !hasVerifiedBadge && !isActivelyPromoted && 'border border-border/60 shadow-sm hover:border-border'
      )}
    >
      {/* Promoted Banner */}
      {isActivelyPromoted && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-[10px] font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 animate-shimmer bg-[length:200%_100%]">
          <Crown className="h-3 w-3" />
          <span>PROMOTED</span>
          <Sparkles className="h-3 w-3" />
        </div>
      )}

      {/* Image Container */}
      <div className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        isActivelyPromoted && "ring-1 ring-inset ring-amber-200/50"
      )}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
          }}
        />
        
        {/* Gradient overlay for promoted */}
        {isActivelyPromoted && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
        )}
        
        {/* Tag Badge - Top Left */}
        {tag && (
          <Badge
            className={cn(
              "absolute top-2 left-2 shadow-lg text-[10px] font-bold px-2.5 py-1 border-0",
              tagStyles[tag]
            )}
          >
            <span className="mr-1">{tagIcons[tag]}</span>
            {tag}
          </Badge>
        )}
        
        {/* Discount Badge - if no tag */}
        {(discount || discountPercent) && !tag && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white shadow-lg text-[10px] font-bold border-0 px-2.5 py-1">
            {discount || `-${discountPercent}%`}
          </Badge>
        )}

        {/* Promoted Crown Badge - Top Right */}
        {isActivelyPromoted && (
          <div className="absolute top-2 right-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1.5 shadow-lg shadow-amber-500/40 animate-pulse">
            <Crown className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {/* Verified Badge - Top Right (if not promoted) */}
        {hasVerifiedBadge && !isActivelyPromoted && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-1.5 shadow-md">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Condition Badge - Bottom Left */}
        {condition && (
          <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] backdrop-blur-sm border-0 px-2 py-0.5">
            {condition === 'brand_new' ? 'Brand New' : condition.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "p-3 space-y-2",
        isActivelyPromoted && "bg-gradient-to-b from-amber-50/30 to-transparent"
      )}>
        {/* Store Info */}
        {storeName && (
          <div className="flex items-center gap-1.5">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-4 h-4 rounded-full object-cover ring-1 ring-border" />
            ) : (
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-[11px] text-muted-foreground truncate font-medium">{storeName}</span>
            {hasVerifiedBadge && (
              <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </div>
        )}
        
        {/* Title - 2 lines */}
        <h3 className={cn(
          "text-sm font-semibold line-clamp-2 min-h-[2.5rem] leading-snug",
          isActivelyPromoted ? "text-amber-900" : "text-foreground"
        )}>
          {title}
        </h3>

        {/* Price Section */}
        <div className={cn(
          "rounded-lg py-1.5",
          isActivelyPromoted && "bg-gradient-to-r from-amber-100/80 to-orange-100/80 px-2 -mx-1"
        )}>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-base font-bold",
              isActivelyPromoted ? "text-amber-700" : "text-primary"
            )}>
              Le {price.toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] text-muted-foreground line-through">
                Le {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        {/* MOQ & Tags */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>MOQ: {moq}</span>
          </div>
          
          {/* New Arrival indicator */}
          {isNew && !tag && !isActivelyPromoted && (
            <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-600 border-0 px-1.5">
              ✨ New
            </Badge>
          )}
          
          {/* Trending indicator for promoted */}
          {isActivelyPromoted && (
            <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 px-1.5">
              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
              Featured
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};