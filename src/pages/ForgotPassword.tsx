import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Shield, Key, Loader2, CheckCircle, Lock } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type Step = 'email' | 'method' | 'recovery-code' | 'pin' | 'new-password' | 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse({ email });
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'get_recovery_status', email }
      });

      if (error) throw error;
      
      setPinEnabled(data.pinEnabled || false);
      setStep('method');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error('Failed to check account status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedCode = recoveryCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    if (!cleanedCode || cleanedCode.length < 8) {
      toast.error('Please enter a valid recovery code');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'validate_recovery_code', email, code: cleanedCode }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.success) {
        setUserId(data.userId);
        setResetToken(data.resetToken);
        setStep('new-password');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid recovery code');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.length < 4) {
      toast.error('Please enter a valid PIN');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { action: 'validate_pin', email, pin }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.message || data.error);
        return;
      }

      if (data.success) {
        setUserId(data.userId);
        setResetToken(data.resetToken);
        setStep('new-password');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('password-recovery', {
        body: { 
          action: 'reset_password', 
          email, 
          newPassword,
          userId,
          resetToken
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.success) {
        setStep('success');
        toast.success('Password reset successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-[2rem] shadow-2xl p-8 backdrop-blur-sm border border-border/50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Password Reset!
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (step === 'email') {
              navigate('/auth');
            } else if (step === 'method') {
              setStep('email');
            } else if (step === 'recovery-code' || step === 'pin') {
              setStep('method');
            } else if (step === 'new-password') {
              setStep('method');
            }
          }}
          className="mb-4 text-foreground/70 hover:text-foreground hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 'email' ? 'Back to Sign In' : 'Back'}
        </Button>

        <div className="bg-card rounded-[2rem] shadow-2xl p-8 backdrop-blur-sm border border-border/50">
          {/* Email Step */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Forgot Password?
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter your email to reset your password
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Method Selection Step */}
          {step === 'method' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Choose Reset Method
                </h1>
                <p className="text-muted-foreground text-sm">
                  Select how you want to verify your identity
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setStep('recovery-code')}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-border justify-start px-4"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Recovery Code</p>
                    <p className="text-xs text-muted-foreground">Use your saved recovery codes</p>
                  </div>
                </Button>

                <Button
                  onClick={() => setStep('pin')}
                  variant="outline"
                  disabled={!pinEnabled}
                  className="w-full h-14 rounded-2xl border-border justify-start px-4 disabled:opacity-50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    pinEnabled ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Key className={`h-5 w-5 ${pinEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${pinEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Reset PIN
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pinEnabled ? 'Use your security PIN' : 'Not set up for this account'}
                    </p>
                  </div>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Don't have your recovery codes? Contact support for help.
              </p>
            </>
          )}

          {/* Recovery Code Step */}
          {step === 'recovery-code' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Enter Recovery Code
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter one of your recovery codes
                </p>
              </div>

              <form onSubmit={handleRecoveryCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="recovery-code" className="text-sm font-medium text-foreground/80">
                    Recovery Code
                  </Label>
                  <Input
                    id="recovery-code"
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    className="h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all text-center text-lg font-mono tracking-widest"
                    maxLength={9}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* PIN Step */}
          {step === 'pin' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Enter Reset PIN
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter your 4-6 digit security PIN
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-sm font-medium text-foreground/80">
                    PIN
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify PIN'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* New Password Step */}
          {step === 'new-password' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Set New Password
                </h1>
                <p className="text-muted-foreground text-sm">
                  Create a new secure password
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-foreground/80">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground/80">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-primary hover:text-primary/90 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
