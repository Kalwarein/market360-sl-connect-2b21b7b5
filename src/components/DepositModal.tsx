import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DepositModal = ({ open, onOpenChange, onSuccess }: DepositModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !phone) {
      toast.error('Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      let screenshotUrl = '';

      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `deposit-${user?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        screenshotUrl = publicUrl;
      }

      const { error } = await supabase.from('wallet_requests').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: amountNum,
        phone_number: phone,
        screenshot_url: screenshotUrl,
      });

      if (error) throw error;

      toast.success('Deposit request submitted successfully!');
      setAmount('');
      setPhone('');
      setScreenshot(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Top Up Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Instructions:</p>
                <p>1. Send your payment to Market360's number</p>
                <p>2. Enter the amount and your phone number</p>
                <p>3. Upload proof of payment (optional)</p>
                <p className="mt-2 text-primary font-semibold">Note: A 2% processing fee applies</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount (SLL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="screenshot">Payment Proof (Optional)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {screenshot ? screenshot.name : 'Upload screenshot'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 text-base font-semibold"
          >
            {submitting ? 'Submitting...' : 'Submit Deposit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
