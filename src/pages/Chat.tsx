import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Package, Info, AtSign, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProductSelectorModal from '@/components/ProductSelectorModal';

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
  other_user?: {
    name: string;
    avatar_url: string | null;
  };
}

const Chat = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [attachedProduct, setAttachedProduct] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (conversationId && user) {
      loadConversation();
      loadMessages();
      subscribeToMessages();
      markMessagesAsRead();
      loadCurrentUserAvatar();
      
      // Check if there's an enquiry product from navigation state
      const enquiryProduct = (location.state as any)?.enquiryProduct;
      if (enquiryProduct) {
        setAttachedProduct(enquiryProduct);
      }
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUserAvatar = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .maybeSingle();
      
      setCurrentUserAvatar(data?.avatar_url || null);
    } catch (error) {
      console.error('Error loading current user avatar:', error);
    }
  };

  const loadConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;

      // Get other user's profile
      const isBuyer = data.buyer_id === user?.id;
      const otherUserId = isBuyer ? data.seller_id : data.buyer_id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();

      // Get product if exists
      let product = null;
      if (data.product_id) {
        const { data: productData } = await supabase
          .from('products')
          .select('title, images, price')
          .eq('id', data.product_id)
          .maybeSingle();
        product = productData;
      }

      setConversation({
        ...data,
        products: product,
        other_user: profile || { name: 'Unknown', avatar_url: null }
      });
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
          if (payload.new.sender_id !== user?.id) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !attachedProduct) return;

    try {
      // If there's an attached product, send it as a product card
      if (attachedProduct) {
        const { error: productError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          body: JSON.stringify(attachedProduct),
          message_type: 'action',
        });

        if (productError) throw productError;
        
        // Clear attached product after sending
        setAttachedProduct(null);
      }

      // Send text message if there is one
      if (newMessage.trim()) {
        const { error } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          body: newMessage,
          message_type: 'text',
        });

        if (error) throw error;
      }

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

  const handleProductSelect = (product: any) => {
    const productCard = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      category: product.category,
    };
    
    setAttachedProduct(productCard);
    setShowProductSelector(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Detect @ mention at the start or after a space
    if (value.endsWith('@') || value.includes(' @')) {
      setShowProductSelector(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  };

  const isSystemMessage = (message: Message) => {
    return message.body.startsWith('🔔');
  };

  const isProductCard = (message: Message) => {
    return message.message_type === 'action' || message.message_type === 'product_card';
  };

  const parseProductCard = (body: string) => {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  };

  const handleAvatarClick = () => {
    if (conversation?.other_user) {
      const otherUserId = conversation.buyer_id === user?.id 
        ? conversation.seller_id 
        : conversation.buyer_id;
      navigate(`/profile-viewer/${otherUserId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background select-none">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <Avatar 
            className="h-10 w-10 cursor-pointer"
            onClick={handleAvatarClick}
          >
            <AvatarImage src={conversation?.other_user?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {conversation?.other_user?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 
              className="font-semibold text-sm cursor-pointer hover:underline"
              onClick={handleAvatarClick}
            >
              {conversation?.other_user?.name || 'Unknown User'}
            </h3>
            {conversation?.products?.title && (
              <p className="text-xs text-muted-foreground truncate">
                {conversation.products.title}
              </p>
            )}
          </div>

          {conversation?.products && (
            <button
              onClick={() => navigate(`/product/${conversation.product_id}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Info className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Card */}
      {conversation?.products && (
        <div className="p-4 bg-muted/30">
          <Card 
            onClick={() => navigate(`/product/${conversation.product_id}`)}
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-3 flex gap-3">
              <img
                src={conversation.products.images[0]}
                alt={conversation.products.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {conversation.products.title}
                </p>
                <p className="text-primary font-semibold text-sm">
                  Le {conversation.products.price.toLocaleString()}
                </p>
              </div>
              <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const isSystem = isSystemMessage(message);
            const isProdCard = isProductCard(message);

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-muted px-4 py-2 rounded-full max-w-[80%]">
                    <p className="text-xs text-center text-muted-foreground">
                      {message.body}
                    </p>
                  </div>
                </div>
              );
            }

            if (isProdCard) {
              const productData = parseProductCard(message.body);
              if (!productData) return null;

              return (
                <div key={message.id} className="flex justify-center">
                  <Card 
                    className="max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/product/${productData.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <img
                          src={productData.image}
                          alt={productData.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{productData.title}</p>
                          <p className="text-primary font-bold text-sm">
                            Le {productData.price?.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {productData.category}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isOwn && (
                  <Avatar 
                    className="h-8 w-8 flex-shrink-0 cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={conversation?.other_user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {conversation?.other_user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.body}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 px-2">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>

                {isOwn && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={currentUserAvatar || undefined} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {user?.email?.[0]?.toUpperCase() || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t">
        {/* Attached Product Banner */}
        {attachedProduct && (
          <div className="p-3 bg-muted/30 border-b animate-fade-in">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border">
              <img
                src={attachedProduct.image}
                alt={attachedProduct.title}
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachedProduct.title}</p>
                <p className="text-xs text-primary font-semibold">
                  Le {attachedProduct.price.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => setAttachedProduct(null)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full flex-shrink-0 hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex gap-2 items-end">
            <Button
              onClick={() => setShowProductSelector(true)}
              size="icon"
              variant="ghost"
              className="rounded-full h-10 w-10 flex-shrink-0 hover:bg-primary/10"
            >
              <AtSign className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={attachedProduct ? "Add a message..." : "Type a message or @ to share products..."}
              className="flex-1 rounded-full border-2 focus-visible:ring-primary"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() && !attachedProduct}
              size="icon"
              className="rounded-full h-10 w-10 flex-shrink-0 bg-primary hover:bg-primary/90 shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProductSelectorModal
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelectProduct={handleProductSelect}
      />
    </div>
  );
};

export default Chat;
