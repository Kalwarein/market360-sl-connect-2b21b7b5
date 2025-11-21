import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, Users, Shield, TrendingUp, CreditCard } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const About = () => {
  const navigate = useNavigate();

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
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">About Market360</h1>
              <p className="text-xs text-muted-foreground">Your Trusted Marketplace</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Market360 is Sierra Leone’s all-in-one digital marketplace built to empower 
              buyers, sellers, workers, freelancers, and businesses. Our mission is to give 
              everyone a trusted digital space to trade, hire, earn, advertise, and connect 
              without limitations — all in one app.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Store className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1 text-foreground">1000+</h3>
              <p className="text-sm text-muted-foreground">Verified Sellers</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1 text-foreground">50K+</h3>
              <p className="text-sm text-muted-foreground">Active Buyers</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 text-center">
              <Shield className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1 text-foreground">100%</h3>
              <p className="text-sm text-muted-foreground">Secure Platform</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1 text-foreground">24/7</h3>
              <p className="text-sm text-muted-foreground">Support Available</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Why Choose Us?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Verified sellers and original products guaranteed
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Secure escrow system ensuring safe transactions
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Instant top-ups and fast withdrawal processing
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Built for Sierra Leoneans — easy, secure, and mobile-first
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">How Payments & Deposits Work</h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-4">
              Market360 was designed from the ground up with a secure financial system 
              to protect both buyers and sellers. Every transaction goes through secure 
              verification, wallet tokens, escrow, and backend monitoring to ensure full trust.
            </p>

            <h3 className="font-semibold mt-4 mb-2">1. Deposits (Top-ups)</h3>
            <p className="text-muted-foreground leading-relaxed">
              Users can deposit money into their Market360 wallet by sending money to our 
              official mobile number: <span className="font-bold text-primary">030891960</span> 
              (Orange Money / Afrimoney). After sending, users submit the amount and upload 
              proof. Our team verifies and approves the deposit, and tokens appear instantly 
              once approved.
            </p>

            <h3 className="font-semibold mt-4 mb-2">2. Token Wallet System</h3>
            <p className="text-muted-foreground leading-relaxed">
              All payments inside Market360 are made using tokens. 1 token = 1 Le. Tokens allow 
              instant payments, secure checkout, buyer protection, and dispute management.
            </p>

            <h3 className="font-semibold mt-4 mb-2">3. Escrow Protection</h3>
            <p className="text-muted-foreground leading-relaxed">
              When a user buys a product or hires someone, the money is held in escrow by Market360. 
              Sellers receive payment only after confirming delivery or completed work. This protects 
              both sides from fraud, fake sellers, incomplete jobs, or wrong deliveries.
            </p>

            <h3 className="font-semibold mt-4 mb-2">4. Withdrawals</h3>
            <p className="text-muted-foreground leading-relaxed">
              Sellers and workers can withdraw earnings directly to Orange Money or Afrimoney. 
              Withdraw requests are processed quickly with strict backend verification for safety.
            </p>

            <h3 className="font-semibold mt-4 mb-2">5. Backend Verification & Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every transaction, deposit, withdrawal, and order is monitored by automated 
              anti-fraud systems and a manual review team. This ensures the platform stays safe, 
              fair, and trustworthy for all users.
            </p>

            <h3 className="font-semibold mt-4 mb-2">6. Why Market360 Is Trusted</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Payment confirmations are manually reviewed by staff</li>
              <li>• No seller receives money until the buyer confirms delivery</li>
              <li>• All payment logs are tracked and protected</li>
              <li>• Secure server-side validation prevents manipulation</li>
              <li>• Transparent wallet history for every user</li>
            </ul>

            <div className="mt-4">
              <Button 
                onClick={() => navigate('/how-to-top-up')}
                className="w-full rounded-xl h-11 font-medium shadow-sm"
              >
                View Full Deposit Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Contact Information</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Email: support@market360.com</p>
              <p>Phone: 030891960</p>
              <p>Address: Freetown, Sierra Leone</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
