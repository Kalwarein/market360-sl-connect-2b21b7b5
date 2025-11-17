'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
      rgba(255, 255, 255, 0.15) 50%,
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
      <div className="min-h-screen bg-white pb-20">
        <div className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #065f46 0%, #0d9488 50%, #0369a1 100%)',
        }}>
          {/* Floating particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle absolute rounded-full bg-white/20 pointer-events-none"
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

          {/* Shimmer overlay */}
          <div className="absolute inset-0 shimmer-overlay" />

          {/* Header content */}
          <div className="relative z-10 text-white p-6">
            <div className="animated-header flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Store icon SVG */}
                <svg className="h-8 w-8 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <div>
                  <h1 className="text-3xl font-bold drop-shadow-md">Stores</h1>
                  <p className="text-sm opacity-95 drop-shadow">Explore verified sellers</p>
                </div>
              </div>
              
              {/* Right side action buttons */}
              <div className="flex items-center gap-2">
                {/* Filter button */}
                <button
                  className="header-icon-btn p-2.5 rounded-full border border-white/40 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  title="Filter stores"
                >
                  <svg className="h-5 w-5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                {/* Sort button */}
                <button
                  className="header-icon-btn p-2.5 rounded-full border border-white/40 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  title="Sort stores"
                >
                  <svg className="h-5 w-5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                {/* Info button */}
                <button
                  className="header-icon-btn p-2.5 rounded-full border border-white/40 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  title="Help & info"
                >
                  <svg className="h-5 w-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search stores..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-gray-900 placeholder-gray-500 border-2 border-white focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all duration-300 shadow-md hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <svg className="h-16 w-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
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
                            <svg className="h-8 w-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-0.9-2-2-2z"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-lg md:text-xl line-clamp-1 text-foreground">
                          {store.store_name}
                        </h3>
                        {(store.city || store.region) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
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
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-0.9-2-2-2z"/>
                            </svg>
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
                  
