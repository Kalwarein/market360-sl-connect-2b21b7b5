import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Store, Zap, Sparkles, Package, Truck, Flame, Star, Clock } from 'lucide-react';
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

const tagConfig = {
  'Top': { 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500', 
    icon: Star,
    label: 'Top'
  },
  'Hot Selling': { 
    bg: 'bg-gradient-to-r from-red-500 to-pink-500', 
    icon: Flame,
    label: 'Hot'
  },
  'New': { 
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
    icon: Sparkles,
    label: 'New'
  },
};

const enhancementConfig: Record<string, { emoji: string; color: string }> = {
  'Fast Shipping': { emoji: '🚚', color: 'bg-emerald-100 text-emerald-700' },
  'Trending': { emoji: '📈', color: 'bg-amber-100 text-amber-700' },
  'Best Seller': { emoji: '⭐', color: 'bg-yellow-100 text-yellow-700' },
  'Limited Stock': { emoji: '⏰', color: 'bg-red-100 text-red-700' },
  'Eco-Friendly': { emoji: '🌱', color: 'bg-green-100 text-green-700' },
  'Handmade': { emoji: '🎨', color: 'bg-purple-100 text-purple-700' },
  'Local': { emoji: '🏠', color: 'bg-blue-100 text-blue-700' },
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

  const conditionLabel = condition === 'brand_new' ? 'New' : 
    condition === 'like_new' ? 'Like New' :
    condition === 'refurbished' ? 'Refurb' :
    condition?.replace('_', ' ') || null;

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className={cn(
        "w-full cursor-pointer overflow-hidden group rounded-2xl transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]",
        hasVerifiedBadge 
          ? 'ring-2 ring-primary/20 shadow-lg shadow-primary/10' 
          : 'border border-border/40 shadow-md hover:shadow-lg'
      )}
    >
      {/* Image Container - Perfect fit with no gaps */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
          }}
        />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Left - Tag Badge */}
        {tag && (
          <div className="absolute top-2 left-2">
            <Badge className={cn(
              "text-[10px] font-bold text-white shadow-lg border-0 px-2 py-0.5",
              tagConfig[tag].bg
            )}>
              <span className="flex items-center gap-1">
                {(() => {
                  const Icon = tagConfig[tag].icon;
                  return <Icon className="h-3 w-3" />;
                })()}
                {tagConfig[tag].label}
              </span>
            </Badge>
          </div>
        )}
        
        {/* Top Right - Verified Badge */}
        {hasVerifiedBadge && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary rounded-full p-1 shadow-lg ring-2 ring-white/80">
              <CheckCircle className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )}
        
        {/* Discount Badge */}
        {(discount || discountPercent) && !tag && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-destructive text-white text-[10px] font-bold shadow-lg border-0">
              {discount || `-${discountPercent}%`}
            </Badge>
          </div>
        )}

        {/* Bottom - Condition Badge */}
        {conditionLabel && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/60 text-white text-[9px] backdrop-blur-sm border-0 px-2">
              {conditionLabel}
            </Badge>
          </div>
        )}

        {/* Enhancement Tags - Horizontal scroll */}
        {enhancementTags.length > 0 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {enhancementTags.slice(0, 2).map((tag, idx) => {
              const config = enhancementConfig[tag] || { emoji: '✨', color: 'bg-gray-100 text-gray-700' };
              return (
                <Badge 
                  key={idx}
                  className={cn(
                    "text-[8px] backdrop-blur-sm shadow-sm border-0 px-1.5",
                    config.color
                  )}
                >
                  {config.emoji}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2 bg-card">
        {/* Store Info */}
        {storeName && (
          <div className="flex items-center gap-1.5">
            {storeLogo ? (
              <img 
                src={storeLogo} 
                alt={storeName} 
                className="w-4 h-4 rounded-full object-cover ring-1 ring-border/50" 
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                <Store className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            )}
            <span className="text-[10px] text-muted-foreground truncate flex-1 font-medium">
              {storeName}
            </span>
            {hasVerifiedBadge && (
              <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
            )}
          </div>
        )}
        
        {/* Title - 2 lines max */}
        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] leading-tight text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Price Section */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-lg font-black tracking-tight",
              hasVerifiedBadge 
                ? "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" 
                : "text-primary"
            )}>
              Le {price.toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] text-muted-foreground line-through">
                Le {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* MOQ & Fast Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              MOQ: {moq}
            </span>
            {hasVerifiedBadge && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                <Zap className="h-3 w-3" />
                Fast
              </span>
            )}
          </div>
        </div>

        {/* New Arrival indicator for recent products */}
        {isNew && !tag && (
          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
            <Sparkles className="h-3 w-3" />
            <span>Just Added</span>
          </div>
        )}
      </div>

      {/* Premium indicator line */}
      {hasVerifiedBadge && (
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary" />
      )}
    </Card>
  );
};