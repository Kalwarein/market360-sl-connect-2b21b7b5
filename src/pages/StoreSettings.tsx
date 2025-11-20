import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, Store as StoreIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const StoreSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    city: '',
    region: '',
    country: '',
  });

  useEffect(() => {
    if (user) loadStore();
  }, [user]);

  const loadStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Store fetch error:', error);
        throw error;
      }

      if (!data) {
        console.log('No store found for user');
        toast({
          title: 'No store found',
          description: 'Please complete your seller application first',
          variant: 'destructive',
        });
        navigate('/become-seller');
        return;
      }

      setStore(data);
      setFormData({
        store_name: data.store_name || '',
        description: data.description || '',
        city: data.city || '',
        region: data.region || '',
        country: data.country || ''
      });
    } catch (error) {
      console.error('Error loading store:', error);
      toast({
        title: 'Error',
        description: 'Failed to load store information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const fileName = `${store.id}-logo.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('stores').update({ logo_url: publicUrl }).eq('id', store.id);
      if (updateError) throw updateError;
      setStore({ ...store, logo_url: publicUrl });
      toast({ title: 'Logo Updated', description: 'Your store logo has been updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const fileName = `${store.id}-banner.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('stores').update({ banner_url: publicUrl }).eq('id', store.id);
      if (updateError) throw updateError;
      setStore({ ...store, banner_url: publicUrl });
      toast({ title: 'Banner Updated', description: 'Your store banner has been updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload banner', variant: 'destructive' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('stores').update(formData).eq('id', store.id);
      if (error) throw error;
      toast({ title: 'Store Updated', description: 'Your store settings have been saved' });
      navigate('/seller-dashboard');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update store settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background p-6"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/seller-dashboard')} className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-lg font-bold">Store Settings</h1>
        </div>
      </div>
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Card className="shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Store Visuals</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Store Logo</Label>
              <div className="mt-3 flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed overflow-hidden bg-muted flex items-center justify-center">
                  {store?.logo_url ? <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <StoreIcon className="h-10 w-10 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3">Upload square logo (500x500px)</p>
                  <label><Button variant="outline" size="sm" disabled={uploadingLogo} className="cursor-pointer" asChild><span><Upload className="h-4 w-4 mr-2" />{uploadingLogo ? 'Uploading...' : 'Change Logo'}</span></Button><input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} /></label>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold">Store Banner</Label>
              <div className="mt-3">
                <div className="w-full h-40 rounded-xl border-2 border-dashed overflow-hidden bg-muted flex items-center justify-center mb-3">
                  {store?.banner_url ? <img src={store.banner_url} alt="Banner" className="w-full h-full object-cover" /> : <ImageIcon className="h-12 w-12 text-muted-foreground" />}
                </div>
                <label><Button variant="outline" size="sm" disabled={uploadingBanner} className="cursor-pointer" asChild><span><Upload className="h-4 w-4 mr-2" />{uploadingBanner ? 'Uploading...' : 'Change Banner'}</span></Button><input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploadingBanner} /></label>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><StoreIcon className="h-5 w-5 text-primary" />Store Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label htmlFor="store_name">Store Name</Label><Input id="store_name" value={formData.store_name} onChange={(e) => setFormData({ ...formData, store_name: e.target.value })} className="mt-2" /></div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-2" rows={4} /></div>
            <div><Label htmlFor="city">City</Label><Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-2" /></div>
            <div><Label htmlFor="region">Region/State</Label><Input id="region" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="mt-2" /></div>
            <div><Label htmlFor="country">Country</Label><Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="mt-2" /></div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Button variant="outline" onClick={() => navigate('/seller-dashboard')} className="flex-1">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreSettings;
