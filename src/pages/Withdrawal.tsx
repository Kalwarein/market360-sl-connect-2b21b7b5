import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Withdrawal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    loadBalance();
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance_leones')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentBalance(data?.balance_leones || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      navigate('/wallet');
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const finalAmount = amount ? (parseFloat(amount) * 0.98).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warning/5 to-destructive/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wallet')}
            className="rounded-full hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Withdraw Funds</h1>
            <p className="text-sm text-muted-foreground">Request withdrawal from wallet</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Balance Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary via-primary/80 to-accent shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80 font-medium">Available Balance</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    SLL {currentBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Banner */}
          <Card className="border-2 border-warning bg-gradient-to-br from-warning/10 via-warning/5 to-destructive/5 shadow-lg">
            <CardContent className="p-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-warning/20 rounded-2xl">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="font-bold text-lg text-foreground">Important Notice</h3>
                  <p className="text-base font-bold text-destructive">
                    ⚠️ A 2% processing fee will be deducted from your withdrawal amount.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The amount shown below is what you will receive in your Orange Money account after fees.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="amount" className="text-base font-bold text-foreground flex items-center gap-2">
                Amount to Withdraw (SLL)
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={currentBalance}
                className="h-14 text-xl font-bold rounded-2xl border-2 focus:border-primary shadow-sm"
                required
              />
              
              {amount && (
                <Card className="border-2 border-warning bg-gradient-to-br from-yellow-50 to-orange-50 shadow-inner animate-fade-in mt-4">
                  <CardContent className="p-5 space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Amount after 2% fee:</p>
                    <p className="text-3xl font-bold text-primary">SLL {finalAmount}</p>
                    <p className="text-xs text-destructive font-bold mt-2 pt-2 border-t border-warning/30">
                      💳 This is what we will send to your Orange Money account
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Phone Number */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="phone" className="text-base font-bold text-foreground flex items-center gap-2">
                Phone Number
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number for payment"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 rounded-2xl border-2 focus:border-primary shadow-sm"
                required
              />
            </CardContent>
          </Card>

          {/* Reference Number */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="reference" className="text-base font-bold text-foreground flex items-center gap-2">
                Orange Money Reference Number
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reference"
                type="text"
                placeholder="Enter your Orange Money reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-14 rounded-2xl border-2 focus:border-primary shadow-sm font-mono"
                required
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                💳 Enter the Orange Money account reference for withdrawal
              </p>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate('/wallet')}
              className="flex-1 h-14 rounded-2xl font-bold text-base border-2 hover:bg-muted transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting || !amount || parseFloat(amount) > currentBalance || !referenceNumber}
              className="flex-1 h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {submitting ? 'Processing...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Withdrawal;
