import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Info, 
  FileText,
  Shield,
  ExternalLink,
  Heart,
  ChevronRight
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const AboutSettings = () => {
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
          <Info className="h-6 w-6 text-gray-600" />
          About
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          App information and legal
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* App Info */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6 text-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <img 
                src="/logo.png" 
                alt="Market360" 
                className="h-14 w-14 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h2 className="text-xl font-bold text-foreground">Market360</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sierra Leone's Premier Marketplace
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-xs font-semibold">1.0.0</span>
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => navigate('/terms')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Terms & Conditions
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => navigate('/privacy')}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Links */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Learn More</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => navigate('/about')}
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                About Us
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => window.open('https://market360.sl', '_blank')}
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Made with Love */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> in Sierra Leone
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2024 Market360. All rights reserved.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AboutSettings;
