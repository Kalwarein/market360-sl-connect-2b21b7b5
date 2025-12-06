import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Clock, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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

  useEffect(() => {
    if (user) {
      loadWalletData();

      // Subscribe to realtime wallet updates
      const walletChannel = supabase
        .channel('wallet-balance-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadWalletData();
          }
        )
        .subscribe();

      // Subscribe to transaction updates
      const txChannel = supabase
        .channel('transaction-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
          },
          () => {
            loadWalletData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(walletChannel);
        supabase.removeChannel(txChannel);
      };
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      // Load wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance_leones')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (walletError) {
        console.error('Wallet fetch error:', walletError);
        throw walletError;
      }

      if (!walletData) {
        console.log('No wallet found, creating one...');
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user?.id, balance_leones: 0 })
          .select('id, balance_leones')
          .single();
        
        if (createError) {
          console.error('Wallet creation error:', createError);
          throw createError;
        }
        
        setBalance(0);
        setTransactions([]);
        return;
      }

      setBalance(walletData.balance_leones);

      // Load transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transError) {
        console.error('Transaction fetch error:', transError);
        throw transError;
      }

      setTransactions(transData || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'earning':
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case 'withdrawal':
      case 'refund':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">My Wallet</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <WalletIcon className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Available Balance</span>
              </div>
              <p className="text-4xl font-bold mb-1">
                SLL {loading ? '...' : balance.toLocaleString()}
              </p>
              <p className="text-sm opacity-70">Sierra Leonean Leones</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={() => navigate('/deposit')}
            className="h-16 text-base font-semibold rounded-xl shadow-lg"
          >
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Deposit
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/withdrawal')}
            className="h-16 text-base font-semibold rounded-xl border-2"
          >
            <ArrowUpCircle className="mr-2 h-5 w-5" />
            Withdraw
          </Button>
        </div>
        
        {/* Deposit History Link */}
        <Button
          onClick={() => navigate('/deposit-history')}
          variant="ghost"
          className="w-full text-primary hover:text-primary/80 rounded-xl"
        >
          <History className="mr-2 h-4 w-4" />
          View Deposit History
        </Button>

        {/* Recent Transactions */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                transactions.map((trans) => (
                  <div
                    key={trans.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(trans.type)}
                      <div>
                        <p className="font-medium capitalize">{trans.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(trans.created_at), 'MMM dd, yyyy • HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        trans.amount > 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {trans.amount > 0 ? '+' : ''}SLL {Math.abs(trans.amount).toLocaleString()}
                      </p>
                      <Badge variant={
                        trans.status === 'completed' ? 'default' : 
                        trans.status === 'pending' ? 'secondary' : 
                        'destructive'
                      } className="text-xs">
                        {trans.status}
                      </Badge>
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