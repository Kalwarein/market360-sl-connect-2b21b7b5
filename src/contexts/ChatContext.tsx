import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
  read_at: string | null;
  attachments?: string[];
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  product_id?: string;
  products?: {
    title: string;
    images: string[];
  };
  other_user?: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_online?: boolean;
    last_seen?: string;
  };
  last_message?: {
    body: string;
    sender_id: string;
  };
  unread_count: number;
  is_enquiry?: boolean;
  is_pinned?: boolean;
  is_muted?: boolean;
  is_archived?: boolean;
}

interface ChatContextType {
  conversations: Conversation[];
  loading: boolean;
  refreshConversations: () => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  pinConversation: (id: string) => void;
  muteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CACHE_KEY = 'market360_chat_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFromCache();
      refreshConversations();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user]);

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setConversations(data);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
  };

  const saveToCache = (data: Conversation[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const refreshConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversationsWithData = await Promise.all(
        (data || []).map(async (conv) => {
          const isBuyer = conv.buyer_id === user?.id;
          const otherUserId = isBuyer ? conv.seller_id : conv.buyer_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url, is_online, last_seen')
            .eq('id', otherUserId)
            .maybeSingle();

          let product = null;
          if (conv.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('title, images')
              .eq('id', conv.product_id)
              .maybeSingle();
            product = productData;
          }

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('body, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user?.id)
            .is('read_at', null);

          const { data: enquiryMessages } = await supabase
            .from('messages')
            .select('attachments')
            .eq('conversation_id', conv.id)
            .not('attachments', 'is', null)
            .limit(10);

          const isEnquiry = enquiryMessages?.some((msg) => {
            if (msg.attachments?.[0]) {
              try {
                const parsed = JSON.parse(msg.attachments[0]);
                return parsed.type === 'enquiry';
              } catch (e) {
                return false;
              }
            }
            return false;
          });

          return {
            ...conv,
            other_user: { 
              id: otherUserId,
              name: profile?.name || 'Unknown', 
              avatar_url: profile?.avatar_url || null,
              is_online: profile?.is_online || false,
              last_seen: profile?.last_seen || null
            },
            products: product,
            last_message: lastMessage,
            unread_count: count || 0,
            is_enquiry: isEnquiry,
            is_pinned: false,
            is_muted: false,
            is_archived: false,
          };
        })
      );

      // Sort: unread messages first (by last_message_at), then pinned, then by last_message_at
      const sortedConversations = conversationsWithData.sort((a, b) => {
        // First priority: unread messages
        const aHasUnread = a.unread_count > 0;
        const bHasUnread = b.unread_count > 0;
        
        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;
        
        // Second priority: pinned conversations
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        // Third priority: most recent message
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(sortedConversations);
      saveToCache(sortedConversations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('[ChatContext] Setting up real-time subscriptions');
    
    // Use unique channel IDs to avoid conflicts
    const channelSuffix = `${user?.id}-${Date.now()}`;
    
    const messagesChannel = supabase
      .channel(`messages-list-realtime-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[ChatContext] New message received:', payload.new);
          // Refresh conversations to update last message and unread count
          refreshConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[ChatContext] Message updated:', payload.new);
          // Update read status in conversations
          refreshConversations();
        }
      )
      .subscribe((status) => {
        console.log('[ChatContext] Messages channel status:', status);
      });

    const conversationsChannel = supabase
      .channel(`conversations-list-realtime-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('[ChatContext] Conversation changed:', payload);
          refreshConversations();
        }
      )
      .subscribe((status) => {
        console.log('[ChatContext] Conversations channel status:', status);
      });

    // Listen for profile updates (online status changes)
    const profilesChannel = supabase
      .channel(`profiles-presence-realtime-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          console.log('[ChatContext] Profile updated:', updatedProfile.id);
          
          // Update the conversation with the new online status
          setConversations(prev => 
            prev.map(conv => {
              const otherUserId = conv.buyer_id === user?.id ? conv.seller_id : conv.buyer_id;
              
              if (otherUserId === updatedProfile.id && conv.other_user) {
                return {
                  ...conv,
                  other_user: {
                    ...conv.other_user,
                    is_online: updatedProfile.is_online,
                    last_seen: updatedProfile.last_seen
                  }
                };
              }
              return conv;
            })
          );
        }
      )
      .subscribe((status) => {
        console.log('[ChatContext] Profiles channel status:', status);
      });

    return () => {
      console.log('[ChatContext] Cleaning up real-time subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(profilesChannel);
    };
  };

  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id ? { ...conv, ...updates } : conv
      )
    );
  };

  const pinConversation = (id: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === id ? { ...conv, is_pinned: !conv.is_pinned } : conv
      );
      // Sort pinned conversations to top
      return updated.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });
    });
  };

  const muteConversation = (id: string) => {
    updateConversation(id, { 
      is_muted: conversations.find(c => c.id === id)?.is_muted ? false : true 
    });
  };

  const archiveConversation = (id: string) => {
    updateConversation(id, { 
      is_archived: conversations.find(c => c.id === id)?.is_archived ? false : true 
    });
  };

  const deleteConversation = async (id: string) => {
    try {
      // First, delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }

      // Then delete the conversation itself
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        throw conversationError;
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      // Clear cache to force refresh
      localStorage.removeItem(CACHE_KEY);
      
      console.log(`Successfully deleted conversation ${id} and all its messages`);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        loading,
        refreshConversations,
        updateConversation,
        pinConversation,
        muteConversation,
        archiveConversation,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
