import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageSquare, Store, CheckCircle, TrendingUp, Sparkles, Zap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasVerifiedBadge } = useStorePerks(store_id || null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, id]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      // Not favorited
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add favorites',
      });
      return;
    }

    setFavoriteLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: 'Removed from favorites',
          description: 'Product removed from your wishlist',
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: id,
          });

        if (error) throw error;

        setIsFavorite(true);
        toast({
          title: 'Added to favorites',
          description: 'Product added to your wishlist',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <Card 
      className={`group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in ${
        hasVerifiedBadge 
          ? 'border-2 border-primary/40 shadow-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent' 
          : 'border border-border hover:border-primary/30 shadow-lg'
      }`}
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Premium Glow Effect */}
      {hasVerifiedBadge && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
          
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Verified Badge */}
          {hasVerifiedBadge && (
            <div className="absolute top-2 right-2 z-10 animate-bounce-slow">
              <div className="bg-gradient-to-br from-primary to-accent backdrop-blur-sm rounded-full p-2 shadow-2xl ring-2 ring-white/50">
                <CheckCircle className="h-5 w-5 text-white fill-current" />
              </div>
            </div>
          )}
          
          {/* Category Badge with Premium Style */}
          <Badge 
            className={`absolute top-2 left-2 shadow-lg backdrop-blur-md border-0 font-bold transition-all duration-300 group-hover:scale-110 ${
              hasVerifiedBadge 
                ? 'bg-gradient-to-r from-primary to-accent text-white' 
                : 'bg-primary/90 text-primary-foreground'
            }`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {category}
          </Badge>

          {/* Trending Badge (Bottom Left) */}
          {hasVerifiedBadge && (
            <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg backdrop-blur-sm font-bold">
              <TrendingUp className="h-3 w-3 mr-1" />
              Hot
            </Badge>
          )}

          {/* Favorite Button - Top Left */}
          <Button
            size="icon"
            variant="secondary"
            className={`absolute top-2 left-2 h-9 w-9 rounded-full shadow-lg backdrop-blur-md border border-border/50 z-10 transition-all duration-300 ${
              isFavorite 
                ? 'bg-red-500/90 hover:bg-red-600' 
                : 'bg-white/90 hover:bg-white'
            }`}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
          >
            <Heart 
              className={`h-4 w-4 transition-all ${
                isFavorite 
                  ? 'fill-white text-white' 
                  : 'text-foreground'
              }`}
            />
          </Button>

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
        <div className="p-4 space-y-3 bg-card">
          <h3 className="font-bold text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xl font-black ${hasVerifiedBadge ? 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent' : 'text-primary'}`}>
                Le {price.toLocaleString()}
              </p>
              {hasVerifiedBadge && (
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  Fast Shipping
                </p>
              )}
            </div>
          </div>

          {store_name && (
            <div className="flex items-center gap-2 text-xs pt-2 border-t border-border/50">
              <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground font-medium">{store_name}</span>
              {hasVerifiedBadge && (
                <CheckCircle className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0 animate-pulse-slow" />
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Premium Store Indicator (Bottom Border) */}
      {hasVerifiedBadge && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient-x" />
      )}
    </Card>
  );
};
