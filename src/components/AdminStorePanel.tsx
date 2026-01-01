import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, AlertTriangle, Ban, Eye, Package, 
  Bell, CheckCircle, Clock, User, Calendar,
  MessageSquare
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Store {
  id: string;
  store_name: string;
  owner_id: string;
  created_at: string;
  status?: string;
  suspended_at?: string;
  suspension_reason?: string;
}

interface AdminStorePanelProps {
  store: Store;
  onStatusChange: () => void;
}

export const AdminStorePanel = ({ store, onStatusChange }: AdminStorePanelProps) => {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'unsuspend' | null>(null);
  const [reason, setReason] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [processing, setProcessing] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  // Fetch owner profile on mount
  useState(() => {
    const fetchOwner = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', store.owner_id)
        .single();
      setOwnerProfile(data);
    };
    fetchOwner();
  });

  if (rolesLoading || !isAdmin) {
    return null;
  }

  const storeStatus = store.status || 'active';

  const handleAction = (type: 'suspend' | 'ban' | 'unsuspend') => {
    setActionType(type);
    setReason('');
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!actionType || (!reason && actionType !== 'unsuspend')) {
      toast.error('Please provide a reason');
      return;
    }

    setProcessing(true);
    try {
      const newStatus = actionType === 'unsuspend' ? 'active' : actionType === 'suspend' ? 'suspended' : 'banned';

      // Update store status
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          status: newStatus,
          suspended_at: actionType === 'unsuspend' ? null : new Date().toISOString(),
          suspended_by: actionType === 'unsuspend' ? null : user?.id,
          suspension_reason: actionType === 'unsuspend' ? null : reason,
        })
        .eq('id', store.id);

      if (updateError) throw updateError;

      // Log the moderation action
      await supabase.from('store_moderation').insert({
        store_id: store.id,
        admin_id: user?.id,
        action: actionType,
        reason: reason || `Store ${actionType}`,
      });

      // Create audit log
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        action: `store_${actionType}`,
        target_type: 'store',
        target_id: store.id,
        description: `Store "${store.store_name}" was ${actionType}ed. Reason: ${reason || 'N/A'}`,
      });

      // Notify store owner
      await supabase.from('notifications').insert({
        user_id: store.owner_id,
        type: 'system',
        title: `Store ${actionType === 'suspend' ? 'Suspended' : actionType === 'ban' ? 'Banned' : 'Reactivated'}`,
        body: actionType === 'unsuspend' 
          ? 'Your store has been reactivated and is now visible to customers.'
          : `Your store "${store.store_name}" has been ${actionType}ed. Reason: ${reason}`,
      });

      toast.success(`Store ${actionType}ed successfully`);
      onStatusChange();
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Failed to update store status');
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
      setActionType(null);
      setReason('');
    }
  };

  const sendNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      toast.error('Please fill in all fields');
      return;
    }

    setProcessing(true);
    try {
      await supabase.from('notifications').insert({
        user_id: store.owner_id,
        type: 'system',
        title: notificationTitle,
        body: notificationBody,
      });

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        action: 'send_store_notification',
        target_type: 'store',
        target_id: store.id,
        description: `Sent notification to store owner: ${notificationTitle}`,
      });

      toast.success('Notification sent successfully');
      setShowNotificationDialog(false);
      setNotificationTitle('');
      setNotificationBody('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (storeStatus) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-500"><Ban className="h-3 w-3 mr-1" /> Banned</Badge>;
      default:
        return <Badge variant="secondary">{storeStatus}</Badge>;
    }
  };

  return (
    <>
      <Card className="border-2 border-red-200 bg-red-50/30 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="h-5 w-5" />
            Admin Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Store Status */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Store Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            {store.suspended_at && (
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Since</p>
                <p className="font-medium">{format(new Date(store.suspended_at), 'MMM dd, yyyy')}</p>
              </div>
            )}
          </div>

          {/* Store Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span className="text-xs">Owner</span>
              </div>
              <p className="text-sm font-medium truncate">{ownerProfile?.name || ownerProfile?.email || 'Loading...'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Created</span>
              </div>
              <p className="text-sm font-medium">{format(new Date(store.created_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {/* Suspension Reason */}
          {store.suspension_reason && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 font-medium mb-1">Suspension Reason</p>
              <p className="text-sm">{store.suspension_reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {storeStatus === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  onClick={() => handleAction('suspend')}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() => handleAction('ban')}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Ban
                </Button>
              </>
            )}
            {storeStatus === 'suspended' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  onClick={() => handleAction('unsuspend')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Unsuspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() => handleAction('ban')}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Ban
                </Button>
              </>
            )}
            {storeStatus === 'banned' && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-700 hover:bg-green-50 col-span-2"
                onClick={() => handleAction('unsuspend')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Unban Store
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowNotificationDialog(true)}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Notification to Owner
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open(`/admin/users/${store.owner_id}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Owner Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend' && 'Suspend Store'}
              {actionType === 'ban' && 'Ban Store'}
              {actionType === 'unsuspend' && 'Reactivate Store'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend' && 'This will temporarily hide the store from public view. The owner can appeal this decision.'}
              {actionType === 'ban' && 'This will permanently ban this store. This is a serious action.'}
              {actionType === 'unsuspend' && 'This will reactivate the store and make it visible to customers again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionType !== 'unsuspend' && (
            <div className="py-4">
              <Textarea
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmAction();
              }}
              disabled={processing || (actionType !== 'unsuspend' && !reason)}
              className={actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send a direct notification to the store owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Notification title..."
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Enter your message..."
                value={notificationBody}
                onChange={(e) => setNotificationBody(e.target.value)}
                className="min-h-[100px] mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendNotification} disabled={processing}>
              {processing ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
