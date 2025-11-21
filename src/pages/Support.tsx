import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelpCircle, MessageCircle, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const Support = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      toast.success('Support request submitted successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Support Center</h1>
              <p className="text-xs text-muted-foreground">We're here to help</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Call Us</p>
              <p className="text-xs text-muted-foreground">+232 XX XXX XXXX</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Email Us</p>
              <p className="text-xs text-muted-foreground">support@market360.sl</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Submit a Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Brief description of your issue" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md bg-background"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="account">Account Issues</option>
                  <option value="payment">Payment Problems</option>
                  <option value="order">Order Issues</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 font-medium shadow-sm" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">How do I become a seller?</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to your profile and click "Become a Seller". Fill out the application form and wait for admin approval.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">How do I track my order?</h4>
              <p className="text-sm text-muted-foreground">
                Go to your profile, select "Orders", and view the status of your orders. You'll receive notifications when the status changes.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">How does the wallet work?</h4>
              <p className="text-sm text-muted-foreground">
                You can deposit funds via Orange Money and use them for purchases. Withdrawals are also processed through Orange Money.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Support;