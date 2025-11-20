import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  avatar_url: string;
}

interface UserModeration {
  id: string;
  type: string;
  reason: string;
  expires_at: string | null;
}

interface AppealDetail {
  id: string;
  appeal_message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_id: string;
  moderation_id: string;
  profiles: UserProfile;
  user_moderation: UserModeration;
}

const AdminAppealDetail = () => {
  const navigate = useNavigate();
  const { appealId } = useParams();
  const { user } = useAuth();
  const [appeal, setAppeal] = useState<AppealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminResponse, setAdminResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (appealId) {
      loadAppealDetail();
    }
  }, [appealId]);

  const loadAppealDetail = async () => {
    try {
      const { data: appealData, error } = await supabase
        .from('moderation_appeals')
        .select('*')
        .eq('id', appealId)
        .single();

      if (error) throw error;
      
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, avatar_url')
        .eq('id', appealData.user_id)
        .single();
      
      // Load moderation
      const { data: moderation } = await supabase
        .from('user_moderation')
        .select('id, type, reason, expires_at')
        .eq('id', appealData.moderation_id)
        .single();
      
      const fullAppeal = {
        ...appealData,
        profiles: profile || { name: '', email: '', avatar_url: '' },
        user_moderation: moderation || { id: '', type: '', reason: '', expires_at: null },
      };
      
      setAppeal(fullAppeal);
      setAdminResponse(fullAppeal.admin_response || '');
    } catch (error) {
      console.error('Error loading appeal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!adminResponse.trim()) {
      toast.error('Please provide a response');
      return;
    }

    setProcessing(true);
    try {
      // Update appeal status
      await supabase
        .from('moderation_appeals')
        .update({
          status: 'approved',
          admin_response: adminResponse.trim(),
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appealId);

      // Deactivate the moderation
      await supabase
        .from('user_moderation')
        .update({ is_active: false })
        .eq('id', appeal!.user_moderation?.id);

      toast.success('Appeal approved and user restriction lifted');
      navigate('/admin/appeals');
    } catch (error) {
      console.error('Error approving appeal:', error);
      toast.error('Failed to approve appeal');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminResponse.trim()) {
      toast.error('Please provide a response');
      return;
    }

    setProcessing(true);
    try {
      await supabase
        .from('moderation_appeals')
        .update({
          status: 'rejected',
          admin_response: adminResponse.trim(),
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appealId);

      toast.success('Appeal rejected');
      navigate('/admin/appeals');
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      toast.error('Failed to reject appeal');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Appeal not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canTakeAction = appeal.status === 'pending';

  return (
    <div className="min-h-screen bg-background pb-20">
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
        <h1 className="text-2xl font-bold">Appeal Details</h1>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={appeal.profiles?.avatar_url} />
                <AvatarFallback className="text-xl">
                  {appeal.profiles?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">
                  {appeal.profiles?.name || 'Unknown User'}
                </h3>
                <p className="text-muted-foreground">{appeal.profiles?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Original {appeal.user_moderation?.type === 'ban' ? 'Ban' : 'Suspension'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Reason</Label>
              <p className="text-sm mt-1">{appeal.user_moderation?.reason}</p>
            </div>
            {appeal.user_moderation?.expires_at && (
              <div>
                <Label className="text-sm font-medium">Expires</Label>
                <p className="text-sm mt-1">
                  {format(new Date(appeal.user_moderation.expires_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Appeal Message</CardTitle>
              <Badge>{appeal.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{appeal.appeal_message}</p>
            <p className="text-xs text-muted-foreground">
              Submitted on {format(new Date(appeal.created_at), 'MMMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>

        {canTakeAction ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your Response</Label>
                <Textarea
                  placeholder="Enter your response to this appeal..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : 'Approve & Lift Restriction'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : 'Reject Appeal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Admin Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{appeal.admin_response}</p>
              {appeal.reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  Reviewed on {format(new Date(appeal.reviewed_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminAppealDetail;
