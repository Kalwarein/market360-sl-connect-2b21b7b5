import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, ArrowDownCircle, ArrowUpCircle, Clock, 
  CheckCircle, XCircle, Filter, Download, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import FinanceLayout from './FinanceLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  status: string;
  reference: string | null;
  monime_id: string | null;
  monime_ussd_code: string | null;
  provider: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const FinanceTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  useEffect(() => {
    loadTransactions();

    // Set up realtime subscription
    const channel = supabase
      .channel('transactions-explorer')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_ledger' }, () => {
        loadTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTransactions = async () => {
    try {
      const { data } = await supabase
        .from('wallet_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!data) return;

      // Get user info for each transaction
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedTx = data.map(tx => ({
        ...tx,
        user_name: profileMap.get(tx.user_id)?.name || 'Unknown',
        user_email: profileMap.get(tx.user_id)?.email || ''
      }));

      setTransactions(enrichedTx);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filteredTransactions = transactions.filter(tx => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      tx.user_name?.toLowerCase().includes(searchLower) ||
      tx.user_email?.toLowerCase().includes(searchLower) ||
      tx.reference?.toLowerCase().includes(searchLower) ||
      tx.monime_id?.toLowerCase().includes(searchLower) ||
      tx.id.toLowerCase().includes(searchLower);

    // Type filter
    const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    // Provider filter
    const matchesProvider = providerFilter === 'all' || tx.provider === providerFilter;

    return matchesSearch && matchesType && matchesStatus && matchesProvider;
  });

  const formatAmount = (amount: number) => {
    return `SLE ${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending' || status === 'processing') {
      return <Clock className="h-4 w-4 text-warning" />;
    }
    if (status === 'failed') {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    
    switch (type) {
      case 'deposit':
      case 'earning':
      case 'refund':
        return <ArrowDownCircle className="h-4 w-4 text-success" />;
      case 'withdrawal':
      case 'payment':
        return <ArrowUpCircle className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/10 text-success border-success/20">Success</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: 'bg-success/10 text-success border-success/20',
      withdrawal: 'bg-primary/10 text-primary border-primary/20',
      earning: 'bg-warning/10 text-warning border-warning/20',
      refund: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      payment: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return (
      <Badge className={colors[type] || 'bg-muted'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  // Get unique providers for filter
  const providers = [...new Set(transactions.map(t => t.provider).filter(Boolean))];

  if (loading) {
    return (
      <FinanceLayout title="Transaction Explorer" subtitle="All platform transactions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout title="Transaction Explorer" subtitle="Global transaction search and money trail">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {transactions.filter(t => t.transaction_type === 'deposit').length}
            </p>
            <p className="text-xs text-muted-foreground">Deposits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {transactions.filter(t => t.transaction_type === 'withdrawal').length}
            </p>
            <p className="text-xs text-muted-foreground">Withdrawals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {transactions.filter(t => t.status === 'pending').length}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {transactions.filter(t => t.status === 'failed').length}
            </p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, reference, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="earning">Earning</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map(p => (
                    <SelectItem key={p} value={p!}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No transactions found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.user_name}</p>
                          <p className="text-xs text-muted-foreground">{tx.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.transaction_type, tx.status)}
                          {getTypeBadge(tx.transaction_type)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{tx.provider || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <p className="text-xs font-mono truncate" title={tx.reference || tx.monime_id || ''}>
                            {tx.reference || tx.monime_id || '-'}
                          </p>
                          {tx.monime_ussd_code && tx.status === 'pending' && (
                            <p className="text-xs text-primary font-mono">{tx.monime_ussd_code}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(tx.created_at), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'HH:mm:ss')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </FinanceLayout>
  );
};

export default FinanceTransactions;
