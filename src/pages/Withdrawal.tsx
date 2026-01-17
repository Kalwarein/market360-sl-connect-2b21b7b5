import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Wallet, Loader2, CheckCircle, Phone, AlertTriangle, Snowflake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import FrozenWalletOverlay from '@/components/FrozenWalletOverlay';

type Provider = 'm17' | 'm18';

const Withdrawal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [detectedProvider, setDetectedProvider] = useState<Provider | null>(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [checkingFreeze, setCheckingFreeze] = useState(true);

  useEffect(() => {
    loadBalance();
    checkFrozenStatus();
  }, [user]);

  const checkFrozenStatus = async () => {
    if (!user) {
      setCheckingFreeze(false);
      return;
    }
    
    try {
      const { data: frozen } = await supabase
        .from('wallet_freezes')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      setIsFrozen(!!frozen);
    } catch (error) {
      console.error('Error checking freeze status:', error);
    } finally {
      setCheckingFreeze(false);
    }
  };

  // Detect provider based on phone number
  const detectProvider = (phoneNumber: string): Provider | null => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 2) return null;
    
    // Handle different formats: 076xxx, 76xxx, +23276xxx, 23276xxx
    let prefix = '';
    if (cleaned.startsWith('232')) {
      prefix = cleaned.substring(3, 5);
    } else if (cleaned.startsWith('0')) {
      prefix = cleaned.substring(1, 3);
    } else {
      prefix = cleaned.substring(0, 2);
    }
    
    // Orange Money prefixes: 76, 77, 78, 79, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39
    const orangePrefixes = ['76', '77', '78', '79', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39'];
    // Africell prefixes: 88, 99, 80, 81, 82, 83, 84, 85, 86, 87, 25
    const africellPrefixes = ['88', '99', '80', '81', '82', '83', '84', '85', '86', '87', '25'];

    if (orangePrefixes.includes(prefix)) {
      return 'm17';
    } else if (africellPrefixes.includes(prefix)) {
      return 'm18';
    }
    return null;
  };

  useEffect(() => {
    const provider = detectProvider(phone);
    setDetectedProvider(provider);
  }, [phone]);

  const loadBalance = async () => {
    if (!user) return;
    
    try {
      setLoadingBalance(true);
      
      // Use the ledger-based balance function (returns balance in cents)
      const { data, error } = await supabase.rpc('get_wallet_balance', { 
        p_user_id: user.id 
      });

      if (error) {
        console.error('Balance fetch error:', error);
        // Fallback to old wallet table for backwards compatibility
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance_leones')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Old table stores balance in SLE directly
        setCurrentBalance(walletData?.balance_leones || 0);
      } else {
        // RPC returns balance in cents, convert to SLE for display
        const balanceInCents = data || 0;
        const balanceInSLE = balanceInCents / 100;
        console.log('Balance loaded:', { balanceInCents, balanceInSLE });
        setCurrentBalance(balanceInSLE);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (!detectedProvider) {
      toast.error('Could not detect mobile money provider. Please check the phone number.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('monime-create-withdrawal', {
        body: {
          amount: amountNum,
          phone_number: phone,
          provider_id: detectedProvider,
        },
      });

      if (error) {
        console.error('Withdrawal error:', error);
        throw new Error(error.message || 'Failed to initiate withdrawal');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create withdrawal');
      }

      setWithdrawalSuccess(true);
      toast.success('Withdrawal initiated successfully!');
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to initiate withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking freeze status
  if (checkingFreeze) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Frozen wallet state
  if (isFrozen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-950 dark:via-cyan-950 dark:to-blue-900 pb-24">
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
              <p className="text-sm text-muted-foreground">Send to Mobile Money</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="border-4 border-blue-300/50 shadow-2xl relative overflow-hidden">
            <FrozenWalletOverlay message="Your wallet is frozen and cannot process withdrawals. Please contact support for assistance." />
            <CardContent className="p-12 h-64" />
          </Card>
          
          <Button
            variant="outline"
            onClick={() => navigate('/wallet')}
            className="w-full h-14 rounded-2xl font-bold text-base border-2 mt-6"
          >
            Back to Wallet
          </Button>
        </div>
      </div>
    );
  }

  // Success screen
  if (withdrawalSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-success/5 to-success/10 pb-24">
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
              <h1 className="text-xl font-bold text-foreground">Withdrawal Initiated</h1>
              <p className="text-sm text-muted-foreground">Processing your request</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <Card className="border-2 border-success/30 bg-gradient-to-br from-success/10 to-success/5 shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Withdrawal Processing</h2>
                <p className="text-muted-foreground">
                  Your withdrawal of <strong className="text-foreground">SLE {parseFloat(amount).toLocaleString()}</strong> is being processed.
                </p>
              </div>
              <div className="p-4 bg-card rounded-xl border-2 border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Sending to:</p>
                <p className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  {phone}
                </p>
                <Badge className="mt-2" variant="secondary">
                  {detectedProvider === 'm17' ? 'Orange Money' : 'Africell Money'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive the funds in your mobile money account shortly. 
                You'll be notified when the transfer is complete.
              </p>
            </CardContent>
          </Card>

          <Button
            onClick={() => navigate('/wallet')}
            className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/40"
          >
            Back to Wallet
          </Button>
        </div>
      </div>
    );
  }

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
            <p className="text-sm text-muted-foreground">Send to Mobile Money</p>
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
                    {loadingBalance ? '...' : `SLE ${currentBalance.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Banner */}
          <Card className="border-2 border-warning bg-gradient-to-br from-warning/10 to-warning/5 shadow-lg">
            <CardContent className="p-4">
              <div className="flex gap-3 items-center">
                <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  ⚠️ Transactions to the wrong number cannot be reversed. Please double-check the phone number.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Phone Number Input */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-4">
              <Label htmlFor="phone" className="text-base font-bold text-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Recipient Phone Number
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 076123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 text-lg rounded-2xl border-2 focus:border-primary shadow-sm"
                required
              />
              
              {/* Provider Detection */}
              {phone.length >= 2 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  {detectedProvider ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      <Badge variant="secondary" className="text-sm">
                        {detectedProvider === 'm17' ? '🟠 Orange Money' : '🔵 Africell Money'}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span className="text-sm text-muted-foreground">
                        Could not detect provider
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount Input */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="amount" className="text-base font-bold text-foreground flex items-center gap-2">
                Amount to Withdraw (SLE)
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
              
              {amount && parseFloat(amount) > 0 && (
                <div className="p-3 bg-muted/50 rounded-xl space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span>SLE {parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee (2%)</span>
                    <span className="text-destructive">-SLE {(parseFloat(amount) * 0.02).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>You'll Receive</span>
                    <span className="text-success">SLE {(parseFloat(amount) * 0.98).toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              {amount && parseFloat(amount) > currentBalance && (
                <p className="text-sm text-destructive font-medium animate-fade-in">
                  ❌ Amount exceeds available balance
                </p>
              )}
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
              disabled={loading || !amount || !phone || !detectedProvider || parseFloat(amount) > currentBalance || loadingBalance}
              className="flex-1 h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw Now'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Withdrawal;