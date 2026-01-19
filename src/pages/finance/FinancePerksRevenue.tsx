import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Gift, DollarSign, TrendingUp, Award, Eye, Sparkles, Palette, Megaphone,
  Calendar
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import FinanceLayout from './FinanceLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PerkSale {
  id: string;
  store_id: string;
  perk_type: string;
  perk_name: string;
  price_paid: number;
  purchased_at: string;
  expires_at: string | null;
  store_name?: string;
  owner_name?: string;
}

interface PerkStats {
  perkType: string;
  perkName: string;
  totalRevenue: number;
  salesCount: number;
  icon: any;
  color: string;
}

const PERK_COLORS: Record<string, string> = {
  verified_badge: 'hsl(217, 91%, 60%)',
  boosted_visibility: 'hsl(271, 91%, 65%)',
  product_highlights: 'hsl(152, 69%, 40%)',
  premium_theme: 'hsl(258, 90%, 66%)',
  featured_spotlight: 'hsl(0, 84%, 60%)',
};

const PERK_ICONS: Record<string, any> = {
  verified_badge: Award,
  boosted_visibility: Eye,
  product_highlights: Sparkles,
  premium_theme: Palette,
  featured_spotlight: Megaphone,
};

const FinancePerksRevenue = () => {
  const [sales, setSales] = useState<PerkSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [perkStats, setPerkStats] = useState<PerkStats[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all perk sales
      const { data: perksData } = await supabase
        .from('store_perks')
        .select('*')
        .order('purchased_at', { ascending: false });

      if (!perksData) return;

      // Get store and user info
      const storeIds = [...new Set(perksData.map(p => p.store_id))];
      const { data: stores } = await supabase
        .from('stores')
        .select('id, store_name, owner_id')
        .in('id', storeIds);

      const ownerIds = [...new Set(stores?.map(s => s.owner_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ownerIds);

      const storeMap = new Map(stores?.map(s => [s.id, s]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedSales = perksData.map(sale => {
        const store = storeMap.get(sale.store_id);
        const owner = store ? profileMap.get(store.owner_id) : null;
        return {
          ...sale,
          store_name: store?.store_name || 'Unknown Store',
          owner_name: owner?.name || 'Unknown'
        };
      });

      setSales(enrichedSales);

      // Calculate totals
      const total = perksData.reduce((sum, p) => sum + Number(p.price_paid), 0);
      setTotalRevenue(total);

      // Today's revenue
      const today = new Date().toISOString().split('T')[0];
      const todayTotal = perksData
        .filter(p => p.purchased_at.startsWith(today))
        .reduce((sum, p) => sum + Number(p.price_paid), 0);
      setTodayRevenue(todayTotal);

      // This month's revenue
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const monthTotal = perksData
        .filter(p => {
          const date = new Date(p.purchased_at);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, p) => sum + Number(p.price_paid), 0);
      setMonthRevenue(monthTotal);

      // Calculate stats per perk type
      const statsMap = new Map<string, PerkStats>();
      perksData.forEach(p => {
        const existing = statsMap.get(p.perk_type) || {
          perkType: p.perk_type,
          perkName: p.perk_name,
          totalRevenue: 0,
          salesCount: 0,
          icon: PERK_ICONS[p.perk_type] || Gift,
          color: PERK_COLORS[p.perk_type] || 'hsl(var(--primary))'
        };
        existing.totalRevenue += Number(p.price_paid);
        existing.salesCount += 1;
        statsMap.set(p.perk_type, existing);
      });
      setPerkStats(Array.from(statsMap.values()));

      // Calculate daily revenue for chart
      const dailyMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyMap.set(date, 0);
      }
      perksData.forEach(p => {
        const date = p.purchased_at.split('T')[0];
        if (dailyMap.has(date)) {
          dailyMap.set(date, (dailyMap.get(date) || 0) + Number(p.price_paid));
        }
      });
      setDailyRevenue(
        Array.from(dailyMap.entries()).map(([date, revenue]) => ({
          date: format(new Date(date), 'MMM dd'),
          revenue
        }))
      );
    } catch (error) {
      console.error('Error loading perks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `SLE ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const pieData = perkStats.map(stat => ({
    name: stat.perkName,
    value: stat.totalRevenue,
    color: stat.color
  }));

  if (loading) {
    return (
      <FinanceLayout title="Perks Revenue" subtitle="Platform income from perks">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout title="Perks Revenue" subtitle="Platform income from premium perks">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-violet-500" />
              </div>
              <DollarSign className="h-5 w-5 text-violet-500" />
            </div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-violet-600">{formatAmount(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold">{formatAmount(todayRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-success">{formatAmount(monthRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Gift className="h-8 w-8 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold">{sales.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue per Perk Type */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {perkStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.perkType}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stat.perkName}</p>
                <p className="text-lg font-bold">{formatAmount(stat.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{stat.salesCount} sales</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Daily Revenue (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}`}
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
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Revenue by Perk Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No perk sales data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Perk Sales</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Perk</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No perk sales yet
                  </TableCell>
                </TableRow>
              ) : (
                sales.slice(0, 50).map((sale) => {
                  const Icon = PERK_ICONS[sale.perk_type] || Gift;
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <p className="font-medium">{sale.store_name}</p>
                      </TableCell>
                      <TableCell className="text-sm">{sale.owner_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon 
                            className="h-4 w-4" 
                            style={{ color: PERK_COLORS[sale.perk_type] }}
                          />
                          <span className="text-sm">{sale.perk_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatAmount(sale.price_paid)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(sale.purchased_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sale.expires_at 
                          ? format(new Date(sale.expires_at), 'MMM dd, yyyy')
                          : 'Never'
                        }
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </FinanceLayout>
  );
};

export default FinancePerksRevenue;
