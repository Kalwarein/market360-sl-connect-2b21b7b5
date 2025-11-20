import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Ban, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Moderation {
  id: string;
  type: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
}

interface Appeal {
  id: string;
  status: string;
  created_at: string;
}

const ModerationScreen = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [moderation, setModeration] = useState<Moderation | null>(null);
  const [existingAppeal, setExistingAppeal] = useState<Appeal | null>(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      checkModeration();
    }
  }, [user]);

  const checkModeration = async () => {
    try {
      const { data, error } = await supabase
        .from('user_moderation')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check if suspension has expired
        if (data.type === 'suspension' && data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          if (expiresAt < new Date()) {
            // Suspension expired, deactivate it
            await supabase
              .from('user_moderation')
              .update({ is_active: false })
              .eq('id', data.id);
            
            navigate('/');
            return;
          }
        }
        
        setModeration(data);

        // Check if user already submitted an appeal for this moderation
        const { data: appealData } = await supabase
          .from('moderation_appeals')
          .select('id, status, created_at')
          .eq('moderation_id', data.id)
          .eq('user_id', user!.id)
          .maybeSingle();

        if (appealData) {
          setExistingAppeal(appealData);
        }
      } else {
        // No active moderation, redirect to home
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking moderation:', error);
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
      const { error } = await supabase.from('moderation_appeals').insert({
        moderation_id: moderation!.id,
        user_id: user!.id,
        appeal_message: appealMessage.trim(),
      });

      if (error) throw error;

      toast.success('Appeal submitted successfully');
      setAppealMessage('');
      
      // Reload to hide the appeal form
      checkModeration();
    } catch (error) {
      console.error('Error submitting appeal:', error);
      toast.error('Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!moderation) return null;

  const isBanned = moderation.type === 'ban';
  const Icon = isBanned ? Ban : Clock;
  const title = isBanned ? 'Account Banned' : 'Account Suspended';

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-destructive/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <Icon className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-destructive">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Reason for {isBanned ? 'Ban' : 'Suspension'}
              </h3>
              <p className="text-sm">{moderation.reason}</p>
            </div>

            {!isBanned && moderation.expires_at && (
              <div className="p-4 bg-warning/10 rounded-lg border border-warning">
                <p className="text-sm">
                  <strong>Your account will be automatically restored on:</strong>
                  <br />
                  {format(new Date(moderation.expires_at), 'MMMM dd, yyyy')} at {format(new Date(moderation.expires_at), 'HH:mm')}
                </p>
              </div>
            )}

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                {isBanned
                  ? 'Your account has been permanently banned from accessing Market360.'
                  : 'Your account access has been temporarily restricted. You will be able to access your account once the suspension period expires.'}
              </p>
            </div>
          </div>

          {existingAppeal ? (
            <div className="p-4 bg-muted rounded-lg border">
              <h3 className="font-semibold mb-2">Appeal Submitted</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You have already submitted an appeal for this {isBanned ? 'ban' : 'suspension'} on {format(new Date(existingAppeal.created_at), 'MMMM dd, yyyy')}.
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {existingAppeal.status.charAt(0).toUpperCase() + existingAppeal.status.slice(1)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The admin team will review your appeal. You cannot submit another appeal for this moderation action.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>
                {isBanned ? 'Request Account Restoration' : 'Submit an Appeal'}
              </Label>
              <Textarea
                placeholder={
                  isBanned 
                    ? "Explain why you believe your account should be restored..."
                    : "Explain why you believe this suspension should be reviewed..."
                }
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <Button
                onClick={handleSubmitAppeal}
                disabled={submitting}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : (isBanned ? 'Request Restoration' : 'Submit Appeal')}
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Logout
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>
              Issued on {format(new Date(moderation.created_at), 'MMMM dd, yyyy HH:mm')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModerationScreen;
