import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Image as ImageIcon, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
  attachments?: string[];
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id?: string;
  products?: {
    title: string;
    images: string[];
    price: number;
  };
}

const Chat = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (conversationId && user) {
      loadConversation();
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, products(title, images, price)')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        body: newMessage,
        message_type: 'text',
      });

      if (error) throw error;

      // Update last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const isSeller = user?.id === conversation?.seller_id;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/messages')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold">
              {isSeller ? 'Buyer' : 'Seller'}
            </h2>
            {conversation?.products && (
              <p className="text-xs opacity-90">{conversation.products.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Product Info */}
      {conversation?.products && (
        <div className="border-b bg-card">
          <Card className="m-2">
            <CardContent className="p-3 flex gap-3 items-center">
              <img
                src={conversation.products.images[0]}
                alt={conversation.products.title}
                className="h-12 w-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">
                  {conversation.products.title}
                </p>
                <p className="text-sm text-primary font-bold">
                  Le {conversation.products.price.toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline">
                <Package className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.body}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="border-t bg-card p-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {isSeller ? (
            <>
              <Button size="sm" variant="outline" className="whitespace-nowrap">
                Mark as Shipped
              </Button>
              <Button size="sm" variant="outline" className="whitespace-nowrap">
                Send Invoice
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" className="whitespace-nowrap">
                Confirm Receipt
              </Button>
              <Button size="sm" variant="outline" className="whitespace-nowrap">
                Request Refund
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4 safe-area-bottom">
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;