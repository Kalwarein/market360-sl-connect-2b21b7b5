import { Card, CardContent } from './ui/card';
import { DollarSign, Calendar, Truck, FileText } from 'lucide-react';

interface QuotationCardProps {
  price: number;
  deliveryDate: string;
  shippingCost: number;
  note?: string;
}

export const QuotationCard = ({
  price,
  deliveryDate,
  shippingCost,
  note,
}: QuotationCardProps) => {
  const totalCost = price + shippingCost;

  return (
    <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-secondary font-semibold mb-3">
          <DollarSign className="h-5 w-5" />
          <span className="text-sm">Price Quotation</span>
        </div>

        <div className="bg-background/80 rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Product Price:</span>
            <span className="text-lg font-bold text-secondary">
              Le {price.toLocaleString()}
            </span>
          </div>

          {shippingCost > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Shipping:</span>
              </div>
              <span className="text-sm font-medium">
                Le {shippingCost.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between items-center">
            <span className="text-sm font-semibold">Total:</span>
            <span className="text-xl font-bold text-primary">
              Le {totalCost.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Delivery by:</span>
            <span className="text-sm font-medium">
              {new Date(deliveryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {note && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-xs font-semibold text-muted-foreground">Note:</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{note}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
