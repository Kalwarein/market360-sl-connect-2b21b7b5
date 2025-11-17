'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, MapPin, Package, Search, Filter, ArrowUpDown, Info } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';

const animationStyles = `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes particleFloat {
    0% { transform: translateY(100px) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
  }
  
  @keyframes headerShimmer {
    0% { background-position: -1000px center; }
    100% { background-position: 1000px center; }
  }
  
  @keyframes bannerPan {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
  }
  
  @keyframes iconGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
  }
  
  @keyframes ripple {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(4); opacity: 0; }
  }
  
  @keyframes parallaxHeader {
    0% { transform: translateY(0); }
    100% { transform: translateY(20px); }
  }
  
  @keyframes curvePath {
    0% { clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%); }
  }
  
  .animated-header {
    animation: fadeInUp 0.8s ease-out;
  }
  
  .animated-card {
    animation: slideInUp 0.6s ease-out forwards;
  }
  
  .card-hover-float:hover {
    animation: float 2s ease-in-out;
  }
  
  .shimmer-overlay {
    animation: shimmer 3s infinite;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    background-size: 1000px 100%;
  }
  
  .banner-image {
    animation: bannerPan 4s ease-in-out infinite;
  }
  
  .particle {
    animation: particleFloat 3s ease-in infinite;
  }
  
  .header-icon-btn {
    transition: all 0.3s ease;
  }
  
  .header-icon-btn:hover {
    transform: scale(1.1);
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  .header-icon-btn:active {
    transform: scale(0.95);
  }
  
  .curved-divider {
    position: relative;
    height: 20px;
    background: linear-gradient(to bottom, rgba(16, 185, 129, 0.05), transparent);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 60%);
  }
`;

interface StoreData {
  id: string;
  store_name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  city?: string;
  region?: string;
  _count?: {
    products: number;
  };
}

const Stores = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardDelays, setCardDelays] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count products for each store
      const storesWithCounts = await Promise.all(
        (data || []).map(async (store) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('published', true);

          return { ...store, productCount: count || 0 };
        })
      );

      setStores(storesWithCounts);
      
      const delays: { [key: string]: string } = {};
      storesWithCounts.forEach((store, index) => {
        delays[store.id] = `${index * 0.1}s`;
      });
      setCardDelays(delays);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = searchQuery
    ? stores.filter((store) =>
        store.store_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stores;

  const particles = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-background pb-20">
        <div className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 shimmer-overlay" 
            style={{
              backgroundSize: '200% 100%',
              animation: 'headerShimmer 8s ease-in-out infinite',
            }}>
          </div>

          {/* Floating particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle absolute rounded-full bg-white/10 pointer-events-none"
              style={{
                width: Math.random() * 40 + 20 + 'px',
                height: Math.random() * 40 + 20 + 'px',
                left: particle.left + '%',
                bottom: '-50px',
                animation: `particleFloat ${particle.duration}s ease-in infinite`,
                animationDelay: particle.delay + 's',
              }}
            />
          ))}

          {/* Header content */}
          <div className="relative z-10 text-white p-6">
            <div className="animated-header flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <Store className="h-8 w-8 drop-shadow-lg" />
                <div>
                  <h1 className="text-3xl font-bold drop-shadow-md">Stores</h1>
                  <p className="text-sm opacity-95 drop-shadow">Explore verified sellers</p>
                </div>
              </div>
              
              {/* Right side action buttons */}
              <div className="flex items-center gap-2">
                <button
                  className="header-icon-btn p-2 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  title="Filter stores"
                >
                  <Filter className="h-5 w-5 text-white drop-shadow" />
                </button>
                <button
                  className="header-icon-btn p-2 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  title="Sort stores"
                >
                  <ArrowUpDown className="h-5 w-5 text-white drop-shadow" />
                </button>
                <button
                  className="header-icon-btn p-2 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  title="Help & info"
                >
                  <Info className="h-5 w-5 text-white drop-shadow" />
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="h-5 w-5 text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Search stores..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/20 backdrop-blur-md text-white placeholder-white/60 border border-white/30 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 focus:scale-105 origin-center"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              />
            </div>
          </div>

          <div className="curved-divider" />
        </div>

        {/* Store cards section */}
        <div className="p-4 space-y-5">
          {loading ? (
            <div className="grid grid-cols-1 gap-5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No stores found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:gap-6 lg:gap-7">
              {filteredStores.map((store: any, index: number) => (
                <Card
                  key={store.id}
                  className="animated-card card-hover-float cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border-0"
                  onClick={() => navigate(`/store/${store.id}`)}
                  style={{
                    animationDelay: cardDelays[store.id] || '0s',
                  }}
                >
                  <div className="h-32 md:h-36 relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
                    {store.banner_url ? (
                      <>
                        <img
                          src={store.banner_url || "/placeholder.svg"}
                          alt={store.store_name}
                          className="banner-image w-full h-full object-cover"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-teal-100 to-blue-100" />
                    )}
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 shimmer-overlay" />
                  </div>

                  <CardContent className="p-5 md:p-6">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl border-2 border-white bg-card flex-shrink-0 overflow-hidden -mt-10 relative z-10 shadow-lg">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url || "/placeholder.svg"}
                            alt={store.store_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                            <Package className="h-8 w-8 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-lg md:text-xl line-clamp-1 text-foreground">
                          {store.store_name}
                        </h3>
                        {(store.city || store.region) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {[store.city, store.region].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            {store.productCount} Products
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {store.description && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2 leading-relaxed">
                        {store.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default Stores;
        
