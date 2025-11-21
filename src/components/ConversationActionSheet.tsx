import { Pin, BellOff, Archive, Trash2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface ConversationActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: {
    id: string;
    is_pinned?: boolean;
    is_muted?: boolean;
    is_archived?: boolean;
    other_user?: {
      name: string;
    };
  };
  onPin: () => void;
  onMute: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export const ConversationActionSheet = ({
  open,
  onOpenChange,
  conversation,
  onPin,
  onMute,
  onArchive,
  onDelete,
}: ConversationActionSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Chat with {conversation.other_user?.name || 'Unknown'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onPin();
              onOpenChange(false);
            }}
          >
            <Pin className="h-5 w-5" />
            <span>{conversation.is_pinned ? 'Unpin' : 'Pin'} Conversation</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onMute();
              onOpenChange(false);
            }}
          >
            <BellOff className="h-5 w-5" />
            <span>{conversation.is_muted ? 'Unmute' : 'Mute'} Notifications</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onArchive();
              onOpenChange(false);
            }}
          >
            <Archive className="h-5 w-5" />
            <span>{conversation.is_archived ? 'Unarchive' : 'Archive'} Chat</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-5 w-5" />
            <span>Delete Chat</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
