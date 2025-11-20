import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';

const HowToTopUp = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const orangeMoneyNumber = '078444807';

  const copyNumber = () => {
    navigator.clipboard.writeText(orangeMoneyNumber);
    setCopied(true);
    toast.success('Number copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">How to Top Up</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Orange Money Card */}
        <Card className="p-6 space-y-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
              OM
            </div>
            <div>
              <h2 className="text-xl font-bold text-orange-900">Orange Money</h2>
              <p className="text-sm text-orange-700">Official Payment Partner</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Send money to this number:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-bold text-primary bg-muted px-4 py-3 rounded-lg">
                {orangeMoneyNumber}
              </code>
              <Button
                onClick={copyNumber}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-lg"
              >
                {copied ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              1
            </span>
            Send Money via Orange Money
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground ml-10">
            <li>• Dial *144# on your phone</li>
            <li>• Select "Send Money"</li>
            <li>• Enter the number: <strong className="text-foreground">{orangeMoneyNumber}</strong></li>
            <li>• Enter the amount you want to top up</li>
            <li>• Confirm the transaction</li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              2
            </span>
            Save Your Reference Number
          </h3>
          <p className="text-sm text-muted-foreground ml-10">
            After completing the transaction, you will receive an SMS from Orange Money containing a <strong className="text-foreground">reference number</strong>. Keep this SMS safe - you'll need to enter this reference number when making your top-up request.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              3
            </span>
            Submit Top-Up Request
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground ml-10">
            <li>• Go to your Wallet page</li>
            <li>• Click "Top Up Wallet"</li>
            <li>• Enter the amount you sent</li>
            <li>• Enter your phone number</li>
            <li>• Paste the Orange Money reference number from the SMS</li>
            <li>• Upload a screenshot of the SMS (optional but recommended)</li>
            <li>• Submit your request</li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              4
            </span>
            Wait for Approval
          </h3>
          <p className="text-sm text-muted-foreground ml-10">
            Your top-up request will be reviewed by our team. Once approved, the amount will be added to your wallet balance <strong className="text-foreground">(minus a 2% processing fee)</strong>. You'll receive a notification when your request is processed.
          </p>
        </Card>

        {/* Important Notes */}
        <Card className="p-6 space-y-3 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Important Notes
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• A 2% processing fee applies to all top-ups</li>
            <li>• Always save your Orange Money reference number</li>
            <li>• Screenshot the confirmation SMS for faster processing</li>
            <li>• Top-up requests are typically processed within 24 hours</li>
            <li>• Only send money to the official number shown above</li>
          </ul>
        </Card>

        <Button
          onClick={() => navigate('/wallet')}
          className="w-full h-12 rounded-xl font-semibold shadow-lg"
        >
          Go to Wallet
        </Button>
      </main>
    </div>
  );
};

export default HowToTopUp;
