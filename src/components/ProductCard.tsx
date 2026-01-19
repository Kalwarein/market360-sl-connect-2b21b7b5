import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Store, Shield, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';
import { cn } from '@/lib/utils';
import { formatSLE } from '@/lib/currency';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  store_name?: string;
  store_id?: string;
  onAddToCart?: () => void;
  onChat?: () => void;
}

export const ProductCard = ({
  id,
  title,
  price,
  image,
  category,
  store_name,
  store_id,
  onAddToCart,
  onChat,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { 
    hasVerifiedBadge, 
    hasProductHighlights, 
    hasFeaturedSpotlight 
  } = useStorePerks(store_id || null);

  const hasPremiumUI = hasProductHighlights || hasFeaturedSpotlight;

  // HIGHLIGHTED PRODUCT CARD (Premium UI from Product Highlights perk)
  if (hasPremiumUI) {
    return (
      <Card 
        className={cn(
          "group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 rounded-3xl border-0",
          hasFeaturedSpotlight 
            ? "ring-[3px] ring-primary shadow-xl shadow-primary/20" 
            : "ring-2 ring-accent shadow-lg"
        )}
        onClick={() => navigate(`/product/${id}`)}
      >
        {/* Colored Background Image Container */}
        <div className={cn(
          "relative aspect-[4/3] overflow-hidden",
          hasFeaturedSpotlight 
            ? "bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" 
            : "bg-gradient-to-br from-accent/40 via-accent/20 to-muted"
        )}>
          <img
            src={image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
            alt={title}
            className="object-contain w-full h-full p-4 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          
          {/* Premium Badge */}
          <div className={cn(
            "absolute top-3 right-3 rounded-full p-2 shadow-lg",
            hasFeaturedSpotlight 
              ? "bg-gradient-to-br from-primary to-accent" 
              : "bg-gradient-to-br from-accent to-primary"
          )}>
            {hasFeaturedSpotlight ? (
              <Star className="h-4 w-4 text-primary-foreground fill-current" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            )}
          </div>

          {/* Featured Spotlight Label */}
          {hasFeaturedSpotlight && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold shadow-lg border-0">
              ⭐ Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-5 bg-card space-y-4">
          {/* Title */}
          <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] text-foreground leading-snug">
            {title}
          </h3>

          {/* Category */}
          <p className="text-sm text-muted-foreground">{category}</p>

          {/* Price & Rating Row */}
          <div className="flex items-center justify-between">
            <p className={cn(
              "text-2xl font-black",
              hasFeaturedSpotlight 
                ? "text-primary" 
                : "text-accent-foreground"
            )}>
              {formatSLE(price)}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <Star className="h-4 w-4 text-muted-foreground/30" />
            </div>
          </div>

          {/* Store Info */}
          {store_name && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium truncate">{store_name}</span>
              {hasVerifiedBadge && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 flex items-center gap-1 ml-auto">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          )}

          {/* Add to Cart Button - Full Width */}
          <Button
            className={cn(
              "w-full h-12 rounded-xl font-bold text-base gap-2 transition-all duration-300",
              hasFeaturedSpotlight 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </Card>
    );
  }

  // NORMAL PRODUCT CARD (Default styling - like reference image 1)
  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl border border-border/50 bg-card"
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Colored Header Strip */}
      <div className="bg-primary px-4 py-3">
        <h3 className="font-bold text-sm text-primary-foreground uppercase tracking-wide line-clamp-1">
          {title}
        </h3>
        <p className="text-[11px] text-primary-foreground/70 line-clamp-1 mt-0.5">
          {category}
        </p>
      </div>

      {/* Image Container - Clean white/card background */}
      <div className="relative aspect-square overflow-hidden bg-card">
        <img
          src={image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
          alt={title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Verified Store Badge */}
        {hasVerifiedBadge && (
          <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold border-0 shadow-md flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Verified Store
          </Badge>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 bg-card space-y-3">
        {/* Price & Rating Row */}
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-foreground">
            {formatSLE(price)}
          </p>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            ))}
            <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
        </div>

        {/* Store Info */}
        {store_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            <span className="truncate font-medium">{store_name}</span>
          </div>
        )}

        {/* Add to Cart Button - Full Width, Accent Color */}
        <Button
          className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-sm gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.();
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
};
