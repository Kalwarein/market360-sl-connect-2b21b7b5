import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { StoreCard } from '@/components/StoreCard';

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
      hsl(var(--primary) / 0.08) 50%,
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
  }
  
  .header-icon-btn:active {
    transform: scale(0.95);
  }
  
  .curved-divider {
    position: relative;
    height: 20px;
    background: linear-gradient(to bottom, hsl(var(--primary) / 0.08), transparent);
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

      // Count products and check for boosted visibility perk for each store
      const storesWithCounts = await Promise.all(
        (data || []).map(async (store) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .eq('published', true);

          // Check if store has boosted visibility perk
          const { data: boostPerk } = await supabase
            .from('store_perks')
            .select('id')
            .eq('store_id', store.id)
            .eq('perk_type', 'boosted_visibility')
            .eq('is_active', true)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

          return { 
            ...store, 
            productCount: count || 0,
            hasBoostedVisibility: !!boostPerk
          };
        })
      );

      // Sort stores: boosted visibility first, then by creation date
      const sortedStores = storesWithCounts.sort((a, b) => {
        if (a.hasBoostedVisibility && !b.hasBoostedVisibility) return -1;
        if (!a.hasBoostedVisibility && b.hasBoostedVisibility) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setStores(sortedStores);
      
      const delays: { [key: string]: string } = {};
      sortedStores.forEach((store, index) => {
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
        <div className="relative overflow-hidden border-t-4 border-primary bg-gradient-to-b from-primary/5 to-background">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle absolute rounded-full bg-primary/10 pointer-events-none"
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

          <div className="absolute inset-0 shimmer-overlay" />

          <div className="relative z-10 text-foreground p-6">
            <div className="animated-header flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Stores</h1>
                  <p className="text-sm text-muted-foreground">Explore verified sellers</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  className="header-icon-btn p-2.5 rounded-full border-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 flex items-center justify-center"
                  title="Filter stores"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                <button
                  className="header-icon-btn p-2.5 rounded-full border-2 border-accent/30 bg-accent/10 text-accent-foreground hover:bg-accent/20 transition-all duration-300 flex items-center justify-center"
                  title="Sort stores"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <button
                  className="header-icon-btn p-2.5 rounded-full border-2 border-secondary/50 bg-secondary/30 text-secondary-foreground hover:bg-secondary/50 transition-all duration-300 flex items-center justify-center"
                  title="Help & info"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search stores..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-card text-foreground placeholder-muted-foreground border-2 border-primary/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 shadow-md hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="curved-divider" />
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-7">
              {filteredStores.map((store: any, index: number) => (
                <StoreCard
                  key={store.id}
                  id={store.id}
                  name={store.store_name}
                  logo={store.logo_url}
                  banner={store.banner_url}
                  city={store.city}
                  region={store.region}
                  productCount={store.productCount || 0}
                />
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
    
