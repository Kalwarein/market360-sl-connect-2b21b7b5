import { Card, CardContent } from './ui/card';
import { Package, Store } from 'lucide-react';

interface EnquiryCardProps {
  productName: string;
  productImage: string;
  productPrice: number;
  storeName: string;
  productId: string;
  moq?: number;
}

export const EnquiryCard = ({
  productName,
  productImage,
  productPrice,
  storeName,
  productId,
  moq,
}: EnquiryCardProps) => {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Package className="h-5 w-5" />
            <span className="text-sm">Product Enquiry</span>
          </div>
        </div>
        
        <div className="flex gap-3 bg-background/50 rounded-xl p-3">
          <img
            src={productImage}
            alt={productName}
            className="w-20 h-20 object-cover rounded-lg shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2 mb-1">
              {productName}
            </h4>
            <p className="text-lg font-bold text-primary mb-1">
              Le {productPrice.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store className="h-3 w-3" />
              <span className="truncate">{storeName}</span>
            </div>
            {moq && moq > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                MOQ: {moq} units
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-primary/10">
          <p className="text-xs text-muted-foreground">
            Product ID: {productId.substring(0, 8)}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
