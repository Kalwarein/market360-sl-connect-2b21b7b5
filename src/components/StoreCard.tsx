import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, TrendingUp, Crown, Sparkles, Star, CheckCircle } from 'lucide-react';
import { useStorePerks } from '@/hooks/useStorePerks';
import verifiedBadge from '@/assets/verified-badge.png';

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

  const isFeatured = hasFeaturedSpotlight || hasPremiumTheme;

  // Premium Featured Store Layout
  if (isFeatured) {
    return (
      <Card 
        onClick={() => navigate(`/store/${id}`)}
        className="cursor-pointer overflow-hidden relative group transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] bg-card border-2 border-primary/20"
      >
        {/* Verified Badge - Top Right */}
        {hasVerifiedBadge && (
          <div className="absolute top-3 right-3 z-20">
            <img 
              src={verifiedBadge} 
              alt="Verified" 
              className="h-14 w-14 object-contain drop-shadow-lg"
            />
          </div>
        )}

        {/* Featured Badge - Top Left */}
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-primary text-primary-foreground font-bold text-xs px-3 py-1.5 shadow-lg rounded-full">
            <Crown className="h-4 w-4 mr-1 fill-current" />
            FEATURED
          </Badge>
        </div>

        {/* Banner Section */}
        <div className="relative h-40 overflow-hidden">
          {banner ? (
            <img 
              src={banner} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-primary-hover to-accent" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Content Section */}
        <CardContent className="p-6 relative">
          {/* Logo */}
          <div className="absolute -top-12 left-6 z-10">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-card shadow-xl">
                {logo ? (
                  <img src={logo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                    <Crown className="h-12 w-12 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pl-32 min-h-[80px] flex flex-col justify-center">
            {/* Store Name */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-xl line-clamp-1 text-foreground">
                {name}
              </h3>
              {hasVerifiedBadge && (
                <CheckCircle 
                  className="h-5 w-5 text-primary fill-primary flex-shrink-0"
                />
              )}
            </div>

            {/* Location */}
            {(city || region) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="line-clamp-1 font-medium">{[city, region].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
                <Package className="h-3 w-3 mr-1" />
                {productCount} Products
              </Badge>
              {hasTrendingPlacement && (
                <Badge className="text-xs font-semibold px-3 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-full">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
              <Badge className="text-xs font-semibold px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard Store Layout
  return (
    <Card 
      onClick={() => navigate(`/store/${id}`)}
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden relative group hover:scale-[1.02] active:scale-[0.98] bg-card/80 backdrop-blur-sm border-border/50"
    >
      {/* Verified Badge for Standard Stores */}
      {hasVerifiedBadge && (
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/30 blur-md rounded-full" />
            <img 
              src={verifiedBadge} 
              alt="Verified" 
              className="h-12 w-12 object-contain drop-shadow-lg relative"
            />
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        {banner ? (
          <img src={banner} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {hasTopOfCategory && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white font-semibold">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Top Seller
          </Badge>
        )}
      </div>

      {/* Store Info */}
      <CardContent className="p-4 -mt-8 relative">
        <div className="h-16 w-16 rounded-xl border-4 border-card overflow-hidden mb-3 bg-card shadow-lg group-hover:shadow-xl transition-shadow">
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-base line-clamp-1 text-foreground">
            {name}
          </h3>
          {hasVerifiedBadge && (
            <CheckCircle className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
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
            <Package className="h-3 w-3 mr-1" />
            {productCount} Products
          </Badge>
          {hasTrendingPlacement && (
            <Badge className="bg-rose-500 text-white text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
