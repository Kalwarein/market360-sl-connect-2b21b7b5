import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, Ban, Clock, Calendar, Store,
  Send, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Store {
  id: string;
  store_name: string;
  status?: string;
  suspension_reason?: string;
  suspended_at?: string;
  suspension_expires_at?: string;
}

interface Appeal {
  id: string;
  status: string;
  appeal_message: string;
  admin_response?: string;
  created_at: string;
  reviewed_at?: string;
}

interface StoreModerationScreenProps {
  store: Store;
  onClose?: () => void;
}

export const StoreModerationScreen = ({ store, onClose }: StoreModerationScreenProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingAppeal();
  }, [store.id]);

  const loadExistingAppeal = async () => {
    try {
      const { data } = await supabase
        .from('store_moderation_appeals')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setAppeal(data);
    } catch (error) {
      console.error('Error loading appeal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealMessage.trim()) {
      toast.error('Please enter your appeal message');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('store_moderation_appeals')
        .insert({
          store_id: store.id,
          user_id: user?.id,
          appeal_message: appealMessage,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Appeal submitted successfully');
      loadExistingAppeal();
      setAppealMessage('');
    } catch (error) {
      console.error('Error submitting appeal:', error);
      toast.error('Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  const storeStatus = store.status || 'active';
  const isSuspended = storeStatus === 'suspended';
  const isBanned = storeStatus === 'banned';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className={`border-2 ${isBanned ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
        <CardHeader className="text-center pb-2">
          <div className={`mx-auto p-4 rounded-full ${isBanned ? 'bg-red-100' : 'bg-yellow-100'} mb-4`}>
            {isBanned ? (
              <Ban className="h-12 w-12 text-red-600" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            )}
          </div>
          <CardTitle className={`text-2xl ${isBanned ? 'text-red-700' : 'text-yellow-700'}`}>
            Store {isBanned ? 'Banned' : 'Suspended'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Store className="h-5 w-5" />
              {store.store_name}
            </div>
            <Badge variant={isBanned ? 'destructive' : 'secondary'} className="mt-2">
              {isBanned ? 'Permanently Banned' : 'Temporarily Suspended'}
            </Badge>
          </div>

          {/* Reason */}
          <div className={`p-4 rounded-lg ${isBanned ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <p className="text-sm font-medium mb-1">Reason:</p>
            <p className="text-sm">{store.suspension_reason || 'No reason provided'}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Since</span>
              </div>
              <p className="text-sm font-medium">
                {store.suspended_at 
                  ? format(new Date(store.suspended_at), 'MMM dd, yyyy')
                  : 'N/A'
                }
              </p>
            </div>
            {isSuspended && store.suspension_expires_at && (
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Lifts On</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(store.suspension_expires_at), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Existing Appeal Status */}
          {appeal && (
            <div className={`p-4 rounded-lg border-2 ${
              appeal.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
              appeal.status === 'approved' ? 'border-green-300 bg-green-50' :
              'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {appeal.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                {appeal.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {appeal.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                <span className="font-medium capitalize">Appeal {appeal.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Submitted on {format(new Date(appeal.created_at), 'MMM dd, yyyy')}
              </p>
              {appeal.admin_response && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response:</p>
                  <p className="text-sm">{appeal.admin_response}</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Appeal Form */}
          {(!appeal || appeal.status === 'rejected') && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {appeal?.status === 'rejected' ? 'Submit New Appeal' : 'Appeal This Decision'}
                </label>
                <Textarea
                  placeholder="Explain why you believe this decision should be reconsidered..."
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSubmitAppeal}
                disabled={submitting || !appealMessage.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Appeal'}
              </Button>
            </div>
          )}

          {/* Back Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onClose ? onClose() : navigate('/')}
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
