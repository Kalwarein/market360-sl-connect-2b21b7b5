import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface QuotationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    price: number;
    deliveryDate: string;
    shippingCost: number;
    note: string;
  }) => void;
}

export const QuotationModal = ({ open, onClose, onSubmit }: QuotationModalProps) => {
  const [price, setPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!price || !deliveryDate) return;

    onSubmit({
      price: parseFloat(price),
      deliveryDate,
      shippingCost: parseFloat(shippingCost) || 0,
      note,
    });

    // Reset form
    setPrice('');
    setDeliveryDate('');
    setShippingCost('');
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Quotation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (Le) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery">Delivery Date *</Label>
            <Input
              id="delivery"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping">Shipping Cost (Le)</Label>
            <Input
              id="shipping"
              type="number"
              placeholder="Enter shipping cost"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Additional Note</Label>
            <Textarea
              id="note"
              placeholder="Any special terms or conditions..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!price || !deliveryDate}>
            Send Quotation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
