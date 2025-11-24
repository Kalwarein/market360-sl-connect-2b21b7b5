import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, BellRing } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read_at: string | null;
  created_at: string;
  image_url?: string;
  link_url?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { permission, isSubscribed, requestPermission } = usePushNotifications();

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(
        notifications.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .is('read_at', null);

      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    // Handle seller application approval notifications
    if (notification.title.includes('Seller Application Approved') || 
        notification.body.includes('seller application has been approved')) {
      navigate('/become-seller');
      return;
    }
    
    // Handle order notifications
    if (notification.type === 'order' && notification.body.includes('Order #')) {
      const orderMatch = notification.body.match(/Order #(\S+)/);
      if (orderMatch) {
        navigate(`/orders`);
        return;
      }
    }
    
    // If notification has a link_url, navigate there directly
    if (notification.link_url) {
      navigate(notification.link_url);
    } else {
      navigate(`/notification/${notification.id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Modern Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-background/95">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 rounded-full"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
                <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No notifications yet</h3>
              <p className="text-sm text-muted-foreground">
                You'll be notified about orders, messages, and updates here
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification, index) => (
            <Card
              key={notification.id}
              className={`
                cursor-pointer transition-all duration-200 animate-fade-in
                hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]
                ${!notification.read_at 
                  ? 'border-primary/50 bg-primary/5 shadow-md' 
                  : 'border-border/50 shadow-sm hover:border-border'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Notification Icon/Image */}
                  <div className="flex-shrink-0">
                    {notification.image_url ? (
                      <div className="relative">
                        <img
                          src={notification.image_url}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover ring-2 ring-border/50"
                        />
                        {!notification.read_at && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full ring-2 ring-background" />
                        )}
                      </div>
                    ) : (
                      <div className={`
                        h-14 w-14 rounded-xl flex items-center justify-center relative
                        ${notification.type === 'order' ? 'bg-blue-500/10' : ''}
                        ${notification.type === 'message' ? 'bg-green-500/10' : ''}
                        ${notification.type === 'system' ? 'bg-orange-500/10' : ''}
                        ${notification.type === 'broadcast' ? 'bg-purple-500/10' : ''}
                      `}>
                        <BellRing className={`h-6 w-6 ${
                          notification.type === 'order' ? 'text-blue-500' : ''
                        } ${
                          notification.type === 'message' ? 'text-green-500' : ''
                        } ${
                          notification.type === 'system' ? 'text-orange-500' : ''
                        } ${
                          notification.type === 'broadcast' ? 'text-purple-500' : ''
                        }`} />
                        {!notification.read_at && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full ring-2 ring-background" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm leading-tight ${
                        !notification.read_at ? 'text-foreground' : 'text-foreground/80'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read_at && (
                        <Badge 
                          variant="default" 
                          className="flex-shrink-0 h-5 text-xs bg-primary hover:bg-primary"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mb-2 line-clamp-2 ${
                      !notification.read_at ? 'text-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {notification.type && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {notification.type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
