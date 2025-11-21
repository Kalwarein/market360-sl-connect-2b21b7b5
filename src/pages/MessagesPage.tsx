import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowLeft, Pin, MoreVertical } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ConversationActionSheet } from '@/components/ConversationActionSheet';
import { toast } from 'sonner';

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    conversations, 
    loading, 
    updateConversation,
    pinConversation,
    muteConversation,
    archiveConversation,
    deleteConversation
  } = useChat();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

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
      <div className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {conversations.length === 0 && !loading ? (
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
            {conversations
              .filter(c => !c.is_archived)
              .map((conversation) => {
                const isBuyer = conversation.buyer_id === user?.id;
                const lastMessagePreview = conversation.last_message
                  ? conversation.last_message.body.length > 50
                    ? `${conversation.last_message.body.substring(0, 50)}...`
                    : conversation.last_message.body
                  : 'No messages yet';

                const handleConversationClick = () => {
                  updateConversation(conversation.id, { unread_count: 0 });

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

                const handleLongPress = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedConversation(conversation.id);
                  setActionSheetOpen(true);
                };

                return (
                  <Card
                    key={conversation.id}
                    onClick={handleConversationClick}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] animate-fade-in relative"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {conversation.is_pinned && (
                          <div className="absolute top-2 right-2">
                            <Pin className="h-4 w-4 text-primary fill-primary" />
                          </div>
                        )}
                        
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                            {conversation.other_user?.name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base truncate">
                                  {conversation.other_user?.name || 'Unknown User'}
                                </h3>
                                {conversation.is_enquiry && (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0.5">
                                    Enquiry
                                  </Badge>
                                )}
                                {conversation.is_muted && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    Muted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {isBuyer ? 'Seller' : 'Buyer'}
                                {conversation.products?.title && ` • ${conversation.products.title}`}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                                  {formatTime(conversation.last_message_at)}
                                </span>
                                {conversation.unread_count > 0 && !conversation.is_muted && (
                                  <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1.5 bg-primary text-primary-foreground">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleLongPress}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message?.sender_id === user?.id && <span className="font-semibold">You: </span>}
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

      {selectedConversation && (
        <ConversationActionSheet
          open={actionSheetOpen}
          onOpenChange={setActionSheetOpen}
          conversation={conversations.find(c => c.id === selectedConversation)!}
          onPin={() => pinConversation(selectedConversation)}
          onMute={() => {
            muteConversation(selectedConversation);
            toast.success('Conversation muted');
          }}
          onArchive={() => {
            archiveConversation(selectedConversation);
            toast.success('Conversation archived');
          }}
          onDelete={async () => {
            await deleteConversation(selectedConversation);
            toast.success('Conversation deleted');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default MessagesPage;
