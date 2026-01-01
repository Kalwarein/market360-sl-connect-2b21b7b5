import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageSquare, Store, Shield, Sparkles, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';
import { cn } from '@/lib/utils';

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

  // Premium UI styling from Product Highlights or Featured Spotlight
  const hasPremiumUI = hasProductHighlights || hasFeaturedSpotlight;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in",
        // Featured Spotlight - Maximum visibility
        hasFeaturedSpotlight && [
          "border-2 border-red-400/50 shadow-xl",
          "bg-gradient-to-br from-red-50/50 via-orange-50/30 to-transparent dark:from-red-950/30 dark:via-orange-950/20"
        ],
        // Product Highlights - Premium UI styling
        hasPremiumUI && !hasFeaturedSpotlight && [
          "border-2 border-emerald-400/40 shadow-xl",
          "bg-gradient-to-br from-emerald-50/40 via-green-50/20 to-transparent dark:from-emerald-950/30 dark:via-green-950/20"
        ],
        // Verified Badge - Subtle trust indicator
        hasVerifiedBadge && !hasPremiumUI && 'border border-blue-300/40 shadow-lg',
        // Default styling
        !hasVerifiedBadge && !hasPremiumUI && 'border border-border hover:border-primary/30 shadow-lg'
      )}
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Featured Spotlight Glow Effect */}
      {hasFeaturedSpotlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      {/* Premium Glow Effect */}
      {hasPremiumUI && !hasFeaturedSpotlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <CardContent className="p-0 relative">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <img
            src={image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          
          {/* Shine Effect on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Featured Spotlight Badge */}
          {hasFeaturedSpotlight && (
            <div className="absolute top-2 right-2 z-10 animate-bounce-slow">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 backdrop-blur-sm rounded-full p-2 shadow-2xl ring-2 ring-white/50">
                <Crown className="h-5 w-5 text-white fill-current" />
              </div>
            </div>
          )}

          {/* Product Highlights Badge */}
          {hasPremiumUI && !hasFeaturedSpotlight && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-gradient-to-br from-emerald-500 to-green-500 backdrop-blur-sm rounded-full p-2 shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          
          {/* Category Badge with Premium Style */}
          <Badge 
            className={cn(
              "absolute top-2 left-2 shadow-lg backdrop-blur-md border-0 font-bold transition-all duration-300 group-hover:scale-110",
              hasFeaturedSpotlight 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                : hasPremiumUI 
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                : 'bg-primary/90 text-primary-foreground'
            )}
          >
            {hasFeaturedSpotlight && <Star className="h-3 w-3 mr-1" />}
            {hasPremiumUI && !hasFeaturedSpotlight && <Sparkles className="h-3 w-3 mr-1" />}
            {category}
          </Badge>

          {/* Quick Actions */}
          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full shadow-2xl backdrop-blur-md bg-white/90 hover:bg-white border border-border/50 hover:scale-110 transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onChat?.();
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 hover:scale-110 transition-transform duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.();
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "p-4 space-y-3 bg-card",
          hasFeaturedSpotlight && "bg-gradient-to-b from-red-50/30 to-card dark:from-red-950/20",
          hasPremiumUI && !hasFeaturedSpotlight && "bg-gradient-to-b from-emerald-50/20 to-card dark:from-emerald-950/10"
        )}>
          <h3 className={cn(
            "font-bold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors duration-300",
            hasFeaturedSpotlight && "text-red-900 dark:text-red-100",
            hasPremiumUI && !hasFeaturedSpotlight && "font-extrabold"
          )}>
            {title}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "text-xl font-black",
                hasFeaturedSpotlight 
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent' 
                  : hasPremiumUI 
                  ? 'bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent'
                  : 'text-primary'
              )}>
                Le {price.toLocaleString()}
              </p>
            </div>
          </div>

          {store_name && (
            <div className="flex items-center gap-2 text-xs pt-2 border-t border-border/50">
              <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground font-medium">{store_name}</span>
              {/* VERIFIED STORE LABEL - Trust only */}
              {hasVerifiedBadge && (
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 flex items-center gap-0.5 flex-shrink-0">
                  <Shield className="h-2.5 w-2.5" />
                  Verified Store
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Premium Store Indicator (Bottom Border) */}
      {hasFeaturedSpotlight && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-[length:200%_100%] animate-gradient-x" />
      )}
      {hasPremiumUI && !hasFeaturedSpotlight && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 bg-[length:200%_100%] animate-gradient-x" />
      )}
    </Card>
  );
};
