import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, Plus, Upload, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Variant {
  id: string;
  color?: string;
  size?: string;
  material?: string;
  style?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

export const VariantManager = ({ variants, onChange }: VariantManagerProps) => {
  const { toast } = useToast();
  const [newVariant, setNewVariant] = useState<Partial<Variant>>({
    quantity: 1,
    price: 0,
  });

  const handleAddVariant = () => {
    if (!newVariant.color && !newVariant.size && !newVariant.material && !newVariant.style) {
      toast({
        title: 'Variant Required',
        description: 'Please specify at least one variant property',
        variant: 'destructive',
      });
      return;
    }

    const variant: Variant = {
      id: Date.now().toString(),
      color: newVariant.color,
      size: newVariant.size,
      material: newVariant.material,
      style: newVariant.style,
      quantity: newVariant.quantity || 1,
      price: newVariant.price || 0,
      image: newVariant.image,
    };

    onChange([...variants, variant]);
    setNewVariant({ quantity: 1, price: 0 });
  };

  const handleRemoveVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const handleImageUpload = async (file: File, variantId?: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (variantId) {
        onChange(
          variants.map((v) =>
            v.id === variantId ? { ...v, image: publicUrl } : v
          )
        );
      } else {
        setNewVariant({ ...newVariant, image: publicUrl });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload variant image',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Product Variants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Variants */}
        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((variant) => (
              <Card key={variant.id} className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                      {variant.color && (
                        <div>
                          <span className="font-semibold">Color:</span>{' '}
                          <Badge variant="secondary">{variant.color}</Badge>
                        </div>
                      )}
                      {variant.size && (
                        <div>
                          <span className="font-semibold">Size:</span>{' '}
                          <Badge variant="secondary">{variant.size}</Badge>
                        </div>
                      )}
                      {variant.material && (
                        <div>
                          <span className="font-semibold">Material:</span>{' '}
                          <Badge variant="secondary">{variant.material}</Badge>
                        </div>
                      )}
                      {variant.style && (
                        <div>
                          <span className="font-semibold">Style:</span>{' '}
                          <Badge variant="secondary">{variant.style}</Badge>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Stock:</span> {variant.quantity}
                      </div>
                      <div>
                        <span className="font-semibold">Price:</span> Le {variant.price.toLocaleString()}
                      </div>
                      {variant.image && (
                        <div className="col-span-2">
                          <img
                            src={variant.image}
                            alt="Variant"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveVariant(variant.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Variant */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-sm">Add New Variant</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g., Red, Blue"
                value={newVariant.color || ''}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, color: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                placeholder="e.g., S, M, L, XL"
                value={newVariant.size || ''}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, size: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                placeholder="e.g., Cotton, Leather"
                value={newVariant.material || ''}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, material: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                placeholder="e.g., Casual, Formal"
                value={newVariant.style || ''}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, style: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="quantity">Stock Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={newVariant.quantity || 1}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, quantity: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="variant-price">Price (Le)</Label>
              <Input
                id="variant-price"
                type="number"
                min="0"
                value={newVariant.price || 0}
                onChange={(e) =>
                  setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="variant-image">Variant Image (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="variant-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {newVariant.image && (
                <img
                  src={newVariant.image}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
            </div>
          </div>
          <Button onClick={handleAddVariant} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
