import { Copy, Trash2, Forward, Reply } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);

  const handleDeleteClick = (forEveryone: boolean) => {
    setDeleteForEveryone(forEveryone);
    setShowDeleteConfirm(true);
    onOpenChange(false);
  };

  const confirmDelete = () => {
    onDelete(deleteForEveryone);
    setShowDeleteConfirm(false);
  };

  return (
    <>
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
              onClick={() => handleDeleteClick(false)}
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete for Me</span>
            </Button>

            {isOwnMessage && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                onClick={() => handleDeleteClick(true)}
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete for Everyone</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteForEveryone
                ? 'This message will be deleted for everyone in this conversation.'
                : 'This message will be deleted for you only.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
