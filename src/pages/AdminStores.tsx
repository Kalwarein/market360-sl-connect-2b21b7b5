import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Store as StoreIcon, MapPin, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Store {
  id: string;
  store_name: string;
  logo_url: string;
  city: string;
  country: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminStores = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      
      // Fetch owner profiles
      const storesWithProfiles = await Promise.all(
        (data || []).map(async (store) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', store.owner_id)
            .single();
          
          return {
            ...store,
            profiles: profile || { name: '', email: '' },
          };
        })
      );
      
      setStores(storesWithProfiles as any);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter((store) =>
    store.store_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Stores Management</h1>
        <p className="text-sm opacity-90">{stores.length} total stores</p>
      </div>

      <div className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/store/${store.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.store_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <StoreIcon className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{store.store_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {store.profiles?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {store.city}, {store.country}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <StoreIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No stores found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminStores;
