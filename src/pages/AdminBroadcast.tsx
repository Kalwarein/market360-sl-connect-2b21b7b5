import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
const AdminBroadcast = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    image_url: '',
    link_url: '',
  });

  const handleBroadcast = async () => {
    if (!formData.title || !formData.body) {
      toast({
        title: 'Error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSending(true);

      // Create broadcast record
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcasts')
        .insert({
          sender_id: user?.id,
          title: formData.title,
          body: formData.body,
          image_url: formData.image_url || null,
          link_url: formData.link_url || null,
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      // Create in-app notifications for all users
      const notifications = users.map(u => ({
        user_id: u.id,
        type: 'broadcast' as const,
        title: formData.title,
        body: formData.body,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;

      // Send push notification via OneSignal (broadcast to all)
      const { data: pushData, error: pushError } = await supabase.functions.invoke(
        'send-onesignal-notification',
        {
          body: {
            title: formData.title,
            body: formData.body,
            link_url: formData.link_url || undefined,
            image_url: formData.image_url || undefined,
            is_broadcast: true,
          },
        }
      );

       const pushOk = !pushError && (pushData as any)?.success !== false;
       const recipients = (pushData as any)?.recipients ?? 0;
       const pushErrorMsg = (pushData as any)?.error;

       if (pushError || (pushData as any)?.success === false) {
         console.error('[AdminBroadcast] Push failed:', { pushError, pushData });
       }

       console.log('[AdminBroadcast] Push result:', { pushOk, recipients, pushData });

       const pushNote = !pushOk
         ? `failed${pushErrorMsg ? ` (${Array.isArray(pushErrorMsg) ? pushErrorMsg.join(', ') : String(pushErrorMsg)})` : ''}`
         : recipients === 0
           ? '0 recipients (no subscribed devices)'
           : `${recipients} recipients`;

       toast({
         title: 'Broadcast Sent',
         description: `In-app sent to ${users.length} users. Push: ${pushNote}`,
         variant: pushOk && recipients > 0 ? 'default' : 'destructive',
       });

      setFormData({
        title: '',
        body: '',
        image_url: '',
        link_url: '',
      });

      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error broadcasting:', error);
      const message = error instanceof Error ? error.message : 'Failed to send broadcast';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin-dashboard')}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Broadcast Message</h1>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Send to All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Your message to all users"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="mt-2"
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="link_url">Link URL (Optional)</Label>
              <Input
                id="link_url"
                placeholder="https://..."
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleBroadcast}
              disabled={sending}
              className="w-full"
            >
              {sending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Broadcast to All Users
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBroadcast;
