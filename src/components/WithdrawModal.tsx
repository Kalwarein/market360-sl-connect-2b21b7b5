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
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted successfully!');
      setAmount('');
      setPhone('');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Withdraw Funds</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Withdrawal Information:</p>
                <p>A 2% processing fee will be deducted from your withdrawal amount.</p>
                <p className="mt-2">Available Balance: <span className="font-bold text-primary">SLL {currentBalance.toLocaleString()}</span></p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="withdraw-amount">Amount to Withdraw (SLL)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
              max={currentBalance}
            />
            {amount && (
              <p className="text-sm text-gray-600 mt-1">
                You will receive: <span className="font-semibold text-primary">SLL {finalAmount}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="withdraw-phone">Phone Number</Label>
            <Input
              id="withdraw-phone"
              type="tel"
              placeholder="Enter phone number for payment"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !amount || parseFloat(amount) > currentBalance}
            className="w-full h-12 text-base font-semibold"
          >
            {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
