import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageSquare, Store, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStorePerks } from '@/hooks/useStorePerks';

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
  const { hasVerifiedBadge } = useStorePerks(store_id || null);

  return (
    <Card 
      className={`group card-premium hover-lift overflow-hidden cursor-pointer animate-fade-in ${
        hasVerifiedBadge 
          ? 'border-2 border-primary/30 shadow-md bg-gradient-to-br from-primary/5 to-transparent' 
          : ''
      }`}
      onClick={() => navigate(`/product/${id}`)}
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          
          {/* Verified Badge */}
          {hasVerifiedBadge && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-primary/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                <CheckCircle className="h-5 w-5 text-primary-foreground fill-current" />
              </div>
            </div>
          )}
          
          {/* Category Badge */}
          <Badge 
            className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm border-0 shadow-md"
          >
            {category}
          </Badge>

          {/* Quick Actions */}
          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-lg ripple"
              onClick={(e) => {
                e.stopPropagation();
                onChat?.();
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg ripple bg-primary hover:bg-primary-hover"
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
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
            {title}
          </h3>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">
              Le {price.toLocaleString()}
            </p>
          </div>

          {store_name && (
            <div className="flex items-center gap-1.5 text-xs pt-1 border-t">
              <Store className="h-3 w-3 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{store_name}</span>
              {hasVerifiedBadge && (
                <CheckCircle className="h-3 w-3 text-primary fill-primary flex-shrink-0" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
