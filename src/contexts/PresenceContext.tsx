import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  userLastSeen: (userId: string) => string | null;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
};

interface PresenceProviderProps {
  children: ReactNode;
}

export const PresenceProvider = ({ children }: PresenceProviderProps) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    // Update user's online status in database
    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        await supabase
          .from('profiles')
          .update({
            is_online: isOnline,
            last_seen: isOnline ? null : new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Set user as online
    updateOnlineStatus(true);

    // Create global presence channel
    const channel = supabase.channel('global-presence', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach(userId => {
          if (userId !== user.id) {
            online.add(userId);
          }
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set(prev).add(key));
        setLastSeenMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        setLastSeenMap(prev => new Map(prev).set(key, new Date().toISOString()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
        if (channel) {
          channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      }
    };

    // Handle app close/tab close
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    // Handle page focus/blur for better presence detection
    const handleFocus = () => {
      updateOnlineStatus(true);
      if (channel) {
        channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    };

    const handleBlur = () => {
      // Set small delay before going offline to avoid flicker
      setTimeout(() => {
        if (document.hidden) {
          updateOnlineStatus(false);
        }
      }, 3000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Periodic heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden && channel) {
        channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      clearInterval(heartbeatInterval);
      
      updateOnlineStatus(false);
      
      if (channel) {
        channel.untrack().then(() => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [user]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  const userLastSeen = (userId: string): string | null => {
    return lastSeenMap.get(userId) || null;
  };

  return (
    <PresenceContext.Provider value={{ onlineUsers, isUserOnline, userLastSeen }}>
      {children}
    </PresenceContext.Provider>
  );
};
