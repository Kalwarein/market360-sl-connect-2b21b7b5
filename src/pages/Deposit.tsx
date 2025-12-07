import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, AlertCircle, ArrowLeft, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Deposit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phone || !referenceNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      let screenshotUrl = '';

      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `deposit-${user?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        screenshotUrl = publicUrl;
      }

      const { error } = await supabase.from('wallet_requests').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: amountNum,
        phone_number: phone,
        reference_number: referenceNumber,
        screenshot_url: screenshotUrl,
      });

      if (error) throw error;

      toast.success('Deposit request submitted successfully!');
      navigate('/wallet');
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/wallet')}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Top Up Wallet</h1>
              <p className="text-sm text-muted-foreground">Add funds to your wallet</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/how-to-top-up')}
            className="text-primary hover:text-primary-hover rounded-full"
          >
            <Info className="h-4 w-4 mr-1" />
            Guide
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Banner */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 shadow-lg">
            <CardContent className="p-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="font-bold text-lg text-foreground">Orange Money Payment</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">1.</span>
                      Send money to: <strong className="text-primary">078444807</strong>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">2.</span>
                      Save the Orange Money reference number from SMS
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">3.</span>
                      Enter details below and paste the reference number
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary">4.</span>
                      Upload screenshot of SMS (optional but recommended)
                    </li>
                  </ol>
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <p className="text-sm font-bold text-green-600 flex items-center gap-2">
                      ✓ No fees! Full amount will be credited to your wallet
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="amount" className="text-base font-bold text-foreground flex items-center gap-2">
                Amount (SLL)
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-xl font-bold rounded-2xl border-2 focus:border-primary shadow-sm"
                required
              />
            </CardContent>
          </Card>

          {/* Phone Number */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="phone" className="text-base font-bold text-foreground flex items-center gap-2">
                Phone Number
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 rounded-2xl border-2 focus:border-primary shadow-sm"
                required
              />
            </CardContent>
          </Card>

          {/* Reference Number */}
          <Card className="border-2 border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="reference" className="text-base font-bold text-foreground flex items-center gap-2">
                Orange Money Transaction ID
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reference"
                type="text"
                placeholder="Paste reference number from SMS"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-14 rounded-2xl border-2 focus:border-primary shadow-sm font-mono"
                required
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                📱 Copy the transaction Id number from your Orange Money SMS
              </p>
            </CardContent>
          </Card>

          {/* Screenshot Upload */}
          <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-all shadow-md">
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="screenshot" className="text-base font-bold text-foreground">
                Payment Proof
              </Label>
              <label className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer hover:bg-primary/5 rounded-2xl transition-all border-2 border-dashed border-border hover:border-primary group">
                <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    {screenshot ? screenshot.name : 'Click to upload screenshot'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload SMS screenshot for faster processing
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </label>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => navigate('/wallet')}
              className="flex-1 h-14 rounded-2xl font-bold text-base border-2 hover:bg-muted transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting}
              className="flex-1 h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Deposit;
