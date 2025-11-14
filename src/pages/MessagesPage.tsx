import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, ArrowRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  products?: {
    title: string;
    images: string[];
  };
  profiles?: {
    name: string;
  };
}

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select(`
          *,
          products(title, images)
        `)
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile names separately for each conversation
      const conversationsWithProfiles = await Promise.all(
        (data || []).map(async (conv) => {
          const isBuyer = conv.buyer_id === user?.id;
          const otherUserId = isBuyer ? conv.seller_id : conv.buyer_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', otherUserId)
            .single();
          
          return {
            ...conv,
            profiles: profile || { name: 'Unknown' }
          };
        })
      );
      
      setConversations(conversationsWithProfiles);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('conversations-list')
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
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm opacity-90">Your conversations</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-20" />
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
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const isBuyer = conversation.buyer_id === user?.id;
              const otherParty = isBuyer ? 'Seller' : conversation.profiles?.name || 'Buyer';
              
              return (
                <Card
                  key={conversation.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {otherParty[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium">{otherParty}</h3>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        {conversation.products && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {conversation.products.title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conversation.last_message_at), 'MMM dd, HH:mm')}
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