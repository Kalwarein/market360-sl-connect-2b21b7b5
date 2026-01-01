import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, AlertTriangle, Ban, Trash2,
  CheckCircle, Clock, Calendar, Store
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

interface Product {
  id: string;
  title: string;
  store_id: string;
  created_at: string;
  status?: string;
  suspended_at?: string;
  suspension_reason?: string;
}

interface AdminProductPanelProps {
  product: Product;
  storeName?: string;
  onStatusChange: () => void;
}

export const AdminProductPanel = ({ product, storeName, onStatusChange }: AdminProductPanelProps) => {
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'ban' | 'unsuspend' | 'delete' | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  if (rolesLoading || !isAdmin) {
    return null;
  }

  const productStatus = product.status || 'active';

  const handleAction = (type: 'suspend' | 'ban' | 'unsuspend' | 'delete') => {
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
      if (actionType === 'delete') {
        // Delete the product
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (error) throw error;

        // Log the deletion
        await supabase.from('product_moderation').insert({
          product_id: product.id,
          admin_id: user?.id,
          action: 'delete',
          reason: reason,
        });

        await supabase.from('audit_logs').insert({
          actor_id: user?.id,
          action: 'product_delete',
          target_type: 'product',
          target_id: product.id,
          description: `Product "${product.title}" was permanently deleted. Reason: ${reason}`,
        });

        toast.success('Product deleted permanently');
      } else {
        const newStatus = actionType === 'unsuspend' ? 'active' : actionType === 'suspend' ? 'suspended' : 'banned';

        // Update product status
        const { error: updateError } = await supabase
          .from('products')
          .update({
            status: newStatus,
            published: actionType === 'unsuspend', // Also unpublish when suspended/banned
            suspended_at: actionType === 'unsuspend' ? null : new Date().toISOString(),
            suspended_by: actionType === 'unsuspend' ? null : user?.id,
            suspension_reason: actionType === 'unsuspend' ? null : reason,
          })
          .eq('id', product.id);

        if (updateError) throw updateError;

        // Log the moderation action
        await supabase.from('product_moderation').insert({
          product_id: product.id,
          admin_id: user?.id,
          action: actionType,
          reason: reason || `Product ${actionType}`,
        });

        // Create audit log
        await supabase.from('audit_logs').insert({
          actor_id: user?.id,
          action: `product_${actionType}`,
          target_type: 'product',
          target_id: product.id,
          description: `Product "${product.title}" was ${actionType}ed. Reason: ${reason || 'N/A'}`,
        });

        toast.success(`Product ${actionType}ed successfully`);
      }

      onStatusChange();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setProcessing(false);
      setShowConfirmDialog(false);
      setActionType(null);
      setReason('');
    }
  };

  const getStatusBadge = () => {
    switch (productStatus) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-500"><Ban className="h-3 w-3 mr-1" /> Banned</Badge>;
      default:
        return <Badge variant="secondary">{productStatus}</Badge>;
    }
  };

  return (
    <>
      <Card className="border-2 border-red-200 bg-red-50/30 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-700 text-base">
            <Shield className="h-5 w-5" />
            Admin Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Status */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            {product.suspended_at && (
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Since</p>
                <p className="font-medium">{format(new Date(product.suspended_at), 'MMM dd, yyyy')}</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Store className="h-4 w-4" />
                <span className="text-xs">Store</span>
              </div>
              <p className="text-sm font-medium truncate">{storeName || 'Loading...'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Created</span>
              </div>
              <p className="text-sm font-medium">{format(new Date(product.created_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {/* Suspension Reason */}
          {product.suspension_reason && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 font-medium mb-1">Reason</p>
              <p className="text-sm">{product.suspension_reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {productStatus === 'active' && (
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
            {productStatus === 'suspended' && (
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
            {productStatus === 'banned' && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-700 hover:bg-green-50"
                onClick={() => handleAction('unsuspend')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Unban
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-700 hover:bg-red-50"
              onClick={() => handleAction('delete')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'suspend' && 'Suspend Product'}
              {actionType === 'ban' && 'Ban Product'}
              {actionType === 'unsuspend' && 'Reactivate Product'}
              {actionType === 'delete' && 'Delete Product Permanently'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'suspend' && 'This will temporarily hide the product from public listings.'}
              {actionType === 'ban' && 'This will permanently ban this product for policy violation.'}
              {actionType === 'unsuspend' && 'This will reactivate the product and make it visible again.'}
              {actionType === 'delete' && 'This action cannot be undone. The product will be permanently removed.'}
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
              className={actionType === 'delete' || actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
