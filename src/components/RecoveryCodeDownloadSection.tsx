import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from './ui/dialog';
import { Shield, Download, RefreshCw, Loader2, Key, AlertCircle } from 'lucide-react';
import { RecoveryCodeImage } from './RecoveryCodeImage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const RecoveryCodeDownloadSection = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryInfo, setRecoveryInfo] = useState<{
    recoverySetupCompleted: boolean;
    pinEnabled: boolean;
    remainingRegenerations: number;
    recoveryCodeGeneratedAt?: string;
  } | null>(null);

  useEffect(() => {
    loadRecoveryInfo();
  }, [user]);

  const loadRecoveryInfo = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'get_user_recovery_info' }
      });

      if (error) throw error;
      setRecoveryInfo(data);
    } catch (error) {
      console.error('Error loading recovery info:', error);
    }
  };

  const handleGenerateNew = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'generate_recovery_codes' }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.message || data.error);
        return;
      }

      if (data.codes) {
        setCodes(data.codes);
        setIsOpen(true);
        await loadRecoveryInfo();
      }
    } catch (error: any) {
      console.error('Error generating recovery codes:', error);
      toast.error('Failed to generate recovery codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    toast.success('Recovery codes downloaded!');
  };

  if (!recoveryInfo) {
    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Recovery Code</p>
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Recovery Code</p>
                <p className="text-xs text-muted-foreground">
                  {recoveryInfo.recoverySetupCompleted 
                    ? 'Download or regenerate your codes' 
                    : 'Set up recovery codes'}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateNew}
              disabled={isLoading}
              className="rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : recoveryInfo.recoverySetupCompleted ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>

          {recoveryInfo.recoverySetupCompleted && (
            <div className="text-xs text-muted-foreground">
              <p>
                Generated: {recoveryInfo.recoveryCodeGeneratedAt 
                  ? new Date(recoveryInfo.recoveryCodeGeneratedAt).toLocaleDateString()
                  : 'Unknown'}
              </p>
              <p className="mt-1">
                Regenerations remaining this month: {recoveryInfo.remainingRegenerations}
              </p>
            </div>
          )}

          {/* PIN Status */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Reset PIN</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              recoveryInfo.pinEnabled 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-yellow-500/10 text-yellow-600'
            }`}>
              {recoveryInfo.pinEnabled ? 'Enabled' : 'Not Set'}
            </span>
          </div>

          {!recoveryInfo.recoverySetupCompleted && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  You haven't set up recovery codes yet. This makes password recovery harder.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Recovery Codes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Keep this recovery code safe. You may need it to reset your password.
            </p>
            
            <RecoveryCodeImage 
              codes={codes}
              onDownload={handleDownload}
              userName={user?.email}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
