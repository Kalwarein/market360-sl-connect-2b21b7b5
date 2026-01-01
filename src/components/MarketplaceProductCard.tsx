import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Store, Package, Crown, Sparkles, Shield, Star } from 'lucide-react';
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
  const { 
    hasVerifiedBadge, 
    hasProductHighlights, 
    hasFeaturedSpotlight 
  } = useStorePerks(storeId || null);
  
  const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  
  const discountPercent = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : null;

  // Premium UI styling from Product Highlights perk
  const hasPremiumUI = hasProductHighlights || hasFeaturedSpotlight;

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "min-w-[160px] max-w-[180px] cursor-pointer overflow-hidden group rounded-2xl",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
        // Featured Spotlight - Maximum visibility styling
        hasFeaturedSpotlight && [
          "ring-2 ring-red-400/60 shadow-lg shadow-red-500/20",
          "bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/30"
        ],
        // Product Highlights - Premium UI styling (no visibility boost)
        hasPremiumUI && !hasFeaturedSpotlight && [
          "ring-2 ring-emerald-400/50 shadow-lg",
          "bg-gradient-to-b from-emerald-50/30 to-transparent dark:from-emerald-950/20"
        ],
        // Verified Badge - Just trust indicator, subtle styling
        hasVerifiedBadge && !hasPremiumUI && 'ring-1 ring-blue-300/40 shadow-md',
        // Default styling
        !hasVerifiedBadge && !hasPremiumUI && 'border border-border/60 shadow-sm hover:border-border'
      )}
    >
      {/* Featured Spotlight Banner */}
      {hasFeaturedSpotlight && (
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white text-[10px] font-bold py-1.5 px-3 flex items-center justify-center gap-1.5 animate-shimmer bg-[length:200%_100%]">
          <Crown className="h-3 w-3" />
          <span>FEATURED SPOTLIGHT</span>
          <Star className="h-3 w-3" />
        </div>
      )}

      {/* Image Container */}
      <div className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        hasFeaturedSpotlight && "ring-1 ring-inset ring-red-200/50",
        hasPremiumUI && !hasFeaturedSpotlight && "ring-1 ring-inset ring-emerald-200/30"
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
        
        {/* Premium overlay for Product Highlights */}
        {hasPremiumUI && !hasFeaturedSpotlight && (
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
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

        {/* Featured Spotlight Crown Badge - Top Right */}
        {hasFeaturedSpotlight && (
          <div className="absolute top-2 right-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-full p-1.5 shadow-lg shadow-red-500/40 animate-pulse">
            <Crown className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {/* Product Highlights Sparkle Badge - Top Right (if not featured) */}
        {hasPremiumUI && !hasFeaturedSpotlight && (
          <div className="absolute top-2 right-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full p-1.5 shadow-md">
            <Sparkles className="h-3 w-3 text-white" />
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
        hasFeaturedSpotlight && "bg-gradient-to-b from-red-50/30 to-transparent dark:from-red-950/20",
        hasPremiumUI && !hasFeaturedSpotlight && "bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10"
      )}>
        {/* Store Info with Verified Store Label */}
        {storeName && (
          <div className="flex items-center gap-1.5">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-4 h-4 rounded-full object-cover ring-1 ring-border" />
            ) : (
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-[11px] text-muted-foreground truncate font-medium">{storeName}</span>
            {/* VERIFIED STORE LABEL - Trust indicator */}
            {hasVerifiedBadge && (
              <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5" />
                Verified
              </Badge>
            )}
          </div>
        )}
        
        {/* Title - 2 lines with premium styling */}
        <h3 className={cn(
          "text-sm font-semibold line-clamp-2 min-h-[2.5rem] leading-snug",
          hasFeaturedSpotlight ? "text-red-900 dark:text-red-100" : "text-foreground",
          hasPremiumUI && !hasFeaturedSpotlight && "font-bold"
        )}>
          {title}
        </h3>

        {/* Price Section with premium styling */}
        <div className={cn(
          "rounded-lg py-1.5",
          hasFeaturedSpotlight && "bg-gradient-to-r from-red-100/80 to-orange-100/80 dark:from-red-900/30 dark:to-orange-900/30 px-2 -mx-1",
          hasPremiumUI && !hasFeaturedSpotlight && "bg-gradient-to-r from-emerald-100/60 to-green-100/60 dark:from-emerald-900/20 dark:to-green-900/20 px-2 -mx-1"
        )}>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-base font-bold",
              hasFeaturedSpotlight ? "text-red-700 dark:text-red-300" : 
              hasPremiumUI ? "text-emerald-700 dark:text-emerald-300" : 
              "text-primary"
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
          {isNew && !tag && !hasFeaturedSpotlight && (
            <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-0 px-1.5">
              ✨ New
            </Badge>
          )}
          
          {/* Featured indicator for spotlight */}
          {hasFeaturedSpotlight && (
            <Badge className="text-[9px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 px-1.5">
              <Star className="h-2.5 w-2.5 mr-0.5" />
              Featured
            </Badge>
          )}

          {/* Premium indicator for highlights */}
          {hasPremiumUI && !hasFeaturedSpotlight && (
            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 px-1.5">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              Premium
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
