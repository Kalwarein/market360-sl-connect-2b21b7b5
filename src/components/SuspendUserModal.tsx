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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

interface SuspendUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export const SuspendUserModal = ({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: SuspendUserModalProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7');
  const [loading, setLoading] = useState(false);

  const handleSuspend = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

      const { error } = await supabase.from('user_moderation').insert({
        user_id: userId,
        type: 'suspension',
        reason: reason.trim(),
        admin_id: user!.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      if (error) throw error;

      // Create audit log
      await supabase.from('audit_logs').insert({
        action: 'user_suspended',
        actor_id: user!.id,
        target_id: userId,
        target_type: 'user',
        description: `Suspended user ${userName} for ${duration} days`,
        metadata: { reason, duration },
      });

      toast.success('User suspended successfully');
      setReason('');
      setDuration('7');
      onSuccess();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Suspend User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              You are about to suspend <strong>{userName}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Suspension Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason for Suspension</Label>
            <Textarea
              placeholder="Enter detailed reason for suspension..."
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
              onClick={handleSuspend}
              className="flex-1 bg-warning hover:bg-warning/90"
              disabled={loading}
            >
              {loading ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
