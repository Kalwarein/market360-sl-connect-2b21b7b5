import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, TrendingDown, Activity, BarChart3, 
  ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend,
  ComposedChart, Line, LineChart
} from 'recharts';
import FinanceLayout from './FinanceLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DailyData {
  date: string;
  deposits: number;
  withdrawals: number;
  net_flow: number;
  tx_count: number;
}

interface MonthlyData {
  month: string;
  deposits: number;
  withdrawals: number;
  net_flow: number;
}

const FinanceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const { data: volumeData } = await supabase.rpc('get_daily_transaction_volume', { days_back: days });
      
      if (volumeData) {
        const formatted = (volumeData as any[]).map(d => ({
          date: format(new Date(d.tx_date), 'MMM dd'),
          fullDate: d.tx_date,
          deposits: Number(d.deposits) / 100,
          withdrawals: Number(d.withdrawals) / 100,
          net_flow: Number(d.net_flow) / 100,
          tx_count: d.tx_count
        })).reverse();
        setDailyData(formatted);
      }

      // Get monthly data from ledger
      const { data: ledgerData } = await supabase
        .from('wallet_ledger')
        .select('transaction_type, amount, status, created_at')
        .eq('status', 'success')
        .gte('created_at', subMonths(new Date(), 12).toISOString())
        .order('created_at', { ascending: true });

      if (ledgerData) {
        const monthMap = new Map<string, MonthlyData>();
        
        ledgerData.forEach(tx => {
          const month = format(new Date(tx.created_at), 'MMM yyyy');
          const existing = monthMap.get(month) || { month, deposits: 0, withdrawals: 0, net_flow: 0 };
          
          const amount = Number(tx.amount) / 100;
          if (tx.transaction_type === 'deposit') {
            existing.deposits += amount;
            existing.net_flow += amount;
          } else if (tx.transaction_type === 'withdrawal') {
            existing.withdrawals += amount;
            existing.net_flow -= amount;
          }
          
          monthMap.set(month, existing);
        });

        setMonthlyData(Array.from(monthMap.values()));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalDeposits = dailyData.reduce((sum, d) => sum + d.deposits, 0);
    const totalWithdrawals = dailyData.reduce((sum, d) => sum + d.withdrawals, 0);
    const totalTx = dailyData.reduce((sum, d) => sum + d.tx_count, 0);
    const avgDaily = totalDeposits / (dailyData.length || 1);
    
    return { totalDeposits, totalWithdrawals, totalTx, avgDaily };
  }, [dailyData]);

  const formatAmount = (amount: number) => {
    return `SLE ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <FinanceLayout title="Wallet Analytics" subtitle="Detailed financial analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout title="Wallet Analytics" subtitle="Platform-wide financial analytics and trends">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Analysis Period</span>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="180">Last 6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-6 w-6 text-success" />
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Total Deposits</p>
            <p className="text-2xl font-bold text-success">{formatAmount(stats.totalDeposits)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-6 w-6 text-destructive" />
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">Total Withdrawals</p>
            <p className="text-2xl font-bold text-destructive">{formatAmount(stats.totalWithdrawals)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Net Flow</p>
            <p className={`text-2xl font-bold ${stats.totalDeposits - stats.totalWithdrawals >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatAmount(stats.totalDeposits - stats.totalWithdrawals)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{stats.totalTx.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Volume Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transaction Volume Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    interval={timeRange === '7' ? 0 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
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
                    fill="hsl(var(--success) / 0.4)"
                    name="Deposits"
                  />
                  <Area
                    type="monotone"
                    dataKey="withdrawals"
                    stackId="2"
                    stroke="hsl(var(--destructive))"
                    fill="hsl(var(--destructive) / 0.4)"
                    name="Withdrawals"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Flow Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Net Flow Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_flow"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Net Flow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Daily Transaction Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="tx_count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Transactions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      {monthlyData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Comparison (Last 12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="deposits"
                    fill="hsl(var(--success) / 0.6)"
                    name="Deposits"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="withdrawals"
                    fill="hsl(var(--destructive) / 0.6)"
                    name="Withdrawals"
                    radius={[4, 4, 0, 0]}
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
      )}
    </FinanceLayout>
  );
};

export default FinanceAnalytics;
