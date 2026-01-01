import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Wallet, TrendingUp, TrendingDown, 
  Clock, CheckCircle, XCircle, Search,
  ArrowUpRight, ArrowDownLeft, RefreshCw, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'earning' | 'refund';
  status: string;
  reference: string | null;
  created_at: string;
  metadata: any;
}

interface WalletData {
  id: string;
  user_id: string;
  balance_leones: number;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
}

const AdminUserWallet = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalWithdrawals: 0,
    totalDeposits: 0,
    pendingBalance: 0,
  });

  useEffect(() => {
    if (userId) {
      loadWalletData();
    }
  }, [userId]);

  const loadWalletData = async () => {
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      setUserProfile(profile);

      // Load wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      setWallet(walletData);

      if (walletData) {
        // Load transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false });

        setTransactions(txData || []);

        // Calculate stats
        const earnings = (txData || [])
          .filter(t => t.type === 'earning' && t.status === 'completed')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const withdrawals = (txData || [])
          .filter(t => t.type === 'withdrawal' && t.status === 'completed')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const deposits = (txData || [])
          .filter(t => t.type === 'deposit' && t.status === 'completed')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const pending = (txData || [])
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setStats({
          totalEarnings: earnings,
          totalWithdrawals: withdrawals,
          totalDeposits: deposits,
          pendingBalance: pending,
        });
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'earning':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: 'SLE',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate(`/admin/users/${userId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to User
        </Button>
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">User Wallet</h1>
            <p className="text-sm opacity-90">
              {userProfile?.name || userProfile?.email || 'Unknown User'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-4xl font-bold text-primary mt-1">
              {formatAmount(wallet?.balance_leones || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Total Earnings</span>
              </div>
              <p className="text-lg font-bold">{formatAmount(stats.totalEarnings)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <ArrowDownLeft className="h-4 w-4" />
                <span className="text-xs font-medium">Total Deposits</span>
              </div>
              <p className="text-lg font-bold">{formatAmount(stats.totalDeposits)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Total Withdrawals</span>
              </div>
              <p className="text-lg font-bold">{formatAmount(stats.totalWithdrawals)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Pending</span>
              </div>
              <p className="text-lg font-bold">{formatAmount(stats.pendingBalance)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="earning">Earnings</option>
                <option value="refund">Refunds</option>
              </select>
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {tx.reference && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {tx.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'refund'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'earning' || tx.type === 'refund' ? '+' : '-'}
                        {formatAmount(tx.amount)}
                      </p>
                      <div className="mt-1">{getStatusBadge(tx.status)}</div>
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

export default AdminUserWallet;
