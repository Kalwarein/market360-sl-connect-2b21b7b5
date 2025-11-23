import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentBalance: number;
}

export const WithdrawModal = ({ open, onOpenChange, onSuccess, currentBalance }: WithdrawModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
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

    if (amountNum > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('wallet_requests').insert({
        user_id: user?.id,
        type: 'withdrawal',
        amount: amountNum,
        phone_number: phone,
        reference_number: referenceNumber,
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted successfully!');
      setAmount('');
      setPhone('');
      setReferenceNumber('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const finalAmount = amount ? (parseFloat(amount) * 0.95).toFixed(2) : '0.00';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-5 shadow-sm animate-fade-in">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-yellow-700" />
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-semibold text-gray-900">Withdrawal Information</p>
                <p className="leading-relaxed font-bold text-red-600">⚠️ IMPORTANT: A 2% processing fee will be deducted from your withdrawal amount.</p>
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="text-xs text-gray-600">Available Balance</p>
                  <p className="font-bold text-xl text-primary mt-1">SLL {currentBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdraw-amount" className="text-sm font-semibold text-foreground">
              Amount to Withdraw (SLL)
            </Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm text-lg font-semibold"
              max={currentBalance}
            />
            {amount && (
              <div className="mt-3 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400 animate-fade-in">
                <p className="text-sm font-semibold text-gray-700">Amount after 2% fee:</p>
                <p className="text-2xl font-bold text-primary mt-1">SLL {finalAmount}</p>
                <p className="text-xs text-red-600 mt-2 font-semibold">This is what we will send to your Orange Money account</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdraw-phone" className="text-sm font-semibold text-foreground">
              Phone Number
            </Label>
            <Input
              id="withdraw-phone"
              type="tel"
              placeholder="Enter phone number for payment"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdraw-reference" className="text-sm font-semibold text-foreground">
              Orange Money Reference Number *
            </Label>
            <Input
              id="withdraw-reference"
              type="text"
              placeholder="Enter your Orange Money reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="mt-2 h-12 rounded-xl border-2 border-border focus:border-primary transition-all duration-300 shadow-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">
              💳 Enter the Orange Money account reference for withdrawal
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
            disabled={submitting || !amount || parseFloat(amount) > currentBalance || !referenceNumber}
            className="flex-1 h-12 rounded-xl font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
          >
            {submitting ? 'Processing...' : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
