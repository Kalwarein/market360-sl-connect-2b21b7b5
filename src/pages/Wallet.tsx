import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Clock, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reference: string;
  status: string;
  created_at: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      // Load wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance_leones')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setBalance(walletData.balance_leones);

      // Load transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', (await supabase.from('wallets').select('id').eq('user_id', user?.id).single()).data?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transError) throw transError;
      setTransactions(transData || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositPhone) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      let screenshotUrl = '';

      if (depositScreenshot) {
        const fileExt = depositScreenshot.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('kyc-docs')
          .upload(fileName, depositScreenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('kyc-docs')
          .getPublicUrl(fileName);
        screenshotUrl = publicUrl;
      }

      const { error } = await supabase.from('wallet_requests').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: parseFloat(depositAmount),
        phone_number: depositPhone,
        screenshot_url: screenshotUrl,
      });

      if (error) throw error;

      toast.success('Deposit request submitted. Awaiting admin approval.');
      setDepositAmount('');
      setDepositPhone('');
      setDepositScreenshot(null);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawPhone) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('wallet_requests').insert({
        user_id: user?.id,
        type: 'withdrawal',
        amount,
        phone_number: withdrawPhone,
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted. Awaiting admin approval.');
      setWithdrawAmount('');
      setWithdrawPhone('');
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'earning':
        return <ArrowDownCircle className="h-5 w-5 text-success" />;
      case 'withdrawal':
      case 'refund':
        return <ArrowUpCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">My Wallet</h1>
        <p className="text-sm opacity-90">Manage your funds</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-primary">
                  Le {balance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="transactions">History</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deposit via Orange Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer funds to Market360 via Orange Money and get your wallet topped up
                </p>
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (Le) *</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-phone">Orange Money Number *</Label>
                  <Input
                    id="deposit-phone"
                    type="tel"
                    placeholder="+232 XX XXX XXXX"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-screenshot">Transaction Screenshot</Label>
                  <div className="flex gap-2">
                    <Input
                      id="deposit-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDepositScreenshot(e.target.files?.[0] || null)}
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload proof of payment for faster approval
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleDeposit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Deposit Request'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw to Orange Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg mb-4">
                  <p className="text-sm">
                    <span className="font-medium">Available Balance:</span> Le {balance.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (Le) *</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={balance}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-phone">Orange Money Number *</Label>
                  <Input
                    id="withdraw-phone"
                    type="tel"
                    placeholder="+232 XX XXX XXXX"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Withdrawal requests are processed within 24 hours
                </p>
                <Button 
                  className="w-full" 
                  onClick={handleWithdraw}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg h-20" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {transaction.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'deposit' || transaction.type === 'earning' 
                            ? 'text-success' 
                            : 'text-destructive'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'earning' ? '+' : '-'}
                          Le {transaction.amount.toLocaleString()}
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;