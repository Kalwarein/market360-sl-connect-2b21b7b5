import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, CheckCircle2, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { useStorePerks } from '@/hooks/useStorePerks';

interface StoreCardProps {
  id: string;
  name: string;
  logo?: string;
  banner?: string;
  city?: string;
  region?: string;
  productCount?: number;
}

export const StoreCard = ({ 
  id, 
  name, 
  logo, 
  banner, 
  city, 
  region, 
  productCount = 0 
}: StoreCardProps) => {
  const navigate = useNavigate();
  const { 
    hasVerifiedBadge, 
    hasPremiumTheme, 
    hasTrendingPlacement,
    hasFeaturedSpotlight,
    hasTopOfCategory 
  } = useStorePerks(id);

  return (
    <Card 
      onClick={() => navigate(`/store/${id}`)}
      className={`cursor-pointer hover:shadow-lg transition-all overflow-hidden ${
        hasPremiumTheme ? 'border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5' : ''
      } ${hasFeaturedSpotlight ? 'ring-4 ring-red-500/50 animate-pulse-slow' : ''}`}
    >
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        {banner ? (
          <img src={banner} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full ${
            hasPremiumTheme 
              ? 'bg-gradient-to-r from-primary via-primary-hover to-primary' 
              : 'bg-gradient-to-r from-primary to-secondary'
          }`} />
        )}
        {hasPremiumTheme && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        )}
        {hasFeaturedSpotlight && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">
            <Crown className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        {hasTopOfCategory && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
            Top Seller
          </Badge>
        )}
      </div>

      {/* Store Info */}
      <CardContent className="p-4 -mt-8 relative">
        <div className={`h-16 w-16 rounded-lg border-4 border-card overflow-hidden mb-3 bg-card ${
          hasPremiumTheme ? 'ring-2 ring-primary' : ''
        }`}>
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold text-base line-clamp-1 ${
            hasPremiumTheme ? 'bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent' : ''
          }`}>
            {name}
          </h3>
          {hasVerifiedBadge && (
            <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-500 flex-shrink-0" />
          )}
        </div>

        {(city || region) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{[city, region].filter(Boolean).join(', ')}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {productCount} Products
          </Badge>
          {hasTrendingPlacement && (
            <Badge className="bg-rose-500 text-white text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
          {hasPremiumTheme && (
            <Badge className="bg-violet-500 text-white text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
