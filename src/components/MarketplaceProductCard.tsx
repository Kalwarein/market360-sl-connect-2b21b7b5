import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Package, Sparkles, Shield, Star, ShoppingCart } from 'lucide-react';
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
  'Top': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  'Hot Selling': 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
  'New': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
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

  const hasPremiumUI = hasProductHighlights || hasFeaturedSpotlight;

  // HIGHLIGHTED PRODUCT CARD (Premium UI from Product Highlights perk)
  if (hasPremiumUI) {
    return (
      <Card
        onClick={() => navigate(`/product/${id}`)}
        className={cn(
          "min-w-[160px] max-w-[180px] cursor-pointer overflow-hidden group rounded-3xl border-0",
          "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
          hasFeaturedSpotlight 
            ? "ring-[3px] ring-primary shadow-xl shadow-primary/20" 
            : "ring-2 ring-accent shadow-lg"
        )}
      >
        {/* Colored Background Image Container */}
        <div className={cn(
          "relative aspect-square overflow-hidden",
          hasFeaturedSpotlight 
            ? "bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" 
            : "bg-gradient-to-br from-accent/40 via-accent/20 to-muted"
        )}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
            }}
          />
          
          {/* Premium Badge - Top Right */}
          <div className={cn(
            "absolute top-2 right-2 rounded-full p-1.5 shadow-lg",
            hasFeaturedSpotlight 
              ? "bg-gradient-to-br from-primary to-accent" 
              : "bg-gradient-to-br from-accent to-primary"
          )}>
            {hasFeaturedSpotlight ? (
              <Star className="h-3.5 w-3.5 text-primary-foreground fill-current" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            )}
          </div>

          {/* Tag Badge - Top Left */}
          {tag && (
            <Badge className={cn("absolute top-2 left-2 shadow-lg text-[10px] font-bold px-2 py-0.5 border-0", tagStyles[tag])}>
              <span className="mr-1">{tagIcons[tag]}</span>
              {tag}
            </Badge>
          )}

          {/* Discount Badge - if no tag */}
          {(discount || discountPercent) && !tag && (
            <Badge className="absolute top-2 left-2 bg-destructive text-white shadow-lg text-[10px] font-bold border-0 px-2 py-0.5">
              {discount || `-${discountPercent}%`}
            </Badge>
          )}

          {/* Condition Badge - Bottom Left */}
          {condition && (
            <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] backdrop-blur-sm border-0 px-2 py-0.5">
              {condition === 'brand_new' ? 'Brand New' : condition.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3 bg-card space-y-2">
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
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 flex items-center gap-0.5 ml-auto">
                  <Shield className="h-2.5 w-2.5" />
                  Verified
                </Badge>
              )}
            </div>
          )}
          
          {/* Title */}
          <h3 className="text-sm font-bold line-clamp-2 min-h-[2.5rem] leading-snug text-foreground">
            {title}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-lg font-black",
              hasFeaturedSpotlight ? "text-primary" : "text-accent-foreground"
            )}>
              Le {price.toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] text-muted-foreground line-through">
                Le {originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
            <Star className="h-3 w-3 text-muted-foreground/30" />
          </div>
          
          {/* Add to Cart Button */}
          <Button
            className={cn(
              "w-full h-9 rounded-xl font-bold text-xs gap-1.5 mt-1",
              hasFeaturedSpotlight 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </Button>
        </div>
      </Card>
    );
  }

  // NORMAL PRODUCT CARD (Default styling - like reference image 1)
  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className="min-w-[160px] max-w-[180px] cursor-pointer overflow-hidden group rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Colored Header Strip */}
      <div className="bg-primary px-3 py-2">
        <h3 className="font-bold text-[11px] text-primary-foreground uppercase tracking-wide line-clamp-1">
          {title}
        </h3>
      </div>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-card">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
          }}
        />
        
        {/* Tag Badge - Top Left */}
        {tag && (
          <Badge className={cn("absolute top-2 left-2 shadow-lg text-[10px] font-bold px-2 py-0.5 border-0", tagStyles[tag])}>
            <span className="mr-1">{tagIcons[tag]}</span>
            {tag}
          </Badge>
        )}
        
        {/* Discount Badge - if no tag */}
        {(discount || discountPercent) && !tag && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white shadow-lg text-[10px] font-bold border-0 px-2 py-0.5">
            {discount || `-${discountPercent}%`}
          </Badge>
        )}

        {/* Verified Store Badge */}
        {hasVerifiedBadge && (
          <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold border-0 shadow-md flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" />
            Verified
          </Badge>
        )}

        {/* Condition Badge - Bottom Left */}
        {condition && (
          <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] backdrop-blur-sm border-0 px-2 py-0.5">
            {condition === 'brand_new' ? 'Brand New' : condition.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 bg-card space-y-2">
        {/* Price & Rating Row */}
        <div className="flex items-center justify-between">
          <span className="text-base font-black text-foreground">
            Le {price.toLocaleString()}
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            ))}
            <Star className="h-2.5 w-2.5 text-muted-foreground/30" />
          </div>
        </div>

        {originalPrice && originalPrice > price && (
          <span className="text-[10px] text-muted-foreground line-through block">
            Le {originalPrice.toLocaleString()}
          </span>
        )}

        {/* Store Info */}
        {storeName && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-3.5 h-3.5 rounded-full object-cover" />
            ) : (
              <Store className="h-3 w-3" />
            )}
            <span className="truncate font-medium">{storeName}</span>
          </div>
        )}
        
        {/* MOQ */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>MOQ: {moq}</span>
        </div>

        {/* Add to Cart Button */}
        <Button
          className="w-full h-9 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
};
