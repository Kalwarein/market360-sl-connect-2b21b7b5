import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Message sent successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Contact Us</h1>
        <p className="text-sm opacity-90">Get in touch with Market360</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Contact Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  Freetown, Sierra Leone
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">+232 XX XXX XXXX</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">contact@market360.sl</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send us a Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" type="tel" placeholder="+232 XX XXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us how we can help you..."
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Monday - Friday</span>
              <span className="text-sm font-medium">9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Saturday</span>
              <span className="text-sm font-medium">10:00 AM - 4:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Sunday</span>
              <span className="text-sm font-medium">Closed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Contact;