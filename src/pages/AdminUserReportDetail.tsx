import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft,
  AlertTriangle,
  Ban,
  Clock,
  DollarSign,
  FileText,
  Mail,
  ShieldOff,
  CheckCircle,
  XCircle
} from 'lucide-react';
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

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  store_name: string | null;
  seller_name: string | null;
  order_id: string | null;
  description: string;
  amount: number | null;
  evidence_urls: string[];
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  action_taken: string | null;
  reporter?: {
    name: string;
    email: string;
    phone: string;
  };
}

const AdminUserReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'suspend' | 'ban' | 'refund' | 'request_info' | 'resolve' | 'dismiss' | null;
  }>({ open: false, action: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReportDetail();
    }
  }, [id]);

  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch reporter profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('id', data.reporter_id)
        .single();

      setReport({
        ...data,
        reporter: profile || undefined
      });
      setAdminNotes(data.admin_notes || '');
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report details');
      navigate('/admin/user-reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.action || !report) return;

    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update report status and notes
      const updates: any = {
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        action_taken: actionDialog.action
      };

      if (actionDialog.action === 'resolve') {
        updates.status = 'resolved';
      } else if (actionDialog.action === 'dismiss') {
        updates.status = 'dismissed';
      } else {
        updates.status = 'under_review';
      }

      const { error: updateError } = await supabase
        .from('user_reports')
        .update(updates)
        .eq('id', report.id);

      if (updateError) throw updateError;

      // Create notification for reporter
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: report.reporter_id,
          type: 'system',
          title: 'Report Update',
          body: `Your fraud report has been ${actionDialog.action.replace('_', ' ')}. ${adminNotes ? 'Admin notes: ' + adminNotes : ''}`,
          link_url: `/notifications`
        });

      if (notifError) console.error('Error creating notification:', notifError);

      toast.success(`Report ${actionDialog.action.replace('_', ' ')} successfully`);
      setActionDialog({ open: false, action: null });
      fetchReportDetail();
    } catch (error: any) {
      console.error('Error processing action:', error);
      toast.error('Failed to process action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/user-reports')}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Report Details</h1>
              <p className="text-sm text-muted-foreground">ID: {report.id.slice(0, 8)}</p>
            </div>
          </div>
          <Badge className={report.status === 'pending' ? 'bg-yellow-500' : report.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}>
            {report.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Reporter Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Reporter Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{report.reporter?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{report.reporter?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{report.reporter?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reported On</p>
                <p className="font-medium">{format(new Date(report.created_at), 'MMM d, yyyy • h:mm a')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {report.store_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Store Name</p>
                  <p className="font-medium">{report.store_name}</p>
                </div>
              )}
              {report.seller_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Seller Name</p>
                  <p className="font-medium">{report.seller_name}</p>
                </div>
              )}
              {report.order_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{report.order_id}</p>
                </div>
              )}
              {report.amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Amount Involved</p>
                  <p className="font-medium text-destructive">Le {report.amount.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-foreground whitespace-pre-wrap">{report.description}</p>
            </div>

            {report.evidence_urls && report.evidence_urls.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Evidence ({report.evidence_urls.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {report.evidence_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border hover:border-primary transition-colors"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Admin Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">Internal Notes</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add notes about your investigation, findings, or actions taken..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[100px] rounded-xl mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {report.status !== 'resolved' && report.status !== 'dismissed' && (
          <Card>
            <CardHeader>
              <CardTitle>Take Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: 'suspend' })}
                  className="border-orange-500/30 hover:bg-orange-500/10"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Suspend User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: 'ban' })}
                  className="border-destructive/30 hover:bg-destructive/10"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: 'refund' })}
                  className="border-green-500/30 hover:bg-green-500/10"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Issue Refund
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: 'request_info' })}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Request Info
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: 'resolve' })}
                  className="border-green-500/30 hover:bg-green-500/10"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, action: 'dismiss' })}
                  className="border-gray-500/30 hover:bg-gray-500/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.action?.replace('_', ' ')} this report?
              {actionDialog.action === 'ban' && ' This will permanently ban the reported user from the platform.'}
              {actionDialog.action === 'suspend' && ' This will temporarily suspend the reported user.'}
              {actionDialog.action === 'refund' && ' This will process a refund to the reporter.'}
              {actionDialog.action === 'resolve' && ' This will mark the report as resolved.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUserReportDetail;
