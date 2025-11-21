import { Copy, Trash2, Forward, Reply } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MessageActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: string;
    body: string;
    sender_id: string;
  };
  isOwnMessage: boolean;
  onCopy: () => void;
  onDelete: (forEveryone: boolean) => void;
  onForward: () => void;
  onReply: () => void;
}

export const MessageActionSheet = ({
  open,
  onOpenChange,
  message,
  isOwnMessage,
  onCopy,
  onDelete,
  onForward,
  onReply,
}: MessageActionSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Message Actions</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onReply();
              onOpenChange(false);
            }}
          >
            <Reply className="h-5 w-5" />
            <span>Reply</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onCopy();
              onOpenChange(false);
            }}
          >
            <Copy className="h-5 w-5" />
            <span>Copy Text</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              onForward();
              onOpenChange(false);
            }}
          >
            <Forward className="h-5 w-5" />
            <span>Forward</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
            onClick={() => {
              onDelete(false);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-5 w-5" />
            <span>Delete for Me</span>
          </Button>

          {isOwnMessage && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(true);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete for Everyone</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
