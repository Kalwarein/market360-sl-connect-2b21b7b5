import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle, Phone, Calendar, User, Mail, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
  screenshot_url: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminWalletRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<WalletRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.user_id)
        .single();
      
      setRequest({
        ...data,
        profiles: profile || { name: '', email: '' },
      } as WalletRequest);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('Failed to load request details');
      navigate('/admin/wallet-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!request || !actionType) return;

    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('process-wallet-request', {
        body: {
          requestId: request.id,
          action: actionType,
          adminNotes,
        },
      });

      if (error) throw error;

      toast.success(`Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      navigate('/admin/wallet-requests');
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    } finally {
      setProcessing(false);
      setActionType(null);
      setAdminNotes('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-yellow-500 text-white">Processing</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Only withdrawals have 2% fee, deposits get full amount
  const feeAmount = request.type === 'withdrawal' ? request.amount * 0.02 : 0;
  const finalAmount = request.type === 'deposit' 
    ? request.amount
    : request.amount - feeAmount;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border p-6 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/admin/wallet-requests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {request.type === 'deposit' ? (
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowDownCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowUpCircle className="h-6 w-6 text-red-500" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold capitalize">{request.type} Request</h1>
              <p className="text-sm text-muted-foreground">
                ID: {request.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* User Information */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="font-medium">{request.profiles?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-medium">{request.profiles?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Phone:</span>
              <span className="font-medium">{request.phone_number}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Submitted:</span>
              <span className="font-medium">
                {format(new Date(request.created_at), 'MMM dd, yyyy • HH:mm')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold uppercase">{request.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-xl">SLL {request.amount.toLocaleString()}</span>
              </div>
              {request.type === 'withdrawal' && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Fee (2%)</span>
                  <span>- SLL {feeAmount.toLocaleString()}</span>
                </div>
              )}
              {request.type === 'deposit' && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Fee</span>
                  <span className="font-semibold">✓ No Fee</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    {request.type === 'deposit' ? 'Amount to Credit' : 'Amount to Send'}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    SLL {finalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Evidence */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            {request.screenshot_url ? (
              <div>
                <img
                  src={request.screenshot_url}
                  alt="Payment evidence"
                  className="w-full rounded-xl border-2"
                />
                <a
                  href={request.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-3 inline-block"
                >
                  Open full size →
                </a>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No evidence uploaded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Notes */}
        {request.admin_notes && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{request.admin_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {request.status === 'processing' && (
          <div className="flex gap-4 pt-4">
            <Button
              className="flex-1 h-14 rounded-xl font-bold"
              size="lg"
              onClick={() => setActionType('approve')}
              disabled={processing}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-14 rounded-xl font-bold"
              size="lg"
              onClick={() => setActionType('reject')}
              disabled={processing}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? request.type === 'deposit'
                  ? `This will credit SLL ${finalAmount.toLocaleString()} to the user's wallet.`
                  : `This will send SLL ${finalAmount.toLocaleString()} to the user (after 2% fee).`
                : 'This will reject the request and notify the user.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="notes" className="text-sm font-medium">
              {actionType === 'approve' ? 'Notes (Optional)' : 'Reason (Optional)'}
            </Label>
            <Textarea
              id="notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={actionType === 'approve' ? 'Add any notes...' : 'Why is this being rejected?'}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={processing}>
              {processing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWalletRequestDetail;