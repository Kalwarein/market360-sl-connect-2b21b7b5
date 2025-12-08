import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Save, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TargetAudienceSelector } from '@/components/TargetAudienceSelector';
import { VariantManager } from '@/components/VariantManager';
import { TechnicalSpecsManager } from '@/components/TechnicalSpecsManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ProductManagement = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);
  const [product, setProduct] = useState<any>(null);
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
    condition: '',
    product_video_url: '',
    warranty_type: '',
    support_contact: '',
    seller_story: '',
    product_requirements: '',
  });
  const [perks, setPerks] = useState<Array<{ icon: string; label: string; color: string }>>([]);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [technicalSpecs, setTechnicalSpecs] = useState<Record<string, string>>({});
  const [shippingDetails, setShippingDetails] = useState<any>({});
  const [safetyTags, setSafetyTags] = useState<string[]>([]);
  const [enhancementTags, setEnhancementTags] = useState<string[]>([]);
  const [ecoBadges, setEcoBadges] = useState<string[]>([]);
  const [customLabels, setCustomLabels] = useState<string[]>([]);
  const [includedInBox, setIncludedInBox] = useState<string[]>([]);
  const [productHighlights, setProductHighlights] = useState<string[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [replacementAvailable, setReplacementAvailable] = useState(false);
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores!inner(owner_id)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if user owns this product
      if (data.stores.owner_id !== user?.id) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to edit this product',
          variant: 'destructive',
        });
        navigate('/seller-dashboard');
        return;
      }

      setProduct(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        brand: data.brand || '',
        model_number: data.model_number || '',
        price: data.price.toString(),
        moq: data.moq?.toString() || '1',
        category: data.category,
        tags: data.tags?.join(', ') || '',
        material: data.material || '',
        origin: data.origin || '',
        warranty: data.warranty || '',
        hs_code: data.hs_code || '',
        inquiry_only: data.inquiry_only || false,
        published: data.published || false,
        condition: data.condition || '',
        product_video_url: data.product_video_url || '',
        warranty_type: data.warranty_type || '',
        support_contact: data.support_contact || '',
        seller_story: data.seller_story || '',
        product_requirements: data.product_requirements || '',
      });
      
      // Parse all complex fields with proper type casting
      setPerks(Array.isArray(data.perks) ? data.perks as Array<{ icon: string; label: string; color: string }> : []);
      setTargetAudience(Array.isArray(data.target_audience) ? data.target_audience as string[] : []);
      setVariants(Array.isArray(data.variants) ? data.variants as any[] : []);
      setTechnicalSpecs(data.technical_specs && typeof data.technical_specs === 'object' ? data.technical_specs as Record<string, string> : {});
      setShippingDetails(data.shipping_details && typeof data.shipping_details === 'object' ? data.shipping_details : {});
      setSafetyTags(Array.isArray(data.safety_tags) ? data.safety_tags as string[] : []);
      setEnhancementTags(Array.isArray(data.enhancement_tags) ? data.enhancement_tags as string[] : []);
      setEcoBadges(Array.isArray(data.eco_badges) ? data.eco_badges as string[] : []);
      setCustomLabels(Array.isArray(data.custom_labels) ? data.custom_labels as string[] : []);
      setIncludedInBox(Array.isArray(data.included_in_box) ? data.included_in_box as string[] : []);
      setProductHighlights(Array.isArray(data.product_highlights) ? data.product_highlights as string[] : []);
      setSeoKeywords(Array.isArray(data.seo_keywords) ? data.seo_keywords as string[] : []);
      setReplacementAvailable(data.replacement_available || false);
      setScheduledDeletionAt(data.scheduled_deletion_at || null);
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          brand: formData.brand,
          model_number: formData.model_number,
          price: parseFloat(formData.price),
          moq: parseInt(formData.moq),
          condition: formData.condition,
          product_video_url: formData.product_video_url,
          warranty_type: formData.warranty_type,
          support_contact: formData.support_contact,
          seller_story: formData.seller_story,
          product_requirements: formData.product_requirements,
          target_audience: targetAudience,
          variants: variants,
          technical_specs: technicalSpecs,
          shipping_details: shippingDetails,
          safety_tags: safetyTags,
          enhancement_tags: enhancementTags,
          eco_badges: ecoBadges,
          custom_labels: customLabels,
          included_in_box: includedInBox,
          product_highlights: productHighlights,
          seo_keywords: seoKeywords,
          replacement_available: replacementAvailable,
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          material: formData.material,
          origin: formData.origin,
          warranty: formData.warranty,
          hs_code: formData.hs_code,
          inquiry_only: formData.inquiry_only,
          published: formData.published,
          perks: perks,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleDeletion = async () => {
    setIsProcessingDeletion(true);
    try {
      const deletionTime = new Date();
      deletionTime.setHours(deletionTime.getHours() + 48);
      
      const { error } = await supabase
        .from('products')
        .update({ 
          scheduled_deletion_at: deletionTime.toISOString(),
          published: false
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setScheduledDeletionAt(deletionTime.toISOString());
      setFormData(prev => ({ ...prev, published: false }));
      
      toast({
        title: 'Deletion Scheduled',
        description: 'Product will be permanently deleted in 48 hours. It is now hidden from buyers.',
      });
    } catch (error) {
      console.error('Error scheduling deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule deletion',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingDeletion(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsProcessingDeletion(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          scheduled_deletion_at: null,
          published: true
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setScheduledDeletionAt(null);
      setFormData(prev => ({ ...prev, published: true }));
      
      toast({
        title: 'Product Restored',
        description: 'Product has been restored and is now visible to buyers.',
      });
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel deletion',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingDeletion(false);
    }
  };

  const addPerk = () => {
    setPerks([...perks, { icon: 'star', label: '', color: '#22c55e' }]);
  };

  const updatePerk = (index: number, field: string, value: string) => {
    const updated = [...perks];
    updated[index] = { ...updated[index], [field]: value };
    setPerks(updated);
  };

  const removePerk = (index: number) => {
    setPerks(perks.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="bg-card border-b p-4">
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Clean Header */}
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/seller-dashboard')}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manage Product</h1>
            <p className="text-sm text-muted-foreground">Edit or delete your product</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Product Information */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-border/50 rounded-2xl">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (Le)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label>MOQ</Label>
                <Input
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div>
                <Label>Model Number</Label>
                <Input
                  value={formData.model_number}
                  onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="electronics, wireless, premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Material</Label>
                <Input
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
              <div>
                <Label>Origin</Label>
                <Input
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Warranty</Label>
              <Input
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Inquiry Only</Label>
              <Switch
                checked={formData.inquiry_only}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, inquiry_only: checked })
                }
              />
            </div>

            <div>
              <Label>Product Condition</Label>
              <Input
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder="Brand New, Like New, Used, etc."
              />
            </div>

            <div>
              <Label>Product Video URL (optional)</Label>
              <Input
                value={formData.product_video_url}
                onChange={(e) => setFormData({ ...formData, product_video_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Warranty Type</Label>
              <Input
                value={formData.warranty_type}
                onChange={(e) => setFormData({ ...formData, warranty_type: e.target.value })}
                placeholder="Store, Manufacturer, etc."
              />
            </div>

            <div>
              <Label>Support Contact</Label>
              <Input
                value={formData.support_contact}
                onChange={(e) => setFormData({ ...formData, support_contact: e.target.value })}
                placeholder="Phone/WhatsApp"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={replacementAvailable}
                onCheckedChange={setReplacementAvailable}
              />
              <Label>Replacement Available</Label>
            </div>

            <div>
              <Label>Seller Story / Product Background</Label>
              <Textarea
                value={formData.seller_story}
                onChange={(e) => setFormData({ ...formData, seller_story: e.target.value })}
                rows={4}
                placeholder="Tell buyers about this product..."
              />
            </div>

            <div>
              <Label>Product Requirements</Label>
              <Textarea
                value={formData.product_requirements}
                onChange={(e) => setFormData({ ...formData, product_requirements: e.target.value })}
                rows={3}
                placeholder="Assembly, tools needed, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-border/50 rounded-2xl">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <TargetAudienceSelector selected={targetAudience} onChange={setTargetAudience} />
          </CardContent>
        </Card>

        {/* Variants */}
        <VariantManager variants={variants} onChange={setVariants} />

        {/* Technical Specs */}
        <TechnicalSpecsManager specs={technicalSpecs} onChange={setTechnicalSpecs} />

        {/* Tags & Badges */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-border/50 rounded-2xl">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              Tags & Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>Enhancement Tags (comma-separated)</Label>
              <Input
                value={enhancementTags.join(', ')}
                onChange={(e) => setEnhancementTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Trending, Luxury, Handmade, etc."
              />
            </div>

            <div>
              <Label>Safety Tags (comma-separated)</Label>
              <Input
                value={safetyTags.join(', ')}
                onChange={(e) => setSafetyTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Fragile, Temperature sensitive, etc."
              />
            </div>

            <div>
              <Label>Eco Badges (comma-separated)</Label>
              <Input
                value={ecoBadges.join(', ')}
                onChange={(e) => setEcoBadges(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Recyclable, Sustainable, Organic, etc."
              />
            </div>

            <div>
              <Label>Custom Labels (comma-separated)</Label>
              <Input
                value={customLabels.join(', ')}
                onChange={(e) => setCustomLabels(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Wholesale only, Made-to-order, etc."
              />
            </div>

            <div>
              <Label>Included in Box (comma-separated)</Label>
              <Input
                value={includedInBox.join(', ')}
                onChange={(e) => setIncludedInBox(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Charger, Manual, Cables, etc."
              />
            </div>

            <div>
              <Label>Product Highlights (comma-separated)</Label>
              <Input
                value={productHighlights.join(', ')}
                onChange={(e) => setProductHighlights(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="3-5 key product benefits"
              />
            </div>

            <div>
              <Label>SEO Keywords (comma-separated)</Label>
              <Input
                value={seoKeywords.join(', ')}
                onChange={(e) => setSeoKeywords(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="Search keywords for better discovery"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Perks */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-border/50 rounded-2xl">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                Product Perks
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addPerk} className="rounded-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Perk
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {perks.map((perk, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  placeholder="Label"
                  value={perk.label}
                  onChange={(e) => updatePerk(index, 'label', e.target.value)}
                  className="flex-1"
                />
                <select
                  value={perk.icon}
                  onChange={(e) => updatePerk(index, 'icon', e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="star">⭐ Star</option>
                  <option value="zap">⚡ Zap</option>
                  <option value="truck">🚚 Truck</option>
                  <option value="shield">🛡️ Shield</option>
                  <option value="leaf">🌿 Leaf</option>
                  <option value="award">🏆 Award</option>
                </select>
                <Input
                  type="color"
                  value={perk.color}
                  onChange={(e) => updatePerk(index, 'color', e.target.value)}
                  className="w-16"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePerk(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Deletion Banner */}
        {scheduledDeletionAt && (
          <Card className="bg-destructive/10 border-destructive/30 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Scheduled for Deletion</h3>
                  <p className="text-sm text-destructive/80">
                    This product will be permanently deleted in {(() => {
                      const now = new Date().getTime();
                      const deletionTime = new Date(scheduledDeletionAt).getTime();
                      const diff = deletionTime - now;
                      if (diff <= 0) return 'shortly';
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      return `${hours}h ${minutes}m`;
                    })()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                  onClick={handleCancelDeletion}
                  disabled={isProcessingDeletion}
                >
                  {isProcessingDeletion ? 'Restoring...' : 'Cancel Deletion'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-4">
          <Button 
            onClick={handleSave} 
            disabled={saving || !!scheduledDeletionAt} 
            className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
          {!scheduledDeletionAt && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 h-12 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog - 48hr safe deletion */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl text-center">Schedule Product Deletion?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-center">
              This product will be hidden from buyers immediately and permanently deleted in <strong>48 hours</strong>. 
              You can cancel the deletion anytime before it's finalized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleScheduleDeletion} 
              className="bg-destructive hover:bg-destructive/90 rounded-full"
              disabled={isProcessingDeletion}
            >
              {isProcessingDeletion ? 'Processing...' : 'Schedule Deletion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManagement;
