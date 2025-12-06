import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, ArrowLeft, CheckCircle, Smartphone, Copy, Clock, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PAYMENT_NUMBER = '078444807';

const Deposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    toast.success('Number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    if (!screenshot) {
      toast.error('Payment evidence is required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);

      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `deposit-${user?.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Create deposit with 'processing' status
      const { error } = await supabase.from('wallet_requests').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: amountNum,
        phone_number: PAYMENT_NUMBER,
        screenshot_url: publicUrl,
        status: 'processing',
      });

      if (error) throw error;

      toast.success('Deposit recorded! Funds will reflect shortly.');
      navigate('/deposit-history');
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wallet')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Deposit Funds</h1>
            <p className="text-sm text-muted-foreground">Add money to your wallet</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Send Money */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h3 className="font-bold text-lg">Send Money via Orange Money</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>Dial *144# → Send Money → Enter this number:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-card border-2 border-primary/50 rounded-xl px-4 py-3">
                    <p className="text-2xl font-mono font-bold text-primary text-center">
                      {PAYMENT_NUMBER}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyNumber}
                    className="h-14 w-14 rounded-xl border-2"
                  >
                    {copied ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  No fees - Full amount will be credited to your wallet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Enter Amount */}
          <Card className="border-2 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <h3 className="font-bold text-lg">Enter Amount Sent</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (SLL) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount you sent"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 text-xl font-bold rounded-xl border-2"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Upload Evidence */}
          <Card className="border-2 border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <h3 className="font-bold text-lg">Upload Payment Evidence *</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Screenshot the Orange Money confirmation SMS or receipt
              </p>
              
              <label className="block cursor-pointer">
                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary/50">
                    <img 
                      src={screenshotPreview} 
                      alt="Payment evidence" 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-primary/50 rounded-xl p-8 text-center hover:bg-primary/5 transition-colors">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground">
                      Tap to upload screenshot
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Required for verification
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                  required
                />
              </label>
            </CardContent>
          </Card>

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Processing Time
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Deposits are typically processed within minutes. You'll receive a notification when funds are added.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate('/wallet')}
              className="flex-1 h-14 rounded-xl font-bold border-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting || !amount || !screenshot}
              className="flex-1 h-14 rounded-xl font-bold shadow-lg"
            >
              {submitting ? 'Processing...' : 'Confirm Deposit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Deposit;