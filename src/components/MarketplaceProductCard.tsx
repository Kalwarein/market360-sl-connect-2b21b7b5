import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Store, Package } from 'lucide-react';
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
}: MarketplaceProductCardProps) => {
  const navigate = useNavigate();
  const { hasVerifiedBadge } = useStorePerks(storeId || null);
  
  const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  
  const discountPercent = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : null;

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "min-w-[140px] max-w-[180px] cursor-pointer overflow-hidden group rounded-xl",
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]",
        hasVerifiedBadge 
          ? 'ring-1 ring-primary/30 shadow-md' 
          : 'border border-border/50 shadow-sm'
      )}
    >
      {/* Image Container - Square aspect ratio, object-cover */}
      <div className="relative aspect-square overflow-hidden bg-muted">
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
          <Badge
            className={cn(
              "absolute top-2 left-2 shadow-md text-[10px] font-bold px-2 py-0.5 border-0",
              tagStyles[tag]
            )}
          >
            <span className="mr-0.5">{tagIcons[tag]}</span>
            {tag}
          </Badge>
        )}
        
        {/* Discount Badge - if no tag */}
        {(discount || discountPercent) && !tag && (
          <Badge className="absolute top-2 left-2 bg-destructive text-white shadow-md text-[10px] font-bold border-0">
            {discount || `-${discountPercent}%`}
          </Badge>
        )}

        {/* Verified Badge - Top Right */}
        {hasVerifiedBadge && (
          <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-md">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Condition Badge - Bottom Left */}
        {condition && (
          <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] backdrop-blur-sm border-0">
            {condition === 'brand_new' ? 'New' : condition.replace('_', ' ')}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5 bg-card">
        {/* Store Info */}
        {storeName && (
          <div className="flex items-center gap-1">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-3.5 h-3.5 rounded-full object-cover" />
            ) : (
              <Store className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground truncate">{storeName}</span>
            {hasVerifiedBadge && (
              <CheckCircle className="h-2.5 w-2.5 text-primary flex-shrink-0" />
            )}
          </div>
        )}
        
        {/* Title - 2 lines */}
        <h3 className="text-xs font-semibold line-clamp-2 min-h-[2rem] leading-tight text-foreground">
          {title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-primary">
            Le {price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-[9px] text-muted-foreground line-through">
              Le {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        
        {/* MOQ */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>MOQ: {moq}</span>
        </div>

        {/* New Arrival indicator */}
        {isNew && !tag && (
          <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-600 border-0">
            ✨ New Arrival
          </Badge>
        )}
      </div>
    </Card>
  );
};