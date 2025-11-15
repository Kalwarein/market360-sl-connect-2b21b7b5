import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, Users, Shield, TrendingUp } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const About = () => {
  const navigate = useNavigate();

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
        <h1 className="text-2xl font-bold">About Market360</h1>
        <p className="text-sm opacity-90">Your Trusted B2B Marketplace</p>
      </div>

      <div className="p-4 space-y-6">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Market360 is a comprehensive B2B e-commerce platform designed to connect
              businesses with quality suppliers and manufacturers. We're revolutionizing
              wholesale trade by providing a seamless digital marketplace where businesses
              can discover, negotiate, and purchase products efficiently.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <Store className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">1000+</h3>
              <p className="text-sm text-muted-foreground">Verified Sellers</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <Users className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">50K+</h3>
              <p className="text-sm text-muted-foreground">Active Buyers</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <Shield className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">100%</h3>
              <p className="text-sm text-muted-foreground">Secure Payments</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">24/7</h3>
              <p className="text-sm text-muted-foreground">Support Available</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Why Choose Us?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Verified sellers and authentic products guaranteed
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Competitive wholesale pricing and bulk discounts
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Secure payment processing and buyer protection
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-muted-foreground">
                  Direct communication between buyers and sellers
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Email: support@market360.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Address: 123 Business District, Commerce City</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
