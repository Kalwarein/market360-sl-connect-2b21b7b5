import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Headset, 
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Mail,
  Phone,
  ChevronRight
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const SupportSettings = () => {
  const navigate = useNavigate();

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
          <Headset className="h-6 w-6 text-orange-600" />
          Support
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get help and report problems
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">How can we help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl h-14"
              onClick={() => navigate('/contact')}
            >
              <span className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Contact Support</p>
                  <p className="text-xs text-muted-foreground">Chat with our team</p>
                </div>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl h-14"
              onClick={() => navigate('/support')}
            >
              <span className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">FAQ</p>
                  <p className="text-xs text-muted-foreground">Frequently asked questions</p>
                </div>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl h-14"
              onClick={() => navigate('/report-issue')}
            >
              <span className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Report a Problem</p>
                  <p className="text-xs text-muted-foreground">Let us know what went wrong</p>
                </div>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">support@market360.sl</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">+232 76 000 000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Headset className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Average Response Time</p>
                <p className="text-xs text-muted-foreground">
                  We typically respond within 24 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default SupportSettings;
