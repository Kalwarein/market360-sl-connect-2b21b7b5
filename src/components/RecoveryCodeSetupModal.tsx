import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Shield, Key, Loader2, Check, AlertTriangle } from 'lucide-react';
import { RecoveryCodeImage } from './RecoveryCodeImage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecoveryCodeSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userEmail?: string;
}

type Step = 'intro' | 'generating' | 'display' | 'force-download' | 'pin-setup' | 'complete';

export const RecoveryCodeSetupModal = ({ 
  isOpen, 
  onComplete,
  userEmail 
}: RecoveryCodeSetupModalProps) => {
  const [step, setStep] = useState<Step>('intro');
  const [codes, setCodes] = useState<string[]>([]);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecoveryCodes = async () => {
    setStep('generating');
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'generate_recovery_codes' }
      });

      if (error) throw error;
      
      if (data.codes) {
        setCodes(data.codes);
        setStep('display');
      } else {
        throw new Error(data.error || 'Failed to generate codes');
      }
    } catch (error: any) {
      console.error('Error generating recovery codes:', error);
      toast.error(error.message || 'Failed to generate recovery codes');
      setStep('intro');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    setHasDownloaded(true);
    setStep('force-download');
  };

  const handleContinue = () => {
    if (!hasDownloaded) {
      toast.error('Please download your recovery codes first');
      return;
    }
    setStep('complete');
    toast.success('Recovery codes saved successfully!');
    onComplete();
  };

  const handleSetPin = async () => {
    if (pin.length < 4 || pin.length > 6) {
      toast.error('PIN must be 4-6 digits');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      toast.error('PIN must contain only numbers');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setIsSettingPin(true);

    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'set_pin', pin }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success('Reset PIN set successfully!');
        setShowPinSetup(false);
        setStep('complete');
        onComplete();
      } else {
        throw new Error(data.error || 'Failed to set PIN');
      }
    } catch (error: any) {
      console.error('Error setting PIN:', error);
      toast.error(error.message || 'Failed to set PIN');
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleSkipPin = () => {
    setStep('complete');
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Secure Your Account</DialogTitle>
        
        {step === 'intro' && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Secure Your Account</h2>
              <p className="text-sm text-muted-foreground mt-2">
                To help you reset your password, we will generate a Recovery Code image. 
                This is not your PIN. Your PIN is optional.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Please save your Recovery Code safely. You will need it to reset your password if you forget it.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={generateRecoveryCodes}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-medium"
              >
                <Shield className="h-5 w-5 mr-2" />
                Generate Recovery Code
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowPinSetup(true)}
                className="w-full py-6 rounded-xl border-border"
              >
                <Key className="h-5 w-5 mr-2" />
                Set Password Reset PIN (Optional)
              </Button>

              <Button 
                variant="ghost"
                onClick={handleSkipPin}
                className="w-full text-muted-foreground"
              >
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Generating your recovery codes...</p>
          </div>
        )}

        {step === 'display' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">Your Recovery Codes</h2>
              <p className="text-sm text-muted-foreground mt-1">
                These codes are embedded in the image below
              </p>
            </div>

            <RecoveryCodeImage 
              codes={codes} 
              onDownload={handleDownload}
              userName={userEmail}
            />

            {!hasDownloaded && (
              <p className="text-xs text-center text-muted-foreground">
                You must download the recovery codes to continue
              </p>
            )}
          </div>
        )}

        {step === 'force-download' && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Download Complete!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your recovery codes have been downloaded. Keep them safe!
              </p>
            </div>

            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground text-center">
                Would you like to set up a Reset PIN for additional security? This is optional but recommended.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowPinSetup(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl"
              >
                <Key className="h-5 w-5 mr-2" />
                Set Reset PIN
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleContinue}
                className="w-full py-6 rounded-xl border-border"
              >
                Continue Without PIN
              </Button>
            </div>
          </div>
        )}

        {showPinSetup && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Set Reset PIN</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Create a 4-6 digit PIN for password recovery
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Enter PIN</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-6 digit PIN"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Confirm PIN</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm your PIN"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleSetPin}
                disabled={isSettingPin || pin.length < 4}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl"
              >
                {isSettingPin ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Setting PIN...
                  </>
                ) : (
                  'Set PIN'
                )}
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowPinSetup(false);
                  if (hasDownloaded) {
                    setStep('force-download');
                  }
                }}
                className="w-full text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
