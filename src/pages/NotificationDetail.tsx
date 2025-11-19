import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Package, MessageSquare, Megaphone, Info } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationDetail {
  id: string;
  title: string;
  body: string;
  type: string;
  read_at: string | null;
  created_at: string;
  image_url?: string;
  link_url?: string;
  metadata?: any;
}

const NotificationDetail = () => {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (notificationId && user) {
      loadNotification();
    }
  }, [notificationId, user]);

  const loadNotification = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setNotification(data);

      // Mark as read if not already
      if (data && !data.read_at) {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);
      }
    } catch (error) {
      console.error('Error loading notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-6 w-6" />;
      case 'message':
        return <MessageSquare className="h-6 w-6" />;
      case 'broadcast':
        return <Megaphone className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-primary/10 text-primary';
      case 'message':
        return 'bg-blue-500/10 text-blue-600';
      case 'broadcast':
        return 'bg-purple-500/10 text-purple-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleActionClick = () => {
    if (notification?.link_url) {
      navigate(notification.link_url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Notification Not Found</h2>
          <Button onClick={() => navigate('/notifications')}>Back to Notifications</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notification</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${getTypeBadgeColor(notification.type)}`}>
                {getTypeIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold">{notification.title}</h2>
                  <Badge variant="outline" className={getTypeBadgeColor(notification.type)}>
                    {notification.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(notification.created_at), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>
            </div>

            {notification.image_url && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={notification.image_url}
                  alt={notification.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {notification.body}
              </p>
            </div>

            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Additional Details</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(notification.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {notification.link_url && (
              <Button className="w-full" onClick={handleActionClick}>
                View Details
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationDetail;
