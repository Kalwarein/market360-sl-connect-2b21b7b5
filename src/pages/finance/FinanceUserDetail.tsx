import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, User, Wallet, Snowflake, AlertTriangle,
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle,
  Shield, MessageSquare, Lock, Unlock, Flag, FlagOff
} from 'lucide-react';
import { format } from 'date-fns';
import FinanceLayout from './FinanceLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  reference: string | null;
  monime_id: string | null;
  created_at: string;
}

interface AdminNote {
  id: string;
  note: string;
  note_type: string;
  created_at: string;
  admin_id: string;
}

const FinanceUserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showUnfreezeDialog, setShowUnfreezeDialog] = useState(false);

  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalEarnings: 0,
    transactionCount: 0
  });

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, email, phone, created_at')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get balance - RPC returns CENTS, convert to SLE
      const { data: balanceData } = await supabase
        .rpc('get_wallet_balance', { p_user_id: userId });
      setBalance((balanceData || 0) / 100);

      // Load transactions
      const { data: txData } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (txData) {
        setTransactions(txData);

        // Calculate stats - amounts are in CENTS, convert to SLE
        const successTx = txData.filter(t => t.status === 'success');
        setStats({
          totalDeposits: successTx.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + Number(t.amount), 0) / 100,
          totalWithdrawals: successTx.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0) / 100,
          totalEarnings: successTx.filter(t => t.transaction_type === 'earning').reduce((s, t) => s + Number(t.amount), 0) / 100,
          transactionCount: txData.length
        });
      }

      // Check frozen status
      const { data: freezeData } = await supabase
        .from('wallet_freezes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      setIsFrozen(!!freezeData);

      // Check flagged status
      const { data: flagData } = await supabase
        .from('fraud_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .maybeSingle();

      setIsFlagged(!!flagData);

      // Load admin notes
      const { data: notesData } = await supabase
        .from('wallet_admin_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notesData) {
        setAdminNotes(notesData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeWallet = async () => {
    if (!adminUser || !freezeReason.trim()) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('wallet_freezes')
        .insert({
          user_id: userId,
          frozen_by: adminUser.id,
          reason: freezeReason
        });

      if (error) throw error;

      // Log activity
      await supabase.from('finance_activity_log').insert({
        admin_id: adminUser.id,
        action: 'freeze_wallet',
        target_user_id: userId,
        target_type: 'wallet',
        details: { reason: freezeReason }
      });

      toast({ title: 'Wallet Frozen', description: 'User wallet has been frozen successfully.' });
      setIsFrozen(true);
      setShowFreezeDialog(false);
      setFreezeReason('');
    } catch (error) {
      console.error('Error freezing wallet:', error);
      toast({ title: 'Error', description: 'Failed to freeze wallet', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreezeWallet = async () => {
    if (!adminUser) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from('wallet_freezes')
        .update({ 
          is_active: false, 
          unfrozen_at: new Date().toISOString(),
          unfrozen_by: adminUser.id 
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Log activity
      await supabase.from('finance_activity_log').insert({
        admin_id: adminUser.id,
        action: 'unfreeze_wallet',
        target_user_id: userId,
        target_type: 'wallet'
      });

      toast({ title: 'Wallet Unfrozen', description: 'User wallet has been unfrozen.' });
      setIsFrozen(false);
      setShowUnfreezeDialog(false);
    } catch (error) {
      console.error('Error unfreezing wallet:', error);
      toast({ title: 'Error', description: 'Failed to unfreeze wallet', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminUser || !newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('wallet_admin_notes')
        .insert({
          user_id: userId,
          admin_id: adminUser.id,
          note: newNote,
          note_type: 'general'
        });

      if (error) throw error;

      toast({ title: 'Note Added' });
      setNewNote('');
      loadUserData();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    }
  };

  const formatAmount = (amount: number) => {
    return `SLE ${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') return <Clock className="h-4 w-4 text-warning" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />;
    
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
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <FinanceLayout title="User Details" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  if (!profile) {
    return (
      <FinanceLayout title="User Not Found" subtitle="">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            User not found
          </CardContent>
        </Card>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout 
      title={profile.name || 'Unnamed User'} 
      subtitle={profile.email}
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/finance/users')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Users
      </Button>

      {/* Status Alerts */}
      {isFrozen && (
        <Card className="mb-4 border-blue-500 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Snowflake className="h-6 w-6 text-blue-500" />
            <div className="flex-1">
              <p className="font-semibold text-blue-700">Wallet Frozen</p>
              <p className="text-sm text-muted-foreground">This user cannot make deposits or withdrawals</p>
            </div>
            <Button variant="outline" onClick={() => setShowUnfreezeDialog(true)}>
              <Unlock className="h-4 w-4 mr-2" />
              Unfreeze
            </Button>
          </CardContent>
        </Card>
      )}

      {isFlagged && (
        <Card className="mb-4 border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">Fraud Alert Active</p>
              <p className="text-sm text-muted-foreground">This user has been flagged for suspicious activity</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wallet className="h-8 w-8 text-primary" />
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                </div>
                <p className="text-3xl font-bold text-primary">{formatAmount(balance)}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Deposits</p>
                  <p className="text-lg font-bold text-success">{formatAmount(stats.totalDeposits)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Withdrawals</p>
                  <p className="text-lg font-bold text-destructive">{formatAmount(stats.totalWithdrawals)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Earnings</p>
                  <p className="text-lg font-bold text-warning">{formatAmount(stats.totalEarnings)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="text-lg font-bold">{stats.transactionCount}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 20).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="flex items-center gap-2">
                        {getTransactionIcon(tx.transaction_type, tx.status)}
                        <span className="capitalize">{tx.transaction_type}</span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {tx.reference || tx.monime_id || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-mono">{profile.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{profile.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm">{format(new Date(profile.created_at), 'MMMM dd, yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isFrozen ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-blue-600 border-blue-200"
                  onClick={() => setShowFreezeDialog(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Freeze Wallet
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowUnfreezeDialog(true)}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Unfreeze Wallet
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="w-full"
                >
                  Add Note
                </Button>
              </div>

              {adminNotes.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {adminNotes.map((note) => (
                    <div key={note.id} className="text-sm">
                      <p className="text-muted-foreground">{note.note}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Freeze Dialog */}
      <AlertDialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Freeze Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the user from making deposits and withdrawals. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter reason for freezing..."
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFreezeWallet}
              disabled={!freezeReason.trim() || actionLoading}
            >
              {actionLoading ? 'Freezing...' : 'Freeze Wallet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unfreeze Dialog */}
      <AlertDialog open={showUnfreezeDialog} onOpenChange={setShowUnfreezeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfreeze Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the user's ability to make deposits and withdrawals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfreezeWallet} disabled={actionLoading}>
              {actionLoading ? 'Unfreezing...' : 'Unfreeze Wallet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FinanceLayout>
  );
};

export default FinanceUserDetail;
