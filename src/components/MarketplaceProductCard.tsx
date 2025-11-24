import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Store } from 'lucide-react';
import { useStorePerks } from '@/hooks/useStorePerks';

interface MarketplaceProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  moq?: number;
  tag?: 'Top' | 'Hot Selling' | 'New';
  discount?: string;
  storeId?: string;
  storeName?: string;
}

export const MarketplaceProductCard = ({
  id,
  title,
  price,
  image,
  moq = 1,
  tag,
  discount,
  storeId,
  storeName,
}: MarketplaceProductCardProps) => {
  const navigate = useNavigate();
  const { hasVerifiedBadge } = useStorePerks(storeId || null);

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className={`min-w-[160px] max-w-[200px] cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group ${
        hasVerifiedBadge 
          ? 'border-2 border-primary/30 shadow-md bg-gradient-to-br from-primary/5 to-transparent' 
          : 'border-border/50'
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Verified Badge */}
        {hasVerifiedBadge && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-primary/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
              <CheckCircle className="h-5 w-5 text-primary-foreground fill-current" />
            </div>
          </div>
        )}

        {tag && (
          <Badge
            className={`absolute top-2 left-2 ${
              tag === 'Hot Selling'
                ? 'bg-black text-white'
                : tag === 'Top'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {tag}
          </Badge>
        )}
        {discount && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
            {discount}
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-2">
        {/* Store Name with Verified Badge */}
        {storeName && (
          <div className="flex items-center gap-1 mb-1">
            <Store className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
              {storeName}
              {hasVerifiedBadge && (
                <CheckCircle className="h-3 w-3 text-primary fill-primary inline" />
              )}
            </p>
          </div>
        )}
        
        <h3 className={`text-sm font-medium line-clamp-2 text-foreground ${
          storeName ? 'min-h-[32px]' : 'min-h-[40px]'
        }`}>
          {title}
        </h3>
        <div className="space-y-1">
          <p className="text-lg font-bold text-primary">Le {price.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Min. order: {moq} piece{moq > 1 ? 's' : ''}</p>
        </div>
      </div>
    </Card>
  );
};
