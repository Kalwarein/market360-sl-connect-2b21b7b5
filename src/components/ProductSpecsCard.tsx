import { Card, CardContent } from './ui/card';
import { Package, Shield, Truck, Tag } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProductSpecsCardProps {
  product: any;
}

export const ProductSpecsCard = ({ product }: ProductSpecsCardProps) => {
  const technicalSpecs = product.technical_specs || {};
  const shippingDetails = product.shipping_details || {};
  const variants = product.variants || [];
  const perks = product.perks || [];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold mb-3">
          <Package className="h-5 w-5" />
          <span>Complete Product Specifications</span>
        </div>

        {/* Price & MOQ */}
        <div className="bg-background/80 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">Pricing</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-bold text-primary">Le {product.price?.toLocaleString()}</span>
            </div>
            {product.moq && product.moq > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min. Order:</span>
                <span className="font-medium">{product.moq} units</span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Specs */}
        {Object.keys(technicalSpecs).length > 0 && (
          <div className="bg-background/80 rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Technical Details</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(technicalSpecs).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warranty */}
        {product.warranty && (
          <div className="bg-background/80 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Warranty</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{product.warranty} years</span>
              </div>
              {product.warranty_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{product.warranty_type}</span>
                </div>
              )}
              {product.support_contact && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Support:</span>
                  <span className="font-medium">{product.support_contact}</span>
                </div>
              )}
              {product.replacement_available && (
                <Badge variant="secondary" className="mt-1">Replacement Available</Badge>
              )}
            </div>
          </div>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="bg-background/80 rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Available Variants</h4>
            <div className="space-y-2">
              {variants.map((variant: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    {variant.color && (
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: variant.color }}
                      />
                    )}
                    <span>{variant.name || `Variant ${idx + 1}`}</span>
                  </div>
                  {variant.price && (
                    <span className="font-medium text-primary">
                      Le {variant.price.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping & Delivery */}
        {shippingDetails && (
          <div className="bg-background/80 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Delivery Information</h4>
            </div>
            <div className="space-y-1 text-sm">
              {shippingDetails.estimated_delivery_time && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Time:</span>
                  <span className="font-medium">{shippingDetails.estimated_delivery_time}</span>
                </div>
              )}
              {shippingDetails.shipping_from && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ships From:</span>
                  <span className="font-medium">{shippingDetails.shipping_from}</span>
                </div>
              )}
              {shippingDetails.shipping_method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="font-medium">{shippingDetails.shipping_method}</span>
                </div>
              )}
              {shippingDetails.return_policy && (
                <Badge variant="secondary" className="mt-1">Returns Accepted</Badge>
              )}
            </div>
          </div>
        )}

        {/* Perks */}
        {perks.length > 0 && (
          <div className="bg-background/80 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Special Features</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {perks.map((perk: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {perk.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Included in Box */}
        {product.included_in_box && product.included_in_box.length > 0 && (
          <div className="bg-background/80 rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">What's in the Box</h4>
            <ul className="text-sm space-y-1">
              {product.included_in_box.map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
