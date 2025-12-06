import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, XCircle, Plus, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  screenshot_url: string | null;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

const DepositHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);

  useEffect(() => {
    if (user) {
      loadDeposits();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('deposit-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_requests',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadDeposits();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_requests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Error loading deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/wallet')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Deposit History</h1>
              <p className="text-sm text-muted-foreground">Track your deposits</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/deposit')}
            size="sm"
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Deposits Yet</h3>
              <p className="text-muted-foreground mb-4">
                Make your first deposit to add funds to your wallet
              </p>
              <Button onClick={() => navigate('/deposit')}>
                <Plus className="h-4 w-4 mr-2" />
                Make a Deposit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
              <Card 
                key={deposit.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-2"
                onClick={() => setSelectedDeposit(deposit)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {deposit.screenshot_url ? (
                        <img 
                          src={deposit.screenshot_url} 
                          alt="Evidence" 
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg">
                          SLL {deposit.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(deposit.created_at), 'MMM dd, yyyy • HH:mm')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(deposit.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Detail Modal */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold">
                  SLL {selectedDeposit.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(selectedDeposit.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {format(new Date(selectedDeposit.created_at), 'MMM dd, yyyy • HH:mm')}
                </span>
              </div>

              {selectedDeposit.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Processed</span>
                  <span className="font-medium">
                    {format(new Date(selectedDeposit.reviewed_at), 'MMM dd, yyyy • HH:mm')}
                  </span>
                </div>
              )}

              {selectedDeposit.screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Evidence</p>
                  <img 
                    src={selectedDeposit.screenshot_url} 
                    alt="Payment evidence" 
                    className="w-full rounded-xl border"
                  />
                </div>
              )}

              {selectedDeposit.admin_notes && (
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Note</p>
                  <p className="font-medium">{selectedDeposit.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepositHistory;