import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    model_number: '',
    price: '',
    moq: '1',
    category: '',
    tags: '',
    material: '',
    origin: '',
    warranty: '',
    hs_code: '',
    inquiry_only: false,
    published: false,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast({
        title: 'Too many images',
        description: 'Maximum 10 images allowed',
        variant: 'destructive',
      });
      return;
    }

    setImages([...images, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast({
        title: 'Images required',
        description: 'Please upload at least one product image',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get store ID
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (!store) {
        throw new Error('Store not found');
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Create product
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          title: formData.title,
          description: formData.description,
          brand: formData.brand,
          model_number: formData.model_number,
          price: parseFloat(formData.price),
          moq: parseInt(formData.moq),
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          material: formData.material,
          origin: formData.origin,
          warranty: formData.warranty,
          hs_code: formData.hs_code,
          images: imageUrls,
          inquiry_only: formData.inquiry_only,
          published: formData.published,
        });

      if (insertError) throw insertError;

      // Create audit log
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        action: 'product_created',
        description: `Created product: ${formData.title}`,
      });

      toast({
        title: 'Product created',
        description: 'Your product has been added successfully',
      });

      navigate('/seller-dashboard');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Add New Product</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-accent">
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add Image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {images.length}/10 images • Minimum 1, maximum 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Product Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="model_number">Model Number</Label>
                <Input
                  id="model_number"
                  value={formData.model_number}
                  onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category*</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="e.g., Electronics, Fashion, Home & Garden"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., wholesale, bulk, premium"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (Leones)*</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="moq">Minimum Order Quantity</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="e.g., China, USA"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  value={formData.warranty}
                  onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                  placeholder="e.g., 1 year"
                />
              </div>
              <div>
                <Label htmlFor="hs_code">HS Code</Label>
                <Input
                  id="hs_code"
                  value={formData.hs_code}
                  onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inquiry_only">Inquiry Only</Label>
                <p className="text-sm text-muted-foreground">
                  Buyers can only inquire, not place orders
                </p>
              </div>
              <Switch
                id="inquiry_only"
                checked={formData.inquiry_only}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inquiry_only: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="published">Publish Product</Label>
                <p className="text-sm text-muted-foreground">
                  Make product visible to buyers
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
