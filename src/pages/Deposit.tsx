import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Phone, Loader2, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const QUICK_AMOUNTS = [10, 100, 200, 500];

interface DepositResult {
  ussd_code: string;
  amount: number;
  reference: string;
  expires_at: string;
  instructions: string;
}

const Deposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleDeposit = async () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountNum < 1) {
      toast.error('Minimum deposit is SLE 1');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('monime-create-deposit', {
        body: { amount: amountNum },
      });

      if (error) {
        console.error('Deposit error:', error);
        throw new Error(error.message || 'Failed to initiate deposit');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create deposit');
      }

      setDepositResult(data.data);
      toast.success('Payment code generated!');
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  const copyUssdCode = () => {
    if (depositResult?.ussd_code) {
      navigator.clipboard.writeText(depositResult.ussd_code);
      toast.success('USSD code copied!');
    }
  };

  const handleNewDeposit = () => {
    setDepositResult(null);
    setAmount('');
  };

  // Show USSD code screen after successful deposit initiation
  if (depositResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-24">
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
              <h1 className="text-xl font-bold text-foreground">Complete Payment</h1>
              <p className="text-sm text-muted-foreground">Dial the code below</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Success Card */}
          <Card className="border-2 border-success/30 bg-gradient-to-br from-success/10 to-success/5 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-success/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Payment Code Ready</h3>
                  <p className="text-sm text-muted-foreground">Dial this code to complete your payment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* USSD Code Display */}
          <Card className="border-2 border-primary shadow-xl bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="p-8 text-center space-y-6">
              <div className="p-6 bg-card rounded-2xl border-2 border-primary/30 shadow-inner">
                <p className="text-sm text-muted-foreground mb-2">Dial this code:</p>
                <p className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-wider">
                  {depositResult.ussd_code}
                </p>
              </div>

              <Button
                onClick={copyUssdCode}
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold text-base border-2 hover:bg-primary/10"
              >
                <Copy className="mr-2 h-5 w-5" />
                Copy Code
              </Button>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Amount to pay:</p>
                <p className="text-2xl font-bold text-foreground">
                  SLE {depositResult.amount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-2 border-border shadow-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                How to Complete Payment
              </h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span>Open your phone's dialer app</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span>Dial: <strong className="text-primary font-mono">{depositResult.ussd_code}</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span>Follow the prompts and enter your PIN to confirm</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                  <span>Your wallet will be credited instantly after payment</span>
                </li>
              </ol>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⏰ This code expires in 30 minutes. Reference: {depositResult.reference}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/wallet')}
              className="flex-1 h-14 rounded-2xl font-bold text-base border-2"
            >
              Back to Wallet
            </Button>
            <Button
              onClick={handleNewDeposit}
              className="flex-1 h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/40"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              New Deposit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Initial deposit form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-24">
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
            <h1 className="text-xl font-bold text-foreground">Top Up Wallet</h1>
            <p className="text-sm text-muted-foreground">Add funds with Mobile Money</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Amount Input */}
        <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
          <CardContent className="p-6 space-y-4">
            <Label htmlFor="amount" className="text-base font-bold text-foreground">
              Enter Amount (SLE)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-16 text-3xl font-bold text-center rounded-2xl border-2 focus:border-primary shadow-sm"
              min="1"
            />
          </CardContent>
        </Card>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_AMOUNTS.map((value) => (
            <Button
              key={value}
              variant={amount === value.toString() ? 'default' : 'outline'}
              onClick={() => handleQuickAmount(value)}
              className="h-14 text-lg font-bold rounded-2xl border-2 transition-all"
            >
              {value}
            </Button>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-bold text-lg text-foreground">How it Works</h3>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  <li>1. Enter your amount and tap "Pay Now"</li>
                  <li>2. You'll receive a USSD code to dial</li>
                  <li>3. Dial the code and approve payment</li>
                  <li>4. Wallet credited instantly!</li>
                </ol>
                <p className="text-sm font-bold text-success pt-2 border-t border-primary/20 mt-3">
                  ✓ Supports Orange Money & Africell Money
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleDeposit}
          disabled={loading || !amount}
          className="w-full h-16 rounded-2xl font-bold text-xl shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Generating Code...
            </>
          ) : (
            <>
              Pay Now with Market360
            </>
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/wallet')}
          className="w-full h-14 rounded-2xl font-bold text-base border-2"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default Deposit;