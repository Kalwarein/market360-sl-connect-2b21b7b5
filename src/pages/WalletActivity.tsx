import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, 
  Clock, RefreshCw, CheckCircle, XCircle, Loader2, TrendingUp, 
  TrendingDown, Activity, PieChart, BarChart3, Filter, Calendar,
  DollarSign, Zap, Target, Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts';

interface LedgerEntry {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  reference: string | null;
  monime_ussd_code: string | null;
  provider: string | null;
  created_at: string;
  metadata: any;
}

interface WalletStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalEarnings: number;
  totalRefunds: number;
  successRate: number;
  avgTransactionSize: number;
  transactionCount: number;
  pendingAmount: number;
}

const CHART_COLORS = {
  deposit: 'hsl(151, 91%, 34%)',
  withdrawal: 'hsl(203, 100%, 40%)',
  earning: 'hsl(38, 92%, 50%)',
  refund: 'hsl(160, 30%, 70%)',
  payment: 'hsl(0, 70%, 55%)',
  success: 'hsl(151, 91%, 34%)',
  pending: 'hsl(38, 92%, 50%)',
  failed: 'hsl(0, 70%, 55%)',
};

const WalletActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'earning' | 'refund'>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadWalletData();
      const channel = supabase
        .channel('wallet-activity-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_ledger',
            filter: `user_id=eq.${user.id}`,
          },
          () => loadWalletData()
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

      const { data: ledgerData, error: ledgerError } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!ledgerError) {
        setTransactions(ledgerData || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Time filter
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), days);
      filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
    }
    
    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filter);
    }
    
    return filtered;
  }, [transactions, filter, timeRange]);

  const stats = useMemo((): WalletStats => {
    const successTransactions = filteredTransactions.filter(t => t.status === 'success');
    
    // Amounts are stored in whole Leones - no division needed
    const totalDeposits = successTransactions
      .filter(t => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = successTransactions
      .filter(t => t.transaction_type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalEarnings = successTransactions
      .filter(t => t.transaction_type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRefunds = successTransactions
      .filter(t => t.transaction_type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingAmount = filteredTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const successRate = filteredTransactions.length > 0 
      ? (successTransactions.length / filteredTransactions.length) * 100 
      : 0;

    const avgTransactionSize = successTransactions.length > 0
      ? successTransactions.reduce((sum, t) => sum + t.amount, 0) / successTransactions.length
      : 0;

    return {
      totalDeposits,
      totalWithdrawals,
      totalEarnings,
      totalRefunds,
      successRate,
      avgTransactionSize,
      transactionCount: filteredTransactions.length,
      pendingAmount,
    };
  }, [filteredTransactions]);

  const pieChartData = useMemo(() => {
    const successTransactions = filteredTransactions.filter(t => t.status === 'success');
    const types = ['deposit', 'withdrawal', 'earning', 'refund'];
    
    return types.map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: successTransactions.filter(t => t.transaction_type === type).reduce((sum, t) => sum + t.amount, 0),
      color: CHART_COLORS[type as keyof typeof CHART_COLORS],
    })).filter(item => item.value > 0);
  }, [filteredTransactions]);

  const statusPieData = useMemo(() => {
    const statuses = ['success', 'pending', 'failed'];
    return statuses.map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: filteredTransactions.filter(t => t.status === status).length,
      color: CHART_COLORS[status as keyof typeof CHART_COLORS],
    })).filter(item => item.value > 0);
  }, [filteredTransactions]);

  const dailyVolumeData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= dayStart && tDate <= dayEnd && t.status === 'success';
      });
      
      // Amounts are in whole Leones - no division needed
      const deposits = dayTransactions.filter(t => t.transaction_type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = dayTransactions.filter(t => t.transaction_type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        date: format(subDays(new Date(), i), 'MMM dd'),
        deposits,
        withdrawals,
        net: deposits - withdrawals,
      });
    }
    
    return data;
  }, [transactions, timeRange]);

  const monthlyTrendData = useMemo(() => {
    const months: { [key: string]: { deposits: number; withdrawals: number } } = {};
    
    transactions.filter(t => t.status === 'success').forEach(t => {
      const monthKey = format(new Date(t.created_at), 'MMM yyyy');
      if (!months[monthKey]) {
        months[monthKey] = { deposits: 0, withdrawals: 0 };
      }
      // Amounts are in whole Leones - no division needed
      if (t.transaction_type === 'deposit') {
        months[monthKey].deposits += t.amount;
      } else if (t.transaction_type === 'withdrawal') {
        months[monthKey].withdrawals += t.amount;
      }
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      deposits: data.deposits,
      withdrawals: data.withdrawals,
    })).slice(-6);
  }, [transactions]);

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
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-xs">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    // Format as whole number with commas, no decimals
    return `Le ${Math.round(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading wallet analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
            <h1 className="text-lg font-bold">Wallet Analytics</h1>
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

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiIGN4PSIyMCIgY3k9IjIwIiByPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <WalletIcon className="h-6 w-6" />
                <span className="text-sm opacity-90">Current Balance</span>
              </div>
              <Activity className="h-5 w-5 opacity-70" />
            </div>
            <p className="text-4xl font-bold mb-1">{formatAmount(balance)}</p>
            <div className="flex items-center gap-4 text-sm opacity-80 mt-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{formatAmount(stats.totalDeposits)} in</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                <span>{formatAmount(stats.totalWithdrawals)} out</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-2 border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Total Deposits</span>
              </div>
              <p className="text-xl font-bold text-success">{formatAmount(stats.totalDeposits)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Withdrawals</span>
              </div>
              <p className="text-xl font-bold text-primary">{formatAmount(stats.totalWithdrawals)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-warning/20 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-warning" />
                <span className="text-sm text-muted-foreground">Earnings</span>
              </div>
              <p className="text-xl font-bold text-warning">{formatAmount(stats.totalEarnings)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent/20 bg-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-accent-foreground" />
                <span className="text-sm text-muted-foreground">Success Rate</span>
              </div>
              <p className="text-xl font-bold">{stats.successRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <PieChart className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="h-4 w-4 mr-1" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Transaction Distribution Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Transaction Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatAmount(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No transaction data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Transaction Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No status data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Transactions</span>
                  <span className="font-semibold">{stats.transactionCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Avg. Transaction Size</span>
                  <span className="font-semibold">{formatAmount(stats.avgTransactionSize)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Pending Amount</span>
                  <span className="font-semibold text-warning">{formatAmount(stats.pendingAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Refunds</span>
                  <span className="font-semibold text-accent-foreground">{formatAmount(stats.totalRefunds)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Net Flow</span>
                  <span className={`font-semibold ${stats.totalDeposits + stats.totalEarnings - stats.totalWithdrawals >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatAmount(stats.totalDeposits + stats.totalEarnings + stats.totalRefunds - stats.totalWithdrawals)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4 mt-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setTimeRange(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Daily Volume Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Daily Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyVolumeData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        formatter={(value: number) => formatAmount(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="deposits" fill={CHART_COLORS.deposit} name="Deposits" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="withdrawals" fill={CHART_COLORS.withdrawal} name="Withdrawals" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Net Flow Area Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-success" />
                  Net Flow Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyVolumeData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        formatter={(value: number) => formatAmount(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="net" 
                        stroke={CHART_COLORS.success} 
                        fill={CHART_COLORS.success}
                        fillOpacity={0.3}
                        name="Net Flow"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            {monthlyTrendData.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value: number) => formatAmount(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="deposits" 
                          stroke={CHART_COLORS.deposit} 
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.deposit }}
                          name="Deposits"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="withdrawals" 
                          stroke={CHART_COLORS.withdrawal} 
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.withdrawal }}
                          name="Withdrawals"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="earning">Earnings</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Transactions
                  </span>
                  <Badge variant="secondary">{filteredTransactions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <WalletIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No transactions found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    filteredTransactions.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => navigate(`/transaction/${entry.id}`)}
                        className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(entry.transaction_type, entry.status)}
                          <div>
                            <p className="font-medium capitalize text-sm">{entry.transaction_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                            {entry.provider && (
                              <p className="text-xs text-muted-foreground/70 capitalize">{entry.provider}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            entry.status !== 'success' ? 'text-muted-foreground' :
                            ['deposit', 'earning', 'refund'].includes(entry.transaction_type) ? 'text-success' : 'text-foreground'
                          }`}>
                            {entry.status === 'success' && ['deposit', 'earning', 'refund'].includes(entry.transaction_type) ? '+' : 
                             entry.status === 'success' ? '-' : ''}{formatAmount(entry.amount / 100)}
                          </p>
                          {getStatusBadge(entry.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletActivity;
