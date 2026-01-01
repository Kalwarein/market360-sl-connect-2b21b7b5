import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Store, User, Calendar, Clock,
  CheckCircle, XCircle, MessageSquare, AlertTriangle
} from 'lucide-react';
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
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StoreAppeal {
  id: string;
  store_id: string;
  user_id: string;
  appeal_message: string;
  admin_response: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface StoreData {
  id: string;
  store_name: string;
  logo_url: string | null;
  status: string;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspension_expires_at: string | null;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
}

const AdminStoreAppealDetail = () => {
  const { appealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appeal, setAppeal] = useState<StoreAppeal | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminResponse, setAdminResponse] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (appealId) {
      loadAppealData();
    }
  }, [appealId]);

  const loadAppealData = async () => {
    try {
      // Load appeal
      const { data: appealData, error: appealError } = await supabase
        .from('store_moderation_appeals')
        .select('*')
        .eq('id', appealId)
        .single();

      if (appealError) throw appealError;
      setAppeal(appealData);
      setAdminResponse(appealData.admin_response || '');

      // Load store
      if (appealData?.store_id) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', appealData.store_id)
          .single();

        setStore(storeData);
      }

      // Load owner profile
      if (appealData?.user_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .eq('id', appealData.user_id)
          .single();

        setOwner(ownerData);
      }
    } catch (error) {
      console.error('Error loading appeal:', error);
      toast.error('Failed to load appeal details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: 'approve' | 'reject') => {
    if (!adminResponse.trim() && type === 'reject') {
      toast.error('Please provide a response before rejecting');
      return;
    }
    setActionType(type);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!appeal || !actionType) return;

    setProcessing(true);
    try {
      // Update appeal status
      const { error: appealError } = await supabase
        .from('store_moderation_appeals')
        .update({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          admin_response: adminResponse || (actionType === 'approve' ? 'Your appeal has been approved.' : 'Your appeal has been rejected.'),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appeal.id);

      if (appealError) throw appealError;

      // If approved, reactivate the store
      if (actionType === 'approve' && store) {
        const { error: storeError } = await supabase
          .from('stores')
          .update({
            status: 'active',
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null,
            suspension_expires_at: null,
          })
          .eq('id', store.id);

        if (storeError) throw storeError;

        // Log the reactivation
        await supabase.from('store_moderation').insert({
          store_id: store.id,
          admin_id: user?.id,
          action: 'appeal_approved',
          reason: `Appeal approved: ${adminResponse || 'Store reactivated after successful appeal'}`,
        });
      }

      // Create notification for store owner
      await supabase.from('notifications').insert({
        user_id: appeal.user_id,
        type: 'system',
        title: actionType === 'approve' ? 'Store Appeal Approved!' : 'Store Appeal Rejected',
        body: actionType === 'approve'
          ? `Great news! Your appeal for "${store?.store_name}" has been approved. Your store is now active again.`
          : `Your appeal for "${store?.store_name}" has been rejected. ${adminResponse || 'Please contact support for more information.'}`,
      });

      // Create audit log
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        action: `store_appeal_${actionType}`,
        target_type: 'store_appeal',
        target_id: appeal.id,
        description: `Store appeal ${actionType}ed for "${store?.store_name}". Response: ${adminResponse || 'N/A'}`,
      });

      toast.success(`Appeal ${actionType}ed successfully`);
      navigate('/admin/appeals');
    } catch (error) {
      console.error('Error processing appeal:', error);
      toast.error('Failed to process appeal');
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Appeal not found</p>
            <Button className="mt-4" onClick={() => navigate('/admin/appeals')}>
              Back to Appeals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin/appeals')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appeals
        </Button>
        <h1 className="text-2xl font-bold">Store Appeal</h1>
        <p className="text-sm opacity-90">Review and respond to this appeal</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Appeal Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(appeal.status)}
            </div>
          </CardContent>
        </Card>

        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-semibold">{store?.store_name}</p>
                <Badge variant={store?.status === 'active' ? 'default' : 'destructive'}>
                  {store?.status || 'Unknown'}
                </Badge>
              </div>
            </div>
            {store?.suspension_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-medium text-red-700 mb-1">Suspension Reason</p>
                <p className="text-sm">{store.suspension_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Store Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{owner?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{owner?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/users/${owner?.id}`)}
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appeal Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Appeal Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{appeal.appeal_message}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Submitted on {format(new Date(appeal.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>

        {/* Admin Response */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your response to this appeal..."
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              className="min-h-[120px]"
              disabled={appeal.status !== 'pending'}
            />
            
            {appeal.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction('approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Reactivate
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleAction('reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}

            {appeal.reviewed_at && (
              <p className="text-xs text-muted-foreground">
                Reviewed on {format(new Date(appeal.reviewed_at), 'MMM dd, yyyy HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Appeal & Reactivate Store?' : 'Reject Appeal?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? 'This will reactivate the store and notify the owner. The store will become visible to customers again.'
                : 'The store will remain in its current state. The owner will be notified of the rejection.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmAction();
              }}
              disabled={processing}
              className={actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStoreAppealDetail;
