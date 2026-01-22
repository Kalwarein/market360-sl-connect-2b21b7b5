import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Key, 
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RecoveryCodeImage } from '@/components/RecoveryCodeImage';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  
  const [recoveryInfo, setRecoveryInfo] = useState<{
    recoverySetupCompleted: boolean;
    pinEnabled: boolean;
    remainingRegenerations: number;
    recoveryCodeGeneratedAt?: string;
  } | null>(null);

  useEffect(() => {
    loadSecurityInfo();
  }, [user]);

  const loadSecurityInfo = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'get_user_recovery_info' }
      });

      if (error) throw error;
      setRecoveryInfo(data);
    } catch (error) {
      console.error('Error loading security info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: 'Success', description: 'Your password has been changed' });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    }
  };

  const handleSetPin = async () => {
    if (newPin !== confirmPin) {
      toast({ title: 'Error', description: 'PINs do not match', variant: 'destructive' });
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      toast({ title: 'Error', description: 'PIN must be 4-6 digits', variant: 'destructive' });
      return;
    }

    try {
      setIsSavingPin(true);
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { 
          action: 'set_pin',
          pin: newPin
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Reset PIN has been set' });
      setPinDialogOpen(false);
      setNewPin('');
      setConfirmPin('');
      await loadSecurityInfo();
    } catch (error) {
      console.error('Error setting PIN:', error);
      toast({ title: 'Error', description: 'Failed to set PIN', variant: 'destructive' });
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleTogglePin = async (enabled: boolean) => {
    if (enabled) {
      setPinDialogOpen(true);
    } else {
      try {
        const { data, error } = await supabase.functions.invoke('password-recovery', {
          body: { action: 'disable_pin' }
        });

        if (error) throw error;
        
        toast({ title: 'Success', description: 'Reset PIN has been disabled' });
        await loadSecurityInfo();
      } catch (error) {
        console.error('Error disabling PIN:', error);
        toast({ title: 'Error', description: 'Failed to disable PIN', variant: 'destructive' });
      }
    }
  };

  const handleGenerateRecoveryCodes = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'generate_recovery_codes' }
      });

      if (error) throw error;
      
      if (data.error) {
        toast({ title: 'Error', description: data.message || data.error, variant: 'destructive' });
        return;
      }

      if (data.codes) {
        setCodes(data.codes);
        setRecoveryDialogOpen(true);
        await loadSecurityInfo();
      }
    } catch (error) {
      console.error('Error generating recovery codes:', error);
      toast({ title: 'Error', description: 'Failed to generate recovery codes', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-muted/50 mb-4"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-600" />
          Security Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your password and recovery options
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Password */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Change your password to keep your account secure
            </p>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setPasswordDialogOpen(true)}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Reset PIN */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Reset PIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a 4-6 digit PIN for faster password recovery
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Enable Reset PIN</span>
                {recoveryInfo?.pinEnabled && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
              <Switch
                checked={recoveryInfo?.pinEnabled || false}
                onCheckedChange={handleTogglePin}
              />
            </div>
            {!recoveryInfo?.pinEnabled && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Without a PIN, you'll need your recovery codes to reset your password.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recovery Codes */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Recovery Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download your recovery codes to reset your password if you forget it.
            </p>
            
            {recoveryInfo?.recoverySetupCompleted ? (
              <>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Recovery codes are set up</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Last generated: {recoveryInfo.recoveryCodeGeneratedAt 
                      ? new Date(recoveryInfo.recoveryCodeGeneratedAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                  <p>
                    Regenerations remaining this month: {recoveryInfo.remainingRegenerations}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    You haven't set up recovery codes yet. This is required for password recovery.
                  </p>
                </div>
              </div>
            )}

            <Button
              variant={recoveryInfo?.recoverySetupCompleted ? "outline" : "default"}
              className="w-full rounded-xl"
              onClick={handleGenerateRecoveryCodes}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : recoveryInfo?.recoverySetupCompleted ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Codes
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Recovery Codes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Two-Factor (Coming Soon) */}
        <Card className="rounded-2xl border-border/50 opacity-60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Two-Factor Authentication
              <span className="text-xs bg-muted px-2 py-1 rounded-full ml-2">Coming Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add an extra layer of security to your account
            </p>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              disabled
            >
              Enable 2FA
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. It must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} className="flex-1 rounded-xl">
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reset PIN</DialogTitle>
            <DialogDescription>
              Enter a 4-6 digit PIN that you'll use for password recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-pin">PIN</Label>
              <Input
                id="new-pin"
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) setNewPin(value);
                }}
                maxLength={6}
                className="mt-2 rounded-xl text-center text-2xl tracking-widest"
              />
            </div>
            <div>
              <Label htmlFor="confirm-pin">Confirm PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) setConfirmPin(value);
                }}
                maxLength={6}
                className="mt-2 rounded-xl text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPinDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSetPin} 
              className="flex-1 rounded-xl"
              disabled={isSavingPin}
            >
              {isSavingPin ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Set PIN'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Recovery Codes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Keep this recovery code safe. You may need it to reset your password.
                </p>
              </div>
            </div>
            
            <RecoveryCodeImage 
              codes={codes}
              onDownload={() => toast({ title: 'Downloaded', description: 'Recovery codes saved' })}
              userName={user?.email}
            />
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default SecuritySettings;
