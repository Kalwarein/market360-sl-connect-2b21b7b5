import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Store as StoreIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const StoreSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    city: '',
    region: '',
    country: '',
  });

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user]);

  const loadStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;
      setStore(data);
      setFormData({
        store_name: data.store_name || '',
        description: data.description || '',
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
      });
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('stores')
        .update(formData)
        .eq('id', store.id);

      if (error) throw error;

      toast({
        title: 'Store Updated',
        description: 'Your store settings have been saved',
      });

      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        title: 'Error',
        description: 'Failed to update store settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
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
          onClick={() => navigate('/seller-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-sm opacity-90">Manage your store information</p>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5 text-primary" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="store_name">Store Name</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) =>
                  setFormData({ ...formData, store_name: e.target.value })
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-2"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="region">Region/State</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label>Store Logo</Label>
              <div className="flex items-center gap-4">
                {store?.logo_url && (
                  <img
                    src={store.logo_url}
                    alt="Store logo"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Store Banner</Label>
              <div className="flex items-center gap-4">
                {store?.banner_url && (
                  <img
                    src={store.banner_url}
                    alt="Store banner"
                    className="w-32 h-16 rounded-lg object-cover"
                  />
                )}
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Banner
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/seller-dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreSettings;
