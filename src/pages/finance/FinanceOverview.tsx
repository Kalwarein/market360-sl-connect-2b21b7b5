import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, TrendingUp, TrendingDown, AlertTriangle, 
  Snowflake, Gift, DollarSign, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend,
  ComposedChart, Line
} from 'recharts';
import FinanceLayout from './FinanceLayout';

interface PlatformTotals {
  total_balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_earnings: number;
  total_perks_revenue: number;
  pending_amount: number;
  frozen_wallets_count: number;
  flagged_users_count: number;
}

interface DailyVolume {
  tx_date: string;
  deposits: number;
  withdrawals: number;
  net_flow: number;
  tx_count: number;
}

const FinanceOverview = () => {
  const [totals, setTotals] = useState<PlatformTotals | null>(null);
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([]);
  const [todayStats, setTodayStats] = useState({ deposits: 0, withdrawals: 0, netFlow: 0 });
  const [weekStats, setWeekStats] = useState({ deposits: 0, withdrawals: 0, netFlow: 0 });
  const [monthStats, setMonthStats] = useState({ deposits: 0, withdrawals: 0, netFlow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('finance-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_ledger' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      // Get platform totals
      const { data: totalsData } = await supabase.rpc('get_platform_wallet_totals');
      if (totalsData) {
        setTotals(totalsData as unknown as PlatformTotals);
      }

      // Get daily volume data
      const { data: volumeData } = await supabase.rpc('get_daily_transaction_volume', { days_back: 30 });
      if (volumeData) {
        const formatted = (volumeData as DailyVolume[]).map(d => ({
          ...d,
          deposits: Number(d.deposits) / 100,
          withdrawals: Number(d.withdrawals) / 100,
          net_flow: Number(d.net_flow) / 100,
          date: format(new Date(d.tx_date), 'MMM dd')
        })).reverse();
        setDailyVolume(formatted);

        // Calculate period stats
        const today = new Date().toISOString().split('T')[0];
        const todayData = volumeData.find(d => d.tx_date === today);
        if (todayData) {
          setTodayStats({
            deposits: Number(todayData.deposits) / 100,
            withdrawals: Number(todayData.withdrawals) / 100,
            netFlow: Number(todayData.net_flow) / 100
          });
        }

        const weekAgo = subDays(new Date(), 7).toISOString().split('T')[0];
        const weekData = volumeData.filter(d => d.tx_date >= weekAgo);
        setWeekStats({
          deposits: weekData.reduce((sum, d) => sum + Number(d.deposits), 0) / 100,
          withdrawals: weekData.reduce((sum, d) => sum + Number(d.withdrawals), 0) / 100,
          netFlow: weekData.reduce((sum, d) => sum + Number(d.net_flow), 0) / 100
        });

        const monthAgo = subDays(new Date(), 30).toISOString().split('T')[0];
        const monthData = volumeData.filter(d => d.tx_date >= monthAgo);
        setMonthStats({
          deposits: monthData.reduce((sum, d) => sum + Number(d.deposits), 0) / 100,
          withdrawals: monthData.reduce((sum, d) => sum + Number(d.withdrawals), 0) / 100,
          netFlow: monthData.reduce((sum, d) => sum + Number(d.net_flow), 0) / 100
        });
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `SLE ${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const formatDisplayAmount = (amount: number) => {
    return `SLE ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <FinanceLayout title="Overview" subtitle="Platform financial overview">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout title="Overview" subtitle="Real-time platform financial metrics">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Platform Balance</p>
            <p className="text-2xl font-bold text-primary">
              {totals ? formatAmount(totals.total_balance) : 'SLE 0'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Total Deposits</p>
            <p className="text-2xl font-bold text-success">
              {totals ? formatAmount(totals.total_deposits) : 'SLE 0'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Total Withdrawals</p>
            <p className="text-2xl font-bold text-destructive">
              {totals ? formatAmount(totals.total_withdrawals) : 'SLE 0'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-violet-500" />
              </div>
              <DollarSign className="h-5 w-5 text-violet-500" />
            </div>
            <p className="text-sm text-muted-foreground">Perks Revenue</p>
            <p className="text-2xl font-bold text-violet-600">
              {totals ? formatAmount(totals.total_perks_revenue) : 'SLE 0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposits</span>
              <span className="font-semibold text-success">{formatDisplayAmount(todayStats.deposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Withdrawals</span>
              <span className="font-semibold text-destructive">{formatDisplayAmount(todayStats.withdrawals)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Net Flow</span>
              <span className={`font-bold ${todayStats.netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {todayStats.netFlow >= 0 ? '+' : ''}{formatDisplayAmount(todayStats.netFlow)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposits</span>
              <span className="font-semibold text-success">{formatDisplayAmount(weekStats.deposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Withdrawals</span>
              <span className="font-semibold text-destructive">{formatDisplayAmount(weekStats.withdrawals)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Net Flow</span>
              <span className={`font-bold ${weekStats.netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {weekStats.netFlow >= 0 ? '+' : ''}{formatDisplayAmount(weekStats.netFlow)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposits</span>
              <span className="font-semibold text-success">{formatDisplayAmount(monthStats.deposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Withdrawals</span>
              <span className="font-semibold text-destructive">{formatDisplayAmount(monthStats.withdrawals)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Net Flow</span>
              <span className={`font-bold ${monthStats.netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {monthStats.netFlow >= 0 ? '+' : ''}{formatDisplayAmount(monthStats.netFlow)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Transactions</p>
              <p className="text-xl font-bold">{totals ? formatAmount(totals.pending_amount) : 'SLE 0'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Snowflake className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frozen Wallets</p>
              <p className="text-xl font-bold">{totals?.frozen_wallets_count || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fraud Alerts</p>
              <p className="text-xl font-bold">{totals?.flagged_users_count || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Transaction Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatDisplayAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    stackId="1"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success) / 0.3)"
                    name="Deposits"
                  />
                  <Area
                    type="monotone"
                    dataKey="withdrawals"
                    stackId="2"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive) / 0.3)"
                    name="Withdrawals"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Net Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Net Flow Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatDisplayAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="deposits"
                    fill="hsl(var(--success) / 0.5)"
                    name="Deposits"
                  />
                  <Bar
                    dataKey="withdrawals"
                    fill="hsl(var(--destructive) / 0.5)"
                    name="Withdrawals"
                  />
                  <Line
                    type="monotone"
                    dataKey="net_flow"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Net Flow"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinanceLayout>
  );
};

export default FinanceOverview;
