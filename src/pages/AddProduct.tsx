import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, X, Plus, Search, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CATEGORY_OPTIONS } from '@/components/CategoryCard';
import { MultiStepForm } from '@/components/MultiStepForm';
import { NumericInput } from '@/components/NumericInput';
import { PRODUCT_CATEGORIES } from '@/lib/productCategories';
import { VariantManager } from '@/components/VariantManager';
import { TechnicalSpecsManager } from '@/components/TechnicalSpecsManager';
import { TargetAudienceSelector } from '@/components/TargetAudienceSelector';
import { ProductConditionBadge } from '@/components/ProductConditionBadge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const AVAILABLE_PERKS = [
  { icon: 'zap', label: 'Fast Shipping', color: '#FF9900' },
  { icon: 'truck', label: 'Free Delivery', color: '#0FA86C' },
  { icon: 'shield', label: 'Quality Guaranteed', color: '#0077CC' },
  { icon: 'star', label: 'Best Seller', color: '#FFD700' },
  { icon: 'award', label: 'Premium Quality', color: '#9333EA' },
  { icon: 'leaf', label: 'Eco-Friendly', color: '#10B981' },
];

const ENHANCEMENT_TAGS = [
  'Trending', 'Luxury', 'Handmade', 'Local Product', 'Eco-friendly',
  'Limited Edition', 'Fast Selling', 'Best Price', 'Hot Drop', 'Made in Sierra Leone'
];

const SAFETY_TAGS = [
  'Temperature Sensitive', 'Fragile', 'Contains Chemicals',
  'Requires Assembly', 'Not Suitable for Kids'
];

const ECO_BADGES = [
  'Recyclable', 'Sustainable Materials', 'Low Electricity',
  'Organic', 'Biodegradable'
];

const AddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    model_number: '',
    price: '',
    moq: '1',
    category: '',
    product_type: 'worldwide',
    tags: '',
    material: '',
    origin: '',
    warranty: '',
    hs_code: '',
    inquiry_only: false,
    published: false,
  });

  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [condition, setCondition] = useState('brand_new');
  const [variants, setVariants] = useState<any[]>([]);
  const [technicalSpecs, setTechnicalSpecs] = useState<Record<string, string>>({});
  const [shippingDetails, setShippingDetails] = useState({
    delivery_available: true,
    estimated_delivery_time: '',
    shipping_from: '',
    shipping_method: '',
    packaging_type: '',
    return_policy: false,
  });
  const [safetyTags, setSafetyTags] = useState<string[]>([]);
  const [enhancementTags, setEnhancementTags] = useState<string[]>([]);
  const [ecoBadges, setEcoBadges] = useState<string[]>([]);
  const [seoKeywords, setSeoKeywords] = useState('');
  const [productHighlights, setProductHighlights] = useState<string[]>(['', '', '']);
  const [searchPhrases, setSearchPhrases] = useState('');
  const [sellerStory, setSellerStory] = useState('');
  const [warrantyType, setWarrantyType] = useState('');
  const [supportContact, setSupportContact] = useState('');
  const [replacementAvailable, setReplacementAvailable] = useState(false);
  const [includedInBox, setIncludedInBox] = useState<string[]>(['']);
  const [customLabels, setCustomLabels] = useState('');
  const [productRequirements, setProductRequirements] = useState('');
  
  const [perks, setPerks] = useState<Array<{ icon: string; label: string; color: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const allCategories = useMemo(() => {
    const categories = [...PRODUCT_CATEGORIES];
    if (customCategory && !categories.includes(customCategory)) {
      categories.push(customCategory);
    }
    return categories.sort();
  }, [customCategory]);

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
        title: 'Maximum reached',
        description: 'You can select up to 3 category cards',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to add products',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (storeError) {
        console.error('Store fetch error:', storeError);
        toast({
          title: 'Error',
          description: 'Failed to fetch store information',
          variant: 'destructive',
        });
        return;
      }

      if (!store) {
        toast({
          title: 'No store found',
          description: 'You need to create a store before adding products. Please complete the seller application.',
          variant: 'destructive',
        });
        navigate('/become-seller');
        return;
      }

      const imageUrls: string[] = [];
      const orderedImages = [...images];
      if (primaryImageIndex !== 0 && orderedImages.length > 0) {
        [orderedImages[0], orderedImages[primaryImageIndex]] = [orderedImages[primaryImageIndex], orderedImages[0]];
      }

      for (const image of orderedImages) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      let videoUrl = null;
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, videoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
          videoUrl = publicUrl;
        }
      }

      const keywordsArray = seoKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const searchPhrasesArray = searchPhrases.split(',').map(p => p.trim()).filter(Boolean);
      const customLabelsArray = customLabels.split(',').map(l => l.trim()).filter(Boolean);

      const { error: insertError } = await supabase.from('products').insert({
        store_id: store.id,
        title: formData.title,
        description: formData.description,
        brand: formData.brand || null,
        model_number: formData.model_number || null,
        price: parseFloat(formData.price),
        moq: parseInt(formData.moq),
        category: formData.category,
        product_type: formData.product_type,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        material: formData.material || null,
        origin: formData.origin || null,
        warranty: formData.warranty || null,
        hs_code: formData.hs_code || null,
        inquiry_only: formData.inquiry_only,
        published: formData.published,
        images: imageUrls,
        perks: perks,
        category_cards: selectedCategories,
        target_audience: targetAudience,
        condition: condition,
        variants: variants,
        technical_specs: technicalSpecs,
        shipping_details: shippingDetails,
        safety_tags: safetyTags,
        enhancement_tags: enhancementTags,
        eco_badges: ecoBadges,
        seo_keywords: keywordsArray,
        product_highlights: productHighlights.filter(Boolean),
        search_phrases: searchPhrasesArray,
        seller_story: sellerStory || null,
        warranty_type: warrantyType || null,
        support_contact: supportContact || null,
        replacement_available: replacementAvailable,
        included_in_box: includedInBox.filter(Boolean),
        custom_labels: customLabelsArray,
        product_requirements: productRequirements || null,
        product_video_url: videoUrl,
      });

      if (insertError) {
        console.error('Product insert error:', insertError);
        toast({
          title: 'Error adding product',
          description: insertError.message || 'Failed to add product',
          variant: 'destructive',
        });
        return;
      }

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'product_created',
        description: `Created product: ${formData.title}`,
        metadata: { product_title: formData.title },
      });

      toast({
        title: 'Success',
        description: 'Product added successfully',
      });

      navigate('/product-creation-success');
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error adding product',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const validateBasics = () => {
    if (!formData.title.trim()) {
      toast({ title: 'Required', description: 'Product title is required', variant: 'destructive' });
      return false;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Required', description: 'Description is required', variant: 'destructive' });
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
    return true;
  };

  const validateImages = () => {
    if (images.length === 0) {
      toast({ title: 'Images required', description: 'Please upload at least one image', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const steps = [
    {
      title: 'Product Basics',
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter product title"
            />
          </div>

          <div>
            <Label>Product Category *</Label>
            <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categorySearchOpen}
                  className="w-full justify-between"
                >
                  {formData.category || "Select category..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandEmpty>
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">No category found.</p>
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Enter custom category"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customCategory) {
                              setFormData({ ...formData, category: customCategory });
                              setCategorySearchOpen(false);
                            }
                          }}
                        >
                          Add &quot;{customCategory}&quot;
                        </Button>
                      </div>
                    </div>
                  </CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {allCategories.map((category) => (
                      <CommandItem
                        key={category}
                        value={category}
                        onSelect={(currentValue) => {
                          setFormData({ ...formData, category: currentValue });
                          setCategorySearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.category === category ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {category}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="product_type">Product Type *</Label>
            <Select
              value={formData.product_type}
              onValueChange={(value) => setFormData({ ...formData, product_type: value })}
            >
              <SelectTrigger id="product_type">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturer">Manufacturer Product</SelectItem>
                <SelectItem value="worldwide">Worldwide Product</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Manufacturer: Direct from local manufacturers | Worldwide: International or general products
            </p>
          </div>

          <TargetAudienceSelector
            selected={targetAudience}
            onChange={setTargetAudience}
          />

          <div>
            <Label>Product Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand_new">Brand New</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
                <SelectItem value="used_excellent">Used - Excellent</SelectItem>
                <SelectItem value="used_good">Used - Good</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              <ProductConditionBadge condition={condition} />
            </div>
          </div>
        </div>
      ),
      validate: validateBasics,
    },
    {
      title: 'Pricing & Stock',
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Price (Le) *</Label>
            <NumericInput
              id="price"
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: value })}
              placeholder="Enter price"
            />
          </div>

          <div>
            <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
            <NumericInput
              id="moq"
              value={formData.moq}
              onChange={(value) => setFormData({ ...formData, moq: value })}
              placeholder="Minimum order quantity"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="inquiry_only"
              checked={formData.inquiry_only}
              onCheckedChange={(checked) => setFormData({ ...formData, inquiry_only: checked })}
            />
            <Label htmlFor="inquiry_only">Inquiry Only (No direct purchase)</Label>
          </div>
        </div>
      ),
      validate: validatePricing,
    },
    {
      title: 'Product Images',
      content: (
        <div className="space-y-4">
          <div>
            <Label>Product Images * (Max 10)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="cursor-pointer mt-2"
            />
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-lg ${
                        index === primaryImageIndex ? 'ring-4 ring-primary' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryImageIndex(index)}
                      >
                        {index === primaryImageIndex ? 'Primary' : 'Set Primary'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Product Video (Optional, ≤15 sec)</Label>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 15 * 1024 * 1024) {
                    toast({
                      title: 'File too large',
                      description: 'Video must be under 15MB',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setVideoFile(file);
                }
              }}
              className="mt-2"
            />
            {videoFile && <p className="text-sm text-muted-foreground mt-2">Video: {videoFile.name}</p>}
          </div>
        </div>
      ),
      validate: validateImages,
    },
    {
      title: 'Key Attributes',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Brand name"
              />
            </div>

            <div>
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                id="model_number"
                value={formData.model_number}
                onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                placeholder="Model number"
              />
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Material type"
              />
            </div>

            <div>
              <Label htmlFor="origin">Place of Origin</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Country of origin"
              />
            </div>

            <div>
              <Label htmlFor="warranty">Warranty (Years)</Label>
              <NumericInput
                id="warranty"
                value={formData.warranty}
                onChange={(value) => setFormData({ ...formData, warranty: value })}
                placeholder="Warranty period"
              />
            </div>

            <div>
              <Label htmlFor="hs_code">HS Code (Optional)</Label>
              <Input
                id="hs_code"
                value={formData.hs_code}
                onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                placeholder="HS code"
              />
            </div>
          </div>

          <TechnicalSpecsManager
            specs={technicalSpecs}
            onChange={setTechnicalSpecs}
          />
        </div>
      ),
    },
    {
      title: 'Variants & Options',
      content: (
        <div className="space-y-4">
          <VariantManager variants={variants} onChange={setVariants} />
        </div>
      ),
    },
    {
      title: 'Shipping & Delivery',
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={shippingDetails.delivery_available}
              onCheckedChange={(checked) =>
                setShippingDetails({ ...shippingDetails, delivery_available: checked })
              }
            />
            <Label>Delivery Available</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estimated Delivery Time</Label>
              <Input
                value={shippingDetails.estimated_delivery_time}
                onChange={(e) =>
                  setShippingDetails({ ...shippingDetails, estimated_delivery_time: e.target.value })
                }
                placeholder="e.g., 2-3 days"
              />
            </div>

            <div>
              <Label>Shipping From</Label>
              <Input
                value={shippingDetails.shipping_from}
                onChange={(e) =>
                  setShippingDetails({ ...shippingDetails, shipping_from: e.target.value })
                }
                placeholder="Your location"
              />
            </div>

            <div>
              <Label>Shipping Method</Label>
              <Select
                value={shippingDetails.shipping_method}
                onValueChange={(value) =>
                  setShippingDetails({ ...shippingDetails, shipping_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Packaging Type</Label>
              <Select
                value={shippingDetails.packaging_type}
                onValueChange={(value) =>
                  setShippingDetails({ ...shippingDetails, packaging_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select packaging" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="bag">Bag</SelectItem>
                  <SelectItem value="eco_wrap">Eco Wrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={shippingDetails.return_policy}
              onCheckedChange={(checked) =>
                setShippingDetails({ ...shippingDetails, return_policy: checked })
              }
            />
            <Label>Returns Accepted</Label>
          </div>

          <div>
            <Label>Safety & Compliance Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SAFETY_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={safetyTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (safetyTags.includes(tag)) {
                      setSafetyTags(safetyTags.filter((t) => t !== tag));
                    } else {
                      setSafetyTags([...safetyTags, tag]);
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Perks & Tags',
      content: (
        <div className="space-y-4">
          <div>
            <Label>Product Highlights (Perks)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_PERKS.map((perk) => (
                <Badge
                  key={perk.label}
                  variant={perks.some(p => p.label === perk.label) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => togglePerk(perk)}
                >
                  {perk.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Category Cards (Max 3)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORY_OPTIONS.map((option) => (
                <Badge
                  key={typeof option === 'string' ? option : option.id}
                  variant={selectedCategories.includes(typeof option === 'string' ? option : option.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(typeof option === 'string' ? option : option.id)}
                >
                  {typeof option === 'string' ? option : option.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Enhancement Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ENHANCEMENT_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={enhancementTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (enhancementTags.includes(tag)) {
                      setEnhancementTags(enhancementTags.filter((t) => t !== tag));
                    } else {
                      setEnhancementTags([...enhancementTags, tag]);
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Eco & Sustainability Badges</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ECO_BADGES.map((badge) => (
                <Badge
                  key={badge}
                  variant={ecoBadges.includes(badge) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (ecoBadges.includes(badge)) {
                      setEcoBadges(ecoBadges.filter((b) => b !== badge));
                    } else {
                      setEcoBadges([...ecoBadges, badge]);
                    }
                  }}
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Search Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., smartphone, electronics, tech"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'SEO & Additional Info',
      content: (
        <div className="space-y-4">
          <div>
            <Label>Product Highlights (3-5 bullet points)</Label>
            {productHighlights.map((highlight, index) => (
              <Input
                key={index}
                value={highlight}
                onChange={(e) => {
                  const updated = [...productHighlights];
                  updated[index] = e.target.value;
                  setProductHighlights(updated);
                }}
                placeholder={`Highlight ${index + 1}`}
                className="mt-2"
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setProductHighlights([...productHighlights, ''])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Highlight
            </Button>
          </div>

          <div>
            <Label>SEO Keywords (comma-separated)</Label>
            <Input
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="e.g., cheap laptop, Sierra Leone electronics"
            />
          </div>

          <div>
            <Label>Search Phrases (comma-separated)</Label>
            <Input
              value={searchPhrases}
              onChange={(e) => setSearchPhrases(e.target.value)}
              placeholder="e.g., best phone in Freetown, affordable tech"
            />
          </div>

          <div>
            <Label>Seller Story / Product Background (Optional)</Label>
            <Textarea
              value={sellerStory}
              onChange={(e) => setSellerStory(e.target.value)}
              placeholder="Tell customers why this product is special..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Warranty Type</Label>
              <Select value={warrantyType} onValueChange={setWarrantyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Store Warranty</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Support Contact</Label>
              <Input
                value={supportContact}
                onChange={(e) => setSupportContact(e.target.value)}
                placeholder="Phone/WhatsApp"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={replacementAvailable}
              onCheckedChange={setReplacementAvailable}
            />
            <Label>Replacement Available</Label>
          </div>

          <div>
            <Label>Included in Box</Label>
            {includedInBox.map((item, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const updated = [...includedInBox];
                    updated[index] = e.target.value;
                    setIncludedInBox(updated);
                  }}
                  placeholder="e.g., Charger, Manual"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIncludedInBox(includedInBox.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIncludedInBox([...includedInBox, ''])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div>
            <Label>Custom Labels (comma-separated)</Label>
            <Input
              value={customLabels}
              onChange={(e) => setCustomLabels(e.target.value)}
              placeholder="e.g., Custom print available, Wholesale only"
            />
          </div>

          <div>
            <Label>Product Requirements / Notes</Label>
            <Textarea
              value={productRequirements}
              onChange={(e) => setProductRequirements(e.target.value)}
              placeholder="Assembly required? Tools needed? Special instructions?"
              rows={3}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Review & Publish',
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{formData.title || 'Product Title'}</h3>
            <p className="text-sm text-muted-foreground">{formData.category}</p>
            <p className="text-lg font-bold text-primary">Le {formData.price ? parseFloat(formData.price).toLocaleString() : '0'}</p>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {imagePreviews.slice(0, 4).map((preview, index) => (
                  <img
                    key={index}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {targetAudience.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {targetAudience.map((audience) => (
                  <Badge key={audience} variant="secondary">{audience}</Badge>
                ))}
              </div>
            )}

            <ProductConditionBadge condition={condition} />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
            />
            <Label htmlFor="published">Publish immediately</Label>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Add New Product</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <MultiStepForm steps={steps} onComplete={handleSubmit} />
      </div>
    </div>
  );
};

export default AddProduct;
