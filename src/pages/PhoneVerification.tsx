import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
import { NumericInput } from '@/components/NumericInput';

export default function PhoneVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user already has verified phone
    checkPhoneStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkPhoneStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('phone_verified, phone')
      .eq('id', user.id)
      .single();

    if (data?.phone_verified) {
      navigate('/');
    } else if (data?.phone) {
      // If phone exists but not verified, pre-fill it
      const phoneWithoutPrefix = data.phone.replace('+232', '');
      setPhoneNumber(phoneWithoutPrefix);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid Sierra Leone phone number',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Smart phone formatting:
      // If starts with 232, add + prefix
      // If starts with 0, remove it and add +232
      // Otherwise, add +232 prefix
      let formattedPhone = phoneNumber;
      
      if (formattedPhone.startsWith('232')) {
        formattedPhone = `+${formattedPhone}`;
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = `+232${formattedPhone.substring(1)}`;
      } else {
        formattedPhone = `+232${formattedPhone}`;
      }

      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          user_id: user?.id,
          phone_number: formattedPhone,
        },
      });

      if (error) {
        // Try to surface more helpful error message from the edge function
        const serverMessage = (data as any)?.error;
        throw new Error(serverMessage || error.message || 'Failed to send OTP');
      }

      toast({
        title: 'OTP Sent',
        description: 'Check your phone for the verification code',
      });

      setStep('otp');
      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          user_id: user?.id,
          otp_code: otpCode
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: '✅ Phone Verified!',
          description: 'Your phone number has been verified successfully'
        });
        navigate('/');
      } else {
        throw new Error(data?.error || 'Verification failed');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setOtpCode('');
    handleSendOtp();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Phone Number</CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Enter your Sierra Leone phone number to receive a verification code'
              : 'Enter the 6-digit code sent to your phone'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'phone' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2 border border-border rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">+232</span>
                  </div>
                  <NumericInput
                    id="phone"
                    placeholder="76123456"
                    value={phoneNumber}
                    onChange={(value) => setPhoneNumber(value)}
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your number without the leading zero (e.g., 76123456)
                </p>
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={loading || phoneNumber.length < 8}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <NumericInput
                  id="otp"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to +232{phoneNumber}
                </p>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.length !== 6}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Phone Number'
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-sm"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend Code'}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setStep('phone');
                  setOtpCode('');
                }}
                className="w-full"
              >
                Change Phone Number
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
