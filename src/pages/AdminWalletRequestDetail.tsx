import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle, Phone, Calendar, User, Mail } from 'lucide-react';
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
  const { toast } = useToast();
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
      toast({
        title: 'Error',
        description: 'Failed to load request details',
        variant: 'destructive',
      });
      navigate('/admin-wallet-requests');
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

      toast({
        title: 'Success',
        description: `Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      navigate('/admin-wallet-requests');
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process request',
        variant: 'destructive',
      });
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

  const statusColor = 
    request.status === 'approved' ? 'bg-green-500' :
    request.status === 'rejected' ? 'bg-red-500' :
    'bg-yellow-500';

  const statusIcon = 
    request.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
    request.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
    null;

  const feeAmount = request.amount * 0.02;
  const finalAmount = request.type === 'deposit' 
    ? request.amount - feeAmount 
    : request.amount + feeAmount;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b border-border p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/admin-wallet-requests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Request Details</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Request ID: {request.id.slice(0, 8)}...
            </p>
          </div>
          <Badge className={`${statusColor} text-white flex items-center gap-1`}>
            {statusIcon}
            {request.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* User Information */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm">{request.profiles?.name || 'Unknown User'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{request.profiles?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Phone:</span>
              <span className="text-sm">{request.phone_number}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Submitted:</span>
              <span className="text-sm">{format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {request.type === 'deposit' ? (
                <ArrowUpCircle className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-red-500" />
              )}
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Type:</span>
                <span className="text-sm font-semibold uppercase">{request.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Requested Amount:</span>
                <span className="text-sm font-semibold">Le {request.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm">Transaction Fee (2%):</span>
                <span className="text-sm">- Le {feeAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Final Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    Le {finalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof of Payment */}
        {request.screenshot_url && (
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Proof of Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={request.screenshot_url}
                alt="Payment proof"
                className="w-full rounded-lg border border-border"
              />
              <a
                href={request.screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Open in new tab
              </a>
            </CardContent>
          </Card>
        )}

        {/* Admin Notes (if any) */}
        {request.admin_notes && (
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Only show if pending */}
        {request.status === 'pending' && (
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => setActionType('approve')}
              disabled={processing}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve Request
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              size="lg"
              onClick={() => setActionType('reject')}
              disabled={processing}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject Request
            </Button>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? `This will credit Le ${finalAmount.toLocaleString()} to the user's wallet after deducting the 2% transaction fee.`
                : 'This will reject the request and notify the user.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="notes" className="text-sm font-medium">
              {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason (Optional)'}
            </Label>
            <Textarea
              id="notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={actionType === 'approve' ? 'Add any notes...' : 'Explain why this request is being rejected...'}
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
