import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  products?: {
    title: string;
    images: string[];
  };
  other_user?: {
    name: string;
    avatar_url: string | null;
  };
  last_message?: {
    body: string;
    sender_id: string;
  };
  unread_count: number;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitedConversations, setVisitedConversations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      // Fetch additional data for each conversation
      const conversationsWithData = await Promise.all(
        (data || []).map(async (conv) => {
          const isBuyer = conv.buyer_id === user?.id;
          const otherUserId = isBuyer ? conv.seller_id : conv.buyer_id;
          
          // Get other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();

          // Get product if exists
          let product = null;
          if (conv.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('title, images')
              .eq('id', conv.product_id)
              .maybeSingle();
            product = productData;
          }

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('body, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user?.id)
            .is('read_at', null);
          
          return {
            ...conv,
            other_user: profile || { name: 'Unknown', avatar_url: null },
            products: product,
            last_message: lastMessage,
            unread_count: visitedConversations.has(conv.id) ? 0 : (count || 0)
          };
        })
      );
      
      setConversations(conversationsWithData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const messagesChannel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
    };
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm mt-2">
                Start a conversation with a seller to see your messages here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const isBuyer = conversation.buyer_id === user?.id;
              const lastMessagePreview = conversation.last_message
                ? conversation.last_message.body.length > 50
                  ? `${conversation.last_message.body.substring(0, 50)}...`
                  : conversation.last_message.body
                : 'No messages yet';
              
              const handleConversationClick = () => {
                // Mark as visited so unread doesn't come back
                setVisitedConversations(prev => new Set(prev).add(conversation.id));
                
                // Clear unread count immediately in UI
                setConversations(prev => prev.map(c => 
                  c.id === conversation.id ? { ...c, unread_count: 0 } : c
                ));
                
                // Mark as read in background
                if (conversation.unread_count > 0) {
                  supabase
                    .from('messages')
                    .update({ read_at: new Date().toISOString() })
                    .eq('conversation_id', conversation.id)
                    .neq('sender_id', user?.id)
                    .is('read_at', null)
                    .then(() => {});
                }
                
                navigate(`/chat/${conversation.id}`);
              };

              return (
                <Card
                  key={conversation.id}
                  onClick={handleConversationClick}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {conversation.other_user?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm truncate">
                              {conversation.other_user?.name || 'Unknown User'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {isBuyer ? 'Seller' : 'Buyer'}
                              {conversation.products?.title && ` • ${conversation.products.title}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(conversation.last_message_at)}
                            </span>
                             {conversation.unread_count > 0 && (
                               <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1.5 bg-destructive text-destructive-foreground">
                                 {conversation.unread_count}
                               </Badge>
                             )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message?.sender_id === user?.id && 'You: '}
                          {lastMessagePreview}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MessagesPage;
