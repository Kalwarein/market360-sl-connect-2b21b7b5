import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DepositModal } from '@/components/DepositModal';
import { WithdrawModal } from '@/components/WithdrawModal';

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
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

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
        .limit(50);

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
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
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
      </div>

      <div className="p-6 space-y-6">
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <WalletIcon className="h-6 w-6" />
                <span className="text-sm opacity-90">Available Balance</span>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">
              SLL {loading ? '...' : balance.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={() => setDepositModalOpen(true)}
            className="h-16 text-base font-semibold"
          >
            <ArrowUpCircle className="mr-2 h-5 w-5" />
            Top Up
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setWithdrawModalOpen(true)}
            className="h-16 text-base font-semibold"
          >
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Withdraw
          </Button>
        </div>

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
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                transactions.map((trans) => (
                  <div
                    key={trans.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(trans.type)}
                      <div>
                        <p className="font-medium capitalize">{trans.type}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(trans.created_at), 'MMM dd, yyyy - HH:mm')}
                        </p>
                        {trans.reference && (
                          <p className="text-xs text-gray-400">{trans.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        trans.amount > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {trans.amount > 0 ? '+' : ''}SLL {Math.abs(trans.amount).toLocaleString()}
                      </p>
                      <Badge variant={
                        trans.status === 'completed' ? 'default' : 
                        trans.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
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

      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        onSuccess={loadWalletData}
      />

      <WithdrawModal
        open={withdrawModalOpen}
        onOpenChange={setWithdrawModalOpen}
        onSuccess={loadWalletData}
        currentBalance={balance}
      />
    </div>
  );
};

export default Wallet;
