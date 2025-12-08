import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Store, Zap, TrendingUp, Sparkles, Package } from 'lucide-react';
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
}

const tagStyles = {
  'Top': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  'Hot Selling': 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
  'New': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
};

const tagEmojis = {
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
}: MarketplaceProductCardProps) => {
  const navigate = useNavigate();
  const { hasVerifiedBadge, hasPremiumTheme } = useStorePerks(storeId || null);
  
  // Check if product is new (within 7 days)
  const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  
  const discountPercent = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : null;

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "min-w-[160px] max-w-[200px] cursor-pointer transition-all duration-500 overflow-hidden group rounded-2xl",
        "hover:shadow-2xl hover:-translate-y-1",
        hasVerifiedBadge 
          ? 'border-2 border-primary/30 shadow-xl bg-gradient-to-br from-primary/5 to-transparent' 
          : 'border-border/50 shadow-lg hover:border-primary/30'
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
          }}
        />
        
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Verified Badge */}
        {hasVerifiedBadge && (
          <div className="absolute top-2 right-2 z-10 animate-bounce-slow">
            <div className="bg-gradient-to-br from-primary to-accent backdrop-blur-sm rounded-full p-1.5 shadow-xl ring-2 ring-white/50">
              <CheckCircle className="h-4 w-4 text-white fill-current" />
            </div>
          </div>
        )}

        {/* Tag Badge */}
        {tag && (
          <Badge
            className={cn(
              "absolute top-2 left-2 shadow-lg text-[10px] font-bold",
              tagStyles[tag]
            )}
          >
            <span className="mr-0.5">{tagEmojis[tag]}</span>
            {tag}
          </Badge>
        )}
        
        {/* Discount Badge */}
        {(discount || discountPercent) && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white shadow-lg text-[10px] font-bold">
            💰 {discount || `-${discountPercent}%`}
          </Badge>
        )}

        {/* Condition Badge */}
        {condition && (
          <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] backdrop-blur-sm">
            {condition === 'brand_new' ? 'Brand New' : condition.replace('_', ' ')}
          </Badge>
        )}

        {/* Enhancement Tags */}
        {enhancementTags.length > 0 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {enhancementTags.slice(0, 2).map((tag, idx) => (
              <Badge 
                key={idx}
                className="bg-white/90 text-foreground text-[8px] backdrop-blur-sm shadow-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 bg-card">
        {/* Store Name with Verified Badge */}
        {storeName && (
          <div className="flex items-center gap-1.5">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <p className="text-[11px] text-muted-foreground truncate font-medium flex items-center gap-1">
              {storeName}
              {hasVerifiedBadge && (
                <CheckCircle className="h-3 w-3 text-primary fill-primary inline" />
              )}
            </p>
          </div>
        )}
        
        {/* Title */}
        <h3 className={cn(
          "text-sm font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors",
          storeName ? 'min-h-[32px]' : 'min-h-[40px]'
        )}>
          {title}
        </h3>

        {/* Price & MOQ */}
        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <p className={cn(
              "text-lg font-black",
              hasVerifiedBadge ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" : "text-primary"
            )}>
              Le {price.toLocaleString()}
            </p>
            {originalPrice && originalPrice > price && (
              <p className="text-xs text-muted-foreground line-through mb-0.5">
                Le {originalPrice.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              MOQ: {moq} pc{moq > 1 ? 's' : ''}
            </p>
            {hasVerifiedBadge && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <Zap className="h-3 w-3" />
                Fast
              </span>
            )}
          </div>
        </div>

        {/* New Badge Indicator */}
        {isNew && !tag && (
          <div className="flex items-center gap-1 text-[10px] text-blue-500">
            <Sparkles className="h-3 w-3" />
            <span>New Arrival</span>
          </div>
        )}
      </div>

      {/* Premium Store Indicator */}
      {hasVerifiedBadge && (
        <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x" />
      )}
    </Card>
  );
};