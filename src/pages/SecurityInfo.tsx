import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, CheckCircle, Users, MessageCircle, Lock, TrendingUp } from 'lucide-react';

const SecurityInfo = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Buyer Protection',
      description: 'Your purchase is protected from payment to delivery. We ensure safe transactions.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Sellers',
      description: 'All sellers undergo rigorous verification including business registration and KYC.',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'All transactions are encrypted and processed through secure payment gateways.',
    },
    {
      icon: MessageCircle,
      title: 'Dispute Resolution',
      description: 'Our team mediates disputes fairly and ensures both parties are heard.',
    },
    {
      icon: Users,
      title: 'Quality Assurance',
      description: 'Products are regularly reviewed and quality standards are maintained.',
    },
    {
      icon: TrendingUp,
      title: 'Transparent Ratings',
      description: 'Honest reviews from real buyers help you make informed decisions.',
    },
  ];

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
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Security Info</h1>
              <p className="text-xs text-muted-foreground">Your safety is our priority</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3 text-foreground">How We Protect You</h2>
            <p className="text-muted-foreground leading-relaxed">
              Market360 implements multiple layers of security to ensure safe and reliable
              transactions. From seller verification to payment protection, we've got you covered
              at every step of your buying journey.
            </p>
          </CardContent>
        </Card>

        {features.map((feature, index) => (
          <Card key={index} className="rounded-2xl shadow-sm border-border/50 hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-start gap-3 text-base">
                <div className="p-3 rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground font-normal mt-1 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}

        <Card className="rounded-2xl shadow-sm bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 text-foreground">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available 24/7 to assist with any concerns or questions.
            </p>
            <Button onClick={() => navigate('/support')} className="w-full rounded-xl h-11 font-medium shadow-sm">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityInfo;
