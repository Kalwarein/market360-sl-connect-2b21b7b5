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
        className="cursor-pointer overflow-hidden relative group transform transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          border: '2px solid transparent',
          backgroundImage: `
            linear-gradient(135deg, rgba(26,26,26,1) 0%, rgba(45,45,45,1) 50%, rgba(26,26,26,1) 100%),
            linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #ffd700 50%, #ffb700 75%, #ffd700 100%)
          `,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Golden Shimmer Effect */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.4) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s infinite'
          }}
        />

        {/* Verified Badge - Top Right */}
        {hasVerifiedBadge && (
          <div className="absolute top-3 right-3 z-20">
            <div className="relative animate-pulse">
              <div className="absolute inset-0 bg-amber-500/50 blur-xl rounded-full" />
              <img 
                src={verifiedBadge} 
                alt="Verified" 
                className="h-14 w-14 object-contain drop-shadow-2xl relative z-10"
              />
            </div>
          </div>
        )}

        {/* Featured Crown Badge - Top Left */}
        <div className="absolute top-3 left-3 z-20">
          <Badge 
            className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs px-3 py-1.5 shadow-2xl border-2 border-yellow-300 animate-pulse"
            style={{
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
            }}
          >
            <Crown className="h-4 w-4 mr-1 fill-current" />
            FEATURED
          </Badge>
        </div>

        {/* Premium Banner Section */}
        <div className="relative h-40 overflow-hidden">
          {banner ? (
            <img 
              src={banner} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              style={{
                filter: 'brightness(0.9) contrast(1.1)'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900 via-yellow-700 to-amber-900" />
          )}
          
          {/* Golden Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Sparkle Effects */}
          <div className="absolute top-4 left-4">
            <Star className="h-6 w-6 text-yellow-300 fill-yellow-300 animate-pulse" style={{ animationDelay: '0s' }} />
          </div>
          <div className="absolute top-8 right-8">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute bottom-6 left-1/2">
            <Star className="h-4 w-4 text-amber-300 fill-amber-300 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Premium Content Section */}
        <CardContent className="p-6 relative">
          {/* Logo with Golden Frame */}
          <div className="absolute -top-12 left-6 z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl blur-lg opacity-75" />
              <div 
                className="relative h-24 w-24 rounded-2xl overflow-hidden"
                style={{
                  border: '4px solid',
                  borderImage: 'linear-gradient(135deg, #ffd700, #ffed4e, #ffd700, #ffb700) 1',
                  boxShadow: '0 8px 24px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                }}
              >
                {logo ? (
                  <img src={logo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-800 to-yellow-900">
                    <Crown className="h-12 w-12 text-yellow-300 fill-yellow-300" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pl-32 min-h-[80px] flex flex-col justify-center">
            {/* Store Name with Golden Text */}
            <div className="flex items-center gap-2 mb-2">
              <h3 
                className="font-black text-xl line-clamp-1"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))'
                }}
              >
                {name}
              </h3>
              {hasVerifiedBadge && (
                <CheckCircle 
                  className="h-5 w-5 text-amber-400 fill-amber-400 flex-shrink-0"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))'
                  }}
                />
              )}
            </div>

            {/* Location */}
            {(city || region) && (
              <div className="flex items-center gap-1.5 text-xs text-amber-200/90 mb-3">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span className="line-clamp-1 font-medium">{[city, region].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Premium Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-amber-600 to-yellow-500 text-white border border-amber-400/50"
                style={{
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.4)'
                }}
              >
                <Package className="h-3 w-3 mr-1" />
                {productCount} Products
              </Badge>
              {hasTrendingPlacement && (
                <Badge className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-rose-600 to-pink-500 text-white border border-rose-400/50">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
              <Badge className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-purple-600 to-violet-500 text-white border border-purple-400/50">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          </div>
        </CardContent>

        {/* Bottom Golden Accent */}
        <div 
          className="h-1.5 w-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%)'
          }}
        />
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
