import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Clock, RefreshCw, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatSLE } from '@/lib/currency';

interface LedgerEntry {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  reference: string | null;
  monime_ussd_code: string | null;
  created_at: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
      // Subscribe to realtime updates on wallet_ledger
      const channel = supabase
        .channel('wallet-ledger-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_ledger',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Ledger change:', payload);
            loadWalletData(); // Reload data on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      // Get ledger-based balance (Monime wallet system)
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { 
        p_user_id: user?.id 
      });

      if (balanceError) {
        console.error('Balance fetch error:', balanceError);
        setBalance(0);
      } else {
        // Balance from ledger is in Leones (not cents)
        setBalance(balanceData || 0);
      }

      // Load recent transactions from ledger
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (ledgerError) {
        console.error('Ledger fetch error:', ledgerError);
      } else {
        setTransactions(ledgerData || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending' || status === 'processing') {
      return <Loader2 className="h-5 w-5 text-warning animate-spin" />;
    }
    if (status === 'failed') {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    
    switch (type) {
      case 'deposit':
      case 'earning':
      case 'refund':
        return <ArrowDownCircle className="h-5 w-5 text-success" />;
      case 'withdrawal':
      case 'payment':
        return <ArrowUpCircle className="h-5 w-5 text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'reversed':
        return <Badge variant="outline">Reversed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAmountDisplay = (entry: LedgerEntry) => {
    const amount = entry.amount;
    const isCredit = ['deposit', 'earning', 'refund'].includes(entry.transaction_type);
    const isSuccessful = entry.status === 'success';
    
    // For failed withdrawals/payments, show as neutral (money wasn't actually deducted)
    if (!isSuccessful && !isCredit) {
      return (
        <span className="text-muted-foreground">
          {formatSLE(amount)}
        </span>
      );
    }
    
    return (
      <span className={isCredit ? 'text-success' : 'text-foreground'}>
        {formatSLE(amount, { showSign: true, isCredit })}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-background border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">My Wallet</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <WalletIcon className="h-6 w-6" />
                <span className="text-sm opacity-90">Available Balance</span>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-4xl font-bold mb-2">
              {loading ? 'Le ...' : formatSLE(balance)}
            </p>
            <p className="text-sm opacity-75">
              Powered by Market360 Wallet
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/deposit')}
            className="h-16 text-base font-semibold rounded-2xl shadow-lg shadow-primary/30"
          >
            <ArrowUpCircle className="mr-2 h-5 w-5" />
            Top Up
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/withdrawal')}
            className="h-16 text-base font-semibold rounded-2xl border-2"
          >
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Withdraw
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Instant deposits</strong> via Orange Money & Africell Money. No admin approval needed!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/wallet/activity')}
          className="w-full h-14 text-base font-semibold rounded-2xl border-2 flex items-center justify-center gap-2"
        >
          <BarChart3 className="h-5 w-5" />
          View Full Analytics & Activity
        </Button>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-2">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WalletIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No transactions yet</p>
                  <p className="text-sm mt-1">Top up your wallet to get started</p>
                </div>
              ) : (
                transactions.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => navigate(`/transaction/${entry.id}`)}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(entry.transaction_type, entry.status)}
                      <div>
                        <p className="font-medium capitalize">{entry.transaction_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), 'MMM dd, yyyy - HH:mm')}
                        </p>
                        {entry.reference && (
                          <p className="text-xs text-muted-foreground/70 font-mono">
                            {entry.reference}
                          </p>
                        )}
                        {entry.monime_ussd_code && entry.status === 'pending' && (
                          <p className="text-xs text-primary font-mono mt-1">
                            Dial: {entry.monime_ussd_code}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {getAmountDisplay(entry)}
                      </p>
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;