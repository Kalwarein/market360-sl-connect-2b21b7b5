import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, CheckCircle, RefreshCw, Database, Wallet, ShoppingCart, TrendingUp } from "lucide-react";
import { formatSLE } from "@/lib/currency";
import { useUserRoles } from "@/hooks/useUserRoles";

interface ConsistencyIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  count: number;
  details?: any[];
}

interface LedgerStats {
  transaction_type: string;
  status: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  normalized_count: number;
}

interface OrderEscrowIssue {
  order_id: string;
  issue: string;
  order_amount: number;
  ledger_amount: number | null;
  escrow_status: string;
}

export default function AdminFinanceConsistency() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState<ConsistencyIssue[]>([]);
  const [ledgerStats, setLedgerStats] = useState<LedgerStats[]>([]);
  const [orderIssues, setOrderIssues] = useState<OrderEscrowIssue[]>([]);
  const [platformTotals, setPlatformTotals] = useState<any>(null);

  useEffect(() => {
    if (!rolesLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, rolesLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadConsistencyData();
    }
  }, [isAdmin]);

  const loadConsistencyData = async () => {
    setLoading(true);
    const detectedIssues: ConsistencyIssue[] = [];

    try {
      // 1. Get ledger statistics
      const { data: stats } = await supabase
        .from('wallet_ledger')
        .select('transaction_type, status, amount, metadata');

      if (stats) {
        // Calculate stats manually
        const grouped: Record<string, LedgerStats> = {};
        stats.forEach((row: any) => {
          const key = `${row.transaction_type}-${row.status}`;
          if (!grouped[key]) {
            grouped[key] = {
              transaction_type: row.transaction_type,
              status: row.status,
              count: 0,
              min: row.amount,
              max: row.amount,
              avg: 0,
              normalized_count: 0,
            };
          }
          grouped[key].count++;
          grouped[key].min = Math.min(grouped[key].min, row.amount);
          grouped[key].max = Math.max(grouped[key].max, row.amount);
          grouped[key].avg += row.amount;
          if (row.metadata?.cents_to_nle_normalized) {
            grouped[key].normalized_count++;
          }
        });
        
        const statsArray = Object.values(grouped).map(g => ({
          ...g,
          avg: g.count > 0 ? g.avg / g.count : 0
        }));
        setLedgerStats(statsArray);

        // Check for suspiciously large amounts (may still be in cents)
        const suspiciousEntries = stats.filter((s: any) => 
          s.amount > 10000 && 
          s.status === 'success' && 
          !s.metadata?.cents_to_nle_normalized
        );
        
        if (suspiciousEntries.length > 0) {
          detectedIssues.push({
            type: 'large_amounts',
            severity: 'warning',
            description: 'Entries with unusually large amounts (>10,000 NLE) that may still be in cents',
            count: suspiciousEntries.length,
            details: suspiciousEntries.slice(0, 5),
          });
        }

        // Check for normalized entries (informational)
        const normalizedTotal = stats.filter((s: any) => s.metadata?.cents_to_nle_normalized).length;
        if (normalizedTotal > 0) {
          detectedIssues.push({
            type: 'normalized_entries',
            severity: 'info',
            description: 'Entries that were converted from cents to NLE during cleanup',
            count: normalizedTotal,
          });
        }
      }

      // 2. Check order-escrow consistency
      const { data: escrowIssues, error: escrowError } = await supabase
        .rpc('validate_order_escrow_consistency');

      if (!escrowError && escrowIssues && escrowIssues.length > 0) {
        setOrderIssues(escrowIssues);
        detectedIssues.push({
          type: 'order_escrow_mismatch',
          severity: 'error',
          description: 'Orders with escrow/ledger inconsistencies',
          count: escrowIssues.length,
          details: escrowIssues.slice(0, 10),
        });
      }

      // 3. Check for orders without batch reference
      const { data: orphanOrders, count: orphanCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .is('order_batch_ref', null)
        .eq('escrow_status', 'holding');

      if (orphanCount && orphanCount > 0) {
        detectedIssues.push({
          type: 'orphan_orders',
          severity: 'warning',
          description: 'Orders in escrow without a batch reference (legacy orders)',
          count: orphanCount,
        });
      }

      // 4. Get platform totals
      const { data: totals } = await supabase.rpc('get_platform_wallet_totals');
      if (totals && totals.length > 0) {
        setPlatformTotals(totals[0]);
      }

      // 5. Check for pending payments stuck for too long
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: stuckPendingCount } = await supabase
        .from('wallet_ledger')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .lt('created_at', oneDayAgo);

      if (stuckPendingCount && stuckPendingCount > 0) {
        detectedIssues.push({
          type: 'stuck_pending',
          severity: 'warning',
          description: 'Pending transactions older than 24 hours',
          count: stuckPendingCount,
        });
      }

      // 6. Check for negative calculated balances
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
        .limit(100);

      if (allUsers) {
        let negativeBalanceCount = 0;
        for (const user of allUsers) {
          const { data: balance } = await supabase.rpc('get_wallet_balance', { p_user_id: user.id });
          if (balance && balance < 0) {
            negativeBalanceCount++;
          }
        }
        if (negativeBalanceCount > 0) {
          detectedIssues.push({
            type: 'negative_balances',
            severity: 'error',
            description: 'Users with negative wallet balances',
            count: negativeBalanceCount,
          });
        }
      }

      setIssues(detectedIssues);
    } catch (error) {
      console.error('Error loading consistency data:', error);
      toast({
        title: "Error",
        description: "Failed to load consistency report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConsistencyData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-amber-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Finance Consistency</h1>
              <p className="text-sm text-muted-foreground">Database health check</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className={errorCount > 0 ? 'border-destructive' : ''}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-destructive">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </CardContent>
          </Card>
          <Card className={warningCount > 0 ? 'border-amber-500' : ''}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {platformTotals ? formatSLE(platformTotals.total_balance) : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Platform Balance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">
                {platformTotals ? formatSLE(platformTotals.pending_amount) : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Issues List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Detected Issues
            </CardTitle>
            <CardDescription>
              {issues.length === 0 ? 'No issues detected' : `${issues.length} issue(s) found`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All systems healthy!</p>
              </div>
            ) : (
              issues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{issue.description}</span>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.count}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Type: {issue.type}</p>
                      {issue.details && issue.details.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-primary cursor-pointer">
                            View details ({issue.details.length} items)
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(issue.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ledger Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Ledger Statistics
            </CardTitle>
            <CardDescription>
              Transaction breakdown by type and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Count</th>
                    <th className="text-right py-2 px-2">Min</th>
                    <th className="text-right py-2 px-2">Max</th>
                    <th className="text-right py-2 px-2">Avg</th>
                    <th className="text-right py-2 px-2">Normalized</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerStats.map((stat, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 px-2 font-medium capitalize">{stat.transaction_type}</td>
                      <td className="py-2 px-2">
                        <Badge variant={stat.status === 'success' ? 'default' : stat.status === 'failed' ? 'destructive' : 'secondary'}>
                          {stat.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right">{stat.count}</td>
                      <td className="py-2 px-2 text-right">{formatSLE(stat.min)}</td>
                      <td className="py-2 px-2 text-right">{formatSLE(stat.max)}</td>
                      <td className="py-2 px-2 text-right">{formatSLE(Math.round(stat.avg))}</td>
                      <td className="py-2 px-2 text-right">
                        {stat.normalized_count > 0 ? (
                          <Badge variant="outline" className="text-blue-500">
                            {stat.normalized_count}
                          </Badge>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Order-Escrow Issues */}
        {orderIssues.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShoppingCart className="h-5 w-5" />
                Order-Escrow Mismatches
              </CardTitle>
              <CardDescription>
                Orders with payment/escrow inconsistencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orderIssues.map((issue, index) => (
                  <div key={index} className="border rounded p-3 bg-destructive/5">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs">{issue.order_id.substring(0, 8)}...</code>
                      <Badge variant="destructive">{issue.escrow_status}</Badge>
                    </div>
                    <p className="text-sm">{issue.issue}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Order: {formatSLE(issue.order_amount)}</span>
                      <span>Ledger: {issue.ledger_amount ? formatSLE(issue.ledger_amount) : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Totals */}
        {platformTotals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Platform Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-lg font-semibold text-green-600">{formatSLE(platformTotals.total_deposits)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                  <p className="text-lg font-semibold text-red-600">{formatSLE(platformTotals.total_withdrawals)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-lg font-semibold text-blue-600">{formatSLE(platformTotals.total_earnings)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Perks Revenue</p>
                  <p className="text-lg font-semibold text-purple-600">{formatSLE(platformTotals.total_perks_revenue)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex gap-4">
                <Badge variant="outline">
                  {platformTotals.frozen_wallets_count} Frozen Wallets
                </Badge>
                <Badge variant="outline">
                  {platformTotals.flagged_users_count} Flagged Users
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
