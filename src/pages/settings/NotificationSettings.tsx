import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Bell, 
  Mail,
  MessageSquare,
  ShoppingBag,
  Megaphone,
  Smartphone,
  Loader2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    promotions: false,
    updates: true,
    email_notifications: true,
  });

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setNotifications({
          orders: prefs.orders ?? true,
          messages: prefs.messages ?? true,
          promotions: prefs.promotions ?? false,
          updates: prefs.updates ?? true,
          email_notifications: prefs.email_notifications ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Notification preferences updated',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-muted/50 mb-4"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how you receive notifications
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Push Notifications */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <Label className="font-medium">Order Updates</Label>
                  <p className="text-xs text-muted-foreground">Get notified about your orders</p>
                </div>
              </div>
              <Switch
                checked={notifications.orders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, orders: checked })
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="font-medium">Messages</Label>
                  <p className="text-xs text-muted-foreground">New message notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.messages}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, messages: checked })
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <Label className="font-medium">Promotions</Label>
                  <p className="text-xs text-muted-foreground">Deals and special offers</p>
                </div>
              </div>
              <Switch
                checked={notifications.promotions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, promotions: checked })
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <Label className="font-medium">App Updates</Label>
                  <p className="text-xs text-muted-foreground">New features and improvements</p>
                </div>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, updates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Email Alerts</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive email notifications for important updates, orders, and messages
                </p>
              </div>
              <Switch
                checked={notifications.email_notifications}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email_notifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl h-12 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default NotificationSettings;
