import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Ban } from 'lucide-react';

interface BanUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export const BanUserModal = ({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: BanUserModalProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for ban');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('user_moderation').insert({
        user_id: userId,
        type: 'ban',
        reason: reason.trim(),
        admin_id: user!.id,
        expires_at: null,
        is_active: true,
      });

      if (error) throw error;

      // Create audit log
      await supabase.from('audit_logs').insert({
        action: 'user_banned',
        actor_id: user!.id,
        target_id: userId,
        target_type: 'user',
        description: `Permanently banned user ${userName}`,
        metadata: { reason },
      });

      toast.success('User banned successfully');
      setReason('');
      onSuccess();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Ban User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive">
            <p className="text-sm text-destructive font-medium">
              ⚠️ This is a permanent action
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You are about to permanently ban <strong>{userName}</strong> from accessing the platform.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reason for Ban</Label>
            <Textarea
              placeholder="Enter detailed reason for permanent ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBan}
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Banning...' : 'Confirm Ban'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
