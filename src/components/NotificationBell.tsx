import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      subscribeToNotifications();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .is('read_at', null);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notification-bell')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-white hover:bg-white/20"
      onClick={() => navigate('/notifications')}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <>
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-destructive animate-pulse" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </>
      )}
    </Button>
  );
};

export default NotificationBell;