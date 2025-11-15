import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Wallet, Clock, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

interface WalletRequest {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  phone_number: string;
  screenshot_url: string;
  status: string;
  created_at: string;
  admin_notes: string;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminWalletRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', request.user_id)
            .single();
          
          return {
            ...request,
            profiles: profile || { name: '', email: '' },
          };
        })
      );
      
      setRequests(requestsWithProfiles as any);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('wallet_requests')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // If approved and deposit, update wallet balance
      if (actionType === 'approve' && selectedRequest.type === 'deposit') {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance_leones')
          .eq('user_id', selectedRequest.user_id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({
              balance_leones: wallet.balance_leones + selectedRequest.amount
            })
            .eq('id', wallet.id);

          // Create transaction record
          await supabase.from('transactions').insert({
            wallet_id: wallet.id,
            amount: selectedRequest.amount,
            type: 'deposit',
            status: 'completed',
            reference: `DEP-${selectedRequest.id}`,
          });
        }
      }

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: selectedRequest.user_id,
        type: 'system',
        title: `Wallet ${selectedRequest.type} ${newStatus}`,
        body: adminNotes || `Your ${selectedRequest.type} request has been ${newStatus}`,
      });

      toast({
        title: 'Success',
        description: `Request ${newStatus} successfully`,
      });

      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
      loadRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Wallet Requests</h1>
        <p className="text-sm opacity-90">
          {pendingRequests.length} pending requests
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {request.type === 'deposit' ? (
                          <ArrowUpCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-8 w-8 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {request.profiles?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-semibold">Type:</span>{' '}
                        {request.type.toUpperCase()}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Amount:</span> Le{' '}
                        {request.amount.toLocaleString()}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Phone:</span>{' '}
                        {request.phone_number}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Date:</span>{' '}
                        {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {request.screenshot_url && (
                        <a
                          href={request.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Screenshot
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType('approve');
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType('reject');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Processed Requests</h2>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <Card key={request.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {request.type === 'deposit' ? (
                          <ArrowUpCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-6 w-6 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {request.profiles?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Le {request.amount.toLocaleString()} •{' '}
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </p>
                          {request.admin_notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {request.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          request.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No wallet requests</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <AlertDialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Request
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to {actionType} this{' '}
                  {selectedRequest?.type} request for Le{' '}
                  {selectedRequest?.amount.toLocaleString()}?
                </p>
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes (optional)"
                    className="mt-2"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWalletRequests;
