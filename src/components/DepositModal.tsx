import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DepositModal = ({ open, onOpenChange, onSuccess }: DepositModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !phone || !referenceNumber) {
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
        reference_number: referenceNumber,
        screenshot_url: screenshotUrl,
      });

      if (error) throw error;

      toast.success('Deposit request submitted successfully!');
      setAmount('');
      setPhone('');
      setReferenceNumber('');
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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Top Up Wallet
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate('/how-to-top-up');
              }}
              className="text-primary hover:text-primary-hover"
            >
              <Info className="h-4 w-4 mr-1" />
              How to Top Up
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-xl p-5 shadow-sm animate-fade-in">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-orange-500/10 rounded-full">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-semibold text-gray-900">Orange Money Payment</p>
                <ol className="space-y-2 leading-relaxed list-decimal list-inside">
                  <li>Send money to: <strong className="text-orange-700">078444807</strong></li>
                  <li>Save the Orange Money reference number from SMS</li>
                  <li>Enter details below and paste the reference number</li>
                  <li>Upload screenshot of SMS (optional but recommended)</li>
                </ol>
                <p className="text-xs text-orange-700 font-semibold mt-3 pt-3 border-t border-orange-200">
                  Note: A 2% processing fee applies
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-foreground">
              Amount (SLL)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference" className="text-sm font-semibold text-foreground">
              Orange Money Reference Number *
            </Label>
            <Input
              id="reference"
              type="text"
              placeholder="Paste reference number from SMS"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">
              📱 Copy the reference number from your Orange Money SMS
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot" className="text-sm font-semibold text-foreground">
              Payment Proof (Optional)
            </Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300 group">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
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
            <p className="text-xs text-muted-foreground mt-2">
              💡 Upload proof for faster processing
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl font-semibold transition-all hover:scale-105"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
