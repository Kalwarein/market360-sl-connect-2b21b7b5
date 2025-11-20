import { useState } from 'react';
import { Button } from './ui/button';
import { FileText, DollarSign, MapPin, CheckCircle } from 'lucide-react';
import { QuotationModal } from './QuotationModal';

interface SellerQuickActionsProps {
  onSendSpecs: () => void;
  onSendQuotation: (data: any) => void;
  onRequestDetails: () => void;
  onConfirmAvailability: () => void;
}

export const SellerQuickActions = ({
  onSendSpecs,
  onSendQuotation,
  onRequestDetails,
  onConfirmAvailability,
}: SellerQuickActionsProps) => {
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  return (
    <>
      <div className="border-t bg-gradient-to-r from-primary/5 to-secondary/5 p-3">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSendSpecs}
              className="gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Full Specs</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuotationModal(true)}
              className="gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Send Quote</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestDetails}
              className="gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            >
              <MapPin className="h-4 w-4" />
              <span className="text-xs">Get Address</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onConfirmAvailability}
              className="gap-2 bg-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">In Stock</span>
            </Button>
          </div>
        </div>
      </div>

      <QuotationModal
        open={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        onSubmit={(data) => {
          onSendQuotation(data);
          setShowQuotationModal(false);
        }}
      />
    </>
  );
};
