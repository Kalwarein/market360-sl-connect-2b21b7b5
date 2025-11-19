import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X, Package, DollarSign, FileText, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CATEGORY_OPTIONS } from '@/components/CategoryCard';
import { Badge } from '@/components/ui/badge';
import { MultiStepForm } from '@/components/MultiStepForm';
import { NumericInput } from '@/components/NumericInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationPicker } from '@/components/LocationPicker';

// Available perks with colors
const AVAILABLE_PERKS = [
  { icon: 'zap', label: 'Fast Shipping', color: '#FF9900' },
  { icon: 'truck', label: 'Free Delivery', color: '#0FA86C' },
  { icon: 'shield', label: 'Quality Guaranteed', color: '#0077CC' },
  { icon: 'star', label: 'Best Seller', color: '#FFD700' },
  { icon: 'award', label: 'Premium Quality', color: '#9333EA' },
  { icon: 'leaf', label: 'Eco-Friendly', color: '#10B981' },
];

const AddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  
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
  const [perks, setPerks] = useState<Array<{ icon: string; label: string; color: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    if (primaryImageIndex >= images.length - 1) {
      setPrimaryImageIndex(Math.max(0, images.length - 2));
    }
  };

  const togglePerk = (perk: { icon: string; label: string; color: string }) => {
    const exists = perks.find(p => p.label === perk.label);
    if (exists) {
      setPerks(perks.filter(p => p.label !== perk.label));
    } else {
      setPerks([...perks, perk]);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      toast({
        title: 'Maximum categories',
        description: 'You can select up to 3 categories',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
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

      // Reorder images to put primary image first
      const orderedImages = [...images];
      if (primaryImageIndex !== 0) {
        [orderedImages[0], orderedImages[primaryImageIndex]] = [orderedImages[primaryImageIndex], orderedImages[0]];
      }

      // Upload images
      const imageUrls: string[] = [];
      for (const image of orderedImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
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
          brand: formData.brand || null,
          model_number: formData.model_number || null,
          price: parseFloat(formData.price),
          moq: parseInt(formData.moq),
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          material: formData.material || null,
          origin: formData.origin || null,
          warranty: formData.warranty || null,
          hs_code: formData.hs_code || null,
          inquiry_only: formData.inquiry_only,
          published: formData.published,
          images: imageUrls,
          perks,
          category_cards: selectedCategories,
        });

      if (insertError) throw insertError;

      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'product_created',
        actor_id: user?.id,
        target_type: 'product',
        description: `Created product: ${formData.title}`,
      });

      toast({
        title: 'Success',
        description: 'Product created successfully',
      });

      navigate('/seller/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Step validation functions
  const validateBasics = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Required', description: 'Product title is required', variant: 'destructive' });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Required', description: 'Product description is required', variant: 'destructive' });
      return false;
    }
    if (!formData.category) {
      toast({ title: 'Required', description: 'Please select a category', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validatePricing = () => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: 'Invalid price', description: 'Please enter a valid price', variant: 'destructive' });
      return false;
    }
    if (!formData.moq || parseInt(formData.moq) < 1) {
      toast({ title: 'Invalid MOQ', description: 'Minimum order quantity must be at least 1', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateImages = () => {
    if (images.length === 0) {
      toast({ title: 'Images required', description: 'Please upload at least one product image', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const steps = [
    {
      title: 'Product Basics',
      description: 'Tell us about your product',
      content: (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Product Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter product name"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="transition-all focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your product in detail"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="transition-all focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Fashion">Fashion</SelectItem>
                <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Beauty">Beauty</SelectItem>
                <SelectItem value="Toys">Toys</SelectItem>
                <SelectItem value="Automotive">Automotive</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      validate: validateBasics,
    },
    {
      title: 'Pricing & Stock',
      description: 'Set your pricing and availability',
      content: (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Price (Leones) *
            </Label>
            <NumericInput
              id="price"
              placeholder="0.00"
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: value })}
              allowDecimal
              min={0}
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moq">Minimum Order Quantity *</Label>
            <NumericInput
              id="moq"
              placeholder="1"
              value={formData.moq}
              onChange={(value) => setFormData({ ...formData, moq: value })}
              min={1}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="inquiry_only" className="font-semibold">Inquiry Only</Label>
              <p className="text-sm text-muted-foreground">No direct purchase, contact only</p>
            </div>
            <Switch
              id="inquiry_only"
              checked={formData.inquiry_only}
              onCheckedChange={(checked) => setFormData({ ...formData, inquiry_only: checked })}
            />
          </div>
        </div>
      ),
      validate: validatePricing,
    },
    {
      title: 'Product Images',
      description: 'Upload high-quality photos',
      content: (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border group">
                <img src={preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                {primaryImageIndex === index && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold">
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index !== primaryImageIndex && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImageIndex(index)}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {images.length < 10 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground font-medium">Upload Image</span>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Upload up to 10 images • First image is the product cover
          </p>
        </div>
      ),
      validate: validateImages,
    },
    {
      title: 'Key Attributes',
      description: 'Add product specifications',
      content: (
        <div className="space-y-4 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Brand name"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                id="model_number"
                placeholder="Model/SKU"
                value={formData.model_number}
                onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                placeholder="e.g., Cotton, Plastic, Metal"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Place of Origin</Label>
              <Input
                id="origin"
                placeholder="e.g., Sierra Leone, China, USA"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warranty">Warranty (Years)</Label>
              <NumericInput
                id="warranty"
                placeholder="e.g., 1, 2"
                value={formData.warranty}
                onChange={(value) => setFormData({ ...formData, warranty: value })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hs_code">HS Code (Optional)</Label>
              <Input
                id="hs_code"
                placeholder="Harmonized System code"
                value={formData.hs_code}
                onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Perks & Tags',
      description: 'Highlight your product features',
      content: (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              Product Highlights
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PERKS.map((perk) => {
                const isSelected = perks.some(p => p.label === perk.label);
                return (
                  <button
                    key={perk.label}
                    type="button"
                    onClick={() => togglePerk(perk)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {perk.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Category Cards (Select up to 3)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Search Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., wholesale, bulk, discount"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Review & Publish',
      description: 'Review your product before publishing',
      content: (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              {imagePreviews[primaryImageIndex] && (
                <img
                  src={imagePreviews[primaryImageIndex]}
                  alt="Product"
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold">{formData.title || 'Untitled Product'}</h3>
                <p className="text-muted-foreground text-sm mt-1">{formData.category}</p>
                <p className="text-2xl font-bold text-primary mt-2">
                  Le {parseFloat(formData.price || '0').toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-semibold">{formData.brand || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MOQ</p>
                <p className="font-semibold">{formData.moq} units</p>
              </div>
              {formData.material && (
                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <p className="font-semibold">{formData.material}</p>
                </div>
              )}
              {formData.origin && (
                <div>
                  <p className="text-sm text-muted-foreground">Origin</p>
                  <p className="font-semibold">{formData.origin}</p>
                </div>
              )}
            </div>

            {perks.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {perks.map((perk) => (
                    <Badge key={perk.label} className="bg-primary/10 text-primary">
                      {perk.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <Label htmlFor="published" className="font-semibold text-lg">Publish Product</Label>
              <p className="text-sm text-muted-foreground">Make this product visible to customers</p>
            </div>
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground mt-2">
            Create a new product listing for your store
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onComplete={handleSubmit}
          onBack={() => navigate(-1)}
          submitText="Create Product"
          backText="Cancel"
        />
      </div>
    </div>
  );
};

export default AddProduct;
