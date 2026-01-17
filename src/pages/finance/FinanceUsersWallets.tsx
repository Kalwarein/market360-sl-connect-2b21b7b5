import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Users, Wallet, Snowflake, AlertTriangle,
  ArrowUpDown, ChevronRight, Filter
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

interface UserWallet {
  user_id: string;
  name: string | null;
  email: string;
  phone: string | null;
  balance: number;
  total_deposits: number;
  total_withdrawals: number;
  is_frozen: boolean;
  is_flagged: boolean;
  last_transaction_date: string | null;
  created_at: string;
}

const FinanceUsersWallets = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'flagged'>('all');
  const [sortBy, setSortBy] = useState<'balance' | 'deposits' | 'withdrawals' | 'created'>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, phone, created_at');

      if (!profiles) return;

      // Get frozen wallets
      const { data: frozenWallets } = await supabase
        .from('wallet_freezes')
        .select('user_id')
        .eq('is_active', true);

      const frozenUserIds = new Set(frozenWallets?.map(w => w.user_id) || []);

      // Get flagged users
      const { data: flaggedUsers } = await supabase
        .from('fraud_alerts')
        .select('user_id')
        .eq('status', 'open');

      const flaggedUserIds = new Set(flaggedUsers?.map(f => f.user_id) || []);

      // Get wallet data for each user
      const usersWithWallets: UserWallet[] = await Promise.all(
        profiles.map(async (profile) => {
          // Get balance
          const { data: balance } = await supabase
            .rpc('get_wallet_balance', { p_user_id: profile.id });

          // Get transaction totals
          const { data: ledger } = await supabase
            .from('wallet_ledger')
            .select('transaction_type, amount, status, created_at')
            .eq('user_id', profile.id)
            .eq('status', 'success')
            .order('created_at', { ascending: false });

          const deposits = (ledger || [])
            .filter(t => t.transaction_type === 'deposit')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const withdrawals = (ledger || [])
            .filter(t => t.transaction_type === 'withdrawal')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const lastTransaction = ledger?.[0]?.created_at || null;

          return {
            user_id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            balance: balance || 0,
            total_deposits: deposits,
            total_withdrawals: withdrawals,
            is_frozen: frozenUserIds.has(profile.id),
            is_flagged: flaggedUserIds.has(profile.id),
            last_transaction_date: lastTransaction,
            created_at: profile.created_at
          };
        })
      );

      setUsers(usersWithWallets);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.user_id.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'frozen' && user.is_frozen) ||
        (statusFilter === 'flagged' && user.is_flagged) ||
        (statusFilter === 'active' && !user.is_frozen && !user.is_flagged);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'deposits':
          comparison = a.total_deposits - b.total_deposits;
          break;
        case 'withdrawals':
          comparison = a.total_withdrawals - b.total_withdrawals;
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const formatAmount = (amount: number) => {
    return `SLE ${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const getStatusBadge = (user: UserWallet) => {
    if (user.is_frozen) {
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Snowflake className="h-3 w-3 mr-1" />
          Frozen
        </Badge>
      );
    }
    if (user.is_flagged) {
      return (
        <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Flagged
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
        Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <FinanceLayout title="Users Wallets" subtitle="All user wallet accounts">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout title="Users Wallets" subtitle={`${users.length} total user accounts`}>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Wallet className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Active Wallets</p>
              <p className="text-2xl font-bold">{users.filter(u => !u.is_frozen && !u.is_flagged).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Snowflake className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Frozen</p>
              <p className="text-2xl font-bold">{users.filter(u => u.is_frozen).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Flagged</p>
              <p className="text-2xl font-bold">{users.filter(u => u.is_flagged).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="deposits">Deposits</SelectItem>
                <SelectItem value="withdrawals">Withdrawals</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Deposits</TableHead>
                <TableHead className="text-right">Withdrawals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow 
                    key={user.user_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/finance/users/${user.user_id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.phone || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatAmount(user.balance)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatAmount(user.total_deposits)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatAmount(user.total_withdrawals)}
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_transaction_date
                        ? format(new Date(user.last_transaction_date), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </FinanceLayout>
  );
};

export default FinanceUsersWallets;
