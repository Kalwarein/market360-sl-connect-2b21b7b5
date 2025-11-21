import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Package, AtSign, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProductSelectorModal from '@/components/ProductSelectorModal';
import { EnquiryCard } from '@/components/EnquiryCard';
import { SellerQuickActions } from '@/components/SellerQuickActions';
import { ProductSpecsCard } from '@/components/ProductSpecsCard';
import { QuotationCard } from '@/components/QuotationCard';
import { MessageActionSheet } from '@/components/MessageActionSheet';

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
    id: string;
    title: string;
    images: string[];
    price: number;
    moq?: number;
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
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [attachedProduct, setAttachedProduct] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isEnquiryConversation, setIsEnquiryConversation] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageActionSheetOpen, setMessageActionSheetOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (conversationId && user) {
      loadConversation();
      loadMessages();
      loadCurrentUserProfile();
      markMessagesAsRead();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId) return;

    const messagesChannel = supabase
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
          setTimeout(() => markMessagesAsRead(), 100);
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: user?.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const otherUsers = Object.keys(state).filter(key => key !== user?.id);
        const someoneTyping = otherUsers.some(userId => {
          const userState = state[userId] as any;
          return userState && userState[0]?.typing === true;
        });
        setOtherUserTyping(someoneTyping);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user?.id)
        .maybeSingle();
      
      setCurrentUserName(data?.name || 'You');
      setCurrentUserAvatar(data?.avatar_url || null);
    } catch (error) {
      console.error('Error loading current user profile:', error);
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

      const isBuyer = data.buyer_id === user?.id;
      const otherUserId = isBuyer ? data.seller_id : data.buyer_id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();

      let product = null;
      if (data.product_id) {
        const { data: productData } = await supabase
          .from('products')
          .select('id, title, images, price, moq')
          .eq('id', data.product_id)
          .maybeSingle();
        product = productData;
      }

      setConversation({
        ...data,
        other_user: profile || { name: 'Unknown User', avatar_url: null },
        products: product
      });

      setIsSeller(data.seller_id === user?.id);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Check if this is an enquiry conversation
      const hasEnquiryMessage = (data || []).some((msg: Message) => {
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
      setIsEnquiryConversation(hasEnquiryMessage);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      const channel = supabase.channel(`presence-${conversationId}`);
      channel.track({ user_id: user?.id, typing: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const channel = supabase.channel(`presence-${conversationId}`);
      channel.track({ user_id: user?.id, typing: false });
    }, 2000);
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

  const handleSend = async () => {
    if (!newMessage.trim() && !attachedProduct) return;

    try {
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: user?.id,
        body: newMessage.trim() || (attachedProduct ? 'Shared a product' : ''),
      };

      if (!attachedProduct) {
        messageData.message_type = 'text';
      }

      if (attachedProduct) {
        messageData.attachments = [JSON.stringify(attachedProduct)];
      }

      const { error } = await supabase.from('messages').insert(messageData);

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Send notification to recipient
      const recipientId = conversation?.buyer_id === user?.id 
        ? conversation?.seller_id 
        : conversation?.buyer_id;
      
      if (recipientId) {
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('name, notification_preferences')
          .eq('id', recipientId)
          .single();

        const notifPrefs = recipientProfile?.notification_preferences as any;
        if (!notifPrefs || notifPrefs?.messages !== false) {
          const senderName = currentUserName || 'Someone';
          const messagePreview = newMessage.trim() || (attachedProduct ? `Shared ${attachedProduct.title}` : 'New message');
          
          await supabase.functions.invoke('create-order-notification', {
            body: {
              user_id: recipientId,
              type: 'message',
              title: `💬 ${senderName}`,
              body: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
              link_url: `/chat/${conversationId}`,
              image_url: attachedProduct?.images?.[0] || currentUserAvatar,
              metadata: { conversation_id: conversationId, sender_id: user?.id }
            }
          });
        }
      }

      setNewMessage('');
      setAttachedProduct(null);
      setIsTyping(false);
      const channel = supabase.channel(`presence-${conversationId}`);
      channel.track({ user_id: user?.id, typing: false });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendProductSpecs = async () => {
    if (!conversation?.products) return;

    try {
      const { data: fullProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', conversation.products.id)
        .single();

      if (!fullProduct) {
        toast.error('Product not found');
        return;
      }

      const specsCard = {
        type: 'product_specs',
        ...fullProduct,
      };

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        body: 'Here are the complete product specifications:',
        message_type: 'action',
        attachments: [JSON.stringify(specsCard)],
      });

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      toast.success('Product specifications sent');
    } catch (error) {
      console.error('Error sending specs:', error);
      toast.error('Failed to send specifications');
    }
  };

  const handleSendQuotation = async (quotationData: any) => {
    try {
      const quotationCard = {
        type: 'quotation',
        ...quotationData,
      };

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        body: 'Here is your price quotation:',
        message_type: 'action',
        attachments: [JSON.stringify(quotationCard)],
      });

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      toast.success('Quotation sent');
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast.error('Failed to send quotation');
    }
  };

  const handleRequestDetails = async () => {
    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        body: 'Could you please provide your delivery details? I need your full address, phone number, and any special delivery instructions.',
        message_type: 'text',
      });

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      toast.success('Request sent');
    } catch (error) {
      console.error('Error requesting details:', error);
      toast.error('Failed to send request');
    }
  };

  const handleConfirmAvailability = async () => {
    try {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        body: '✅ Great news! This product is currently in stock and available for immediate delivery.',
        message_type: 'text',
      });

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      toast.success('Availability confirmed');
    } catch (error) {
      console.error('Error confirming availability:', error);
      toast.error('Failed to confirm availability');
    }
  };

  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message);
    setMessageActionSheetOpen(true);
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.body) {
      navigator.clipboard.writeText(selectedMessage.body);
      toast.success('Message copied');
    }
  };

  const handleDeleteMessage = async (forEveryone: boolean) => {
    if (!selectedMessage) return;

    try {
      if (forEveryone) {
        // Delete for everyone - only sender can do this
        if (selectedMessage.sender_id !== user?.id) {
          toast.error('You can only delete your own messages for everyone');
          return;
        }
        await supabase
          .from('messages')
          .delete()
          .eq('id', selectedMessage.id);
        
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
        toast.success('Message deleted for everyone');
      } else {
        // Delete for me - just hide locally
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
        toast.success('Message deleted for you');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleForwardMessage = () => {
    if (selectedMessage) {
      toast.info('Forward feature coming soon');
    }
  };

  const handleReplyToMessage = () => {
    if (selectedMessage) {
      setReplyToMessage(selectedMessage);
    }
  };


  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === user?.id;
    const senderName = isOwn ? currentUserName : conversation?.other_user?.name || 'Unknown';
    const senderAvatar = isOwn ? currentUserAvatar : conversation?.other_user?.avatar_url;

    if (message.attachments?.[0]) {
      try {
        const attachment = JSON.parse(message.attachments[0]);

        // Enquiry Card
        if (attachment.type === 'enquiry') {
          return (
            <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} mb-4 animate-fade-in`}>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={senderAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {senderName?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <span className="text-xs text-muted-foreground mb-1 font-medium">{senderName}</span>
                <EnquiryCard
                  productName={attachment.product_name}
                  productImage={attachment.product_image}
                  productPrice={attachment.product_price}
                  storeName={attachment.store_name}
                  productId={attachment.product_id}
                  moq={attachment.moq}
                />
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          );
        }

        // Product Specs Card
        if (attachment.type === 'product_specs') {
          return (
            <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} mb-4 animate-fade-in`}>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={senderAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {senderName?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <span className="text-xs text-muted-foreground mb-1 font-medium">{senderName}</span>
                <ProductSpecsCard product={attachment} />
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          );
        }

        // Quotation Card
        if (attachment.type === 'quotation') {
          return (
            <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} mb-4 animate-fade-in`}>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={senderAvatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {senderName?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <span className="text-xs text-muted-foreground mb-1 font-medium">{senderName}</span>
                <QuotationCard
                  price={attachment.price}
                  deliveryDate={attachment.deliveryDate}
                  shippingCost={attachment.shippingCost}
                  note={attachment.note}
                />
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          );
        }

        // Regular Product Card
        const product = attachment;
        return (
          <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} mb-3 animate-fade-in`}>
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={senderAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {senderName?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <span className="text-xs text-muted-foreground mb-1 font-medium">{senderName}</span>
              <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-primary/10" onClick={() => navigate(`/product/${product.id}`)}>
                <CardContent className="p-2">
                  <div className="flex gap-2">
                    <img
                      src={product.images?.[0] || product.image}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs line-clamp-2">{product.title}</h4>
                      <p className="text-primary font-bold text-sm mt-0.5">Le {product.price?.toLocaleString()}</p>
                      {product.moq && (
                        <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
                      )}
                      <Button 
                        size="sm" 
                        className="mt-1.5 w-full h-7 text-xs rounded-full" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <span className="text-xs text-muted-foreground mt-1">
                {format(new Date(message.created_at), 'HH:mm')}
              </span>
            </div>
          </div>
        );
      } catch (e) {
        console.error('Error parsing attachment:', e);
      }
    }

    if (message.message_type === 'system') {
      return (
        <div className="flex justify-center my-4" key={message.id}>
          <div className="bg-muted px-4 py-2 rounded-full text-xs text-muted-foreground shadow-sm">
            {message.body}
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} mb-4 animate-fade-in`} 
        key={message.id}
        onContextMenu={(e) => {
          e.preventDefault();
          handleMessageLongPress(message);
        }}
        onTouchStart={(e) => {
          const timeout = setTimeout(() => {
            handleMessageLongPress(message);
          }, 500);
          (e.currentTarget as any).dataset.timeout = timeout.toString();
        }}
        onTouchEnd={(e) => {
          const timeout = (e.currentTarget as any).dataset.timeout;
          if (timeout) clearTimeout(Number(timeout));
        }}
      >
        <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer" onClick={() => {
          const otherUserId = conversation?.buyer_id === user?.id ? conversation?.seller_id : conversation?.buyer_id;
          if (!isOwn && otherUserId) navigate(`/profile-viewer/${otherUserId}`);
        }}>
          <AvatarImage src={senderAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {senderName?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
          <span className="text-xs text-muted-foreground mb-1 font-medium select-none">{senderName}</span>
          {replyToMessage?.id === message.id && (
            <div className="mb-1 px-3 py-1 bg-muted/50 rounded-lg text-xs text-muted-foreground select-none">
              <p className="font-medium">Replying to {replyToMessage.sender_id === user?.id ? 'yourself' : senderName}</p>
              <p className="truncate">{replyToMessage.body}</p>
            </div>
          )}
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm transition-all select-none ${
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words select-none">{message.body}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar 
            className="h-12 w-12 border-2 border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
            onClick={() => {
              const otherUserId = conversation?.buyer_id === user?.id ? conversation.seller_id : conversation.buyer_id;
              if (otherUserId) navigate(`/profile-viewer/${otherUserId}`);
            }}
          >
            <AvatarImage src={conversation?.other_user?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {conversation?.other_user?.name?.charAt(0)?.toUpperCase() || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{conversation?.other_user?.name || 'Unknown User'}</h3>
            {otherUserTyping && (
              <p className="text-sm text-muted-foreground animate-pulse">typing...</p>
            )}
          </div>
        </div>
      </div>

      {/* Product Context */}
      {conversation?.products && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b p-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Package className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-1">{conversation.products.title}</p>
              <p className="text-xs text-muted-foreground">Le {conversation.products.price?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
        <div className="max-w-2xl mx-auto">
          {messages.map((message) => renderMessage(message))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Product Attachment Preview */}
      {attachedProduct && (
        <div className="border-t bg-card p-3 shadow-lg">
          <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-primary/10 p-3 rounded-xl max-w-2xl mx-auto shadow-sm">
            <img
              src={attachedProduct.images?.[0]}
              alt={attachedProduct.title}
              className="w-14 h-14 object-cover rounded-lg shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{attachedProduct.title}</p>
              <p className="text-xs text-primary font-bold">Le {attachedProduct.price?.toLocaleString()}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAttachedProduct(null)}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {isSeller && isEnquiryConversation && (
        <SellerQuickActions
          onSendSpecs={handleSendProductSpecs}
          onSendQuotation={handleSendQuotation}
          onRequestDetails={handleRequestDetails}
          onConfirmAvailability={handleConfirmAvailability}
        />
      )}

      {/* Input */}
      <div className="border-t bg-card p-4 shadow-lg">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowProductSelector(true)}
            className="rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
          >
            <AtSign className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-2 focus:border-primary transition-all"
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="rounded-full hover:scale-105 transition-transform"
            disabled={!newMessage.trim() && !attachedProduct}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ProductSelectorModal
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelectProduct={(product) => {
          setAttachedProduct(product);
          setShowProductSelector(false);
        }}
      />

      {selectedMessage && (
        <MessageActionSheet
          open={messageActionSheetOpen}
          onOpenChange={setMessageActionSheetOpen}
          message={selectedMessage}
          isOwnMessage={selectedMessage.sender_id === user?.id}
          onCopy={handleCopyMessage}
          onDelete={handleDeleteMessage}
          onForward={handleForwardMessage}
          onReply={handleReplyToMessage}
        />
      )}
    </div>
  );
};

export default Chat;
