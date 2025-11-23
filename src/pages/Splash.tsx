import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, ShieldCheck, Package, ArrowRight } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Wallet,
      category: 'Finance',
      title: 'Secure Wallet',
      description: 'Your money is protected with our escrow system. Pay with confidence and get refunds if anything goes wrong.',
      colors: 'from-primary to-accent',
    },
    {
      icon: ShieldCheck,
      category: 'Trust',
      title: 'Verified Sellers',
      description: 'Shop from trusted, verified sellers across Sierra Leone. Quality products backed by buyer protection.',
      colors: 'from-accent to-primary',
    },
    {
      icon: Package,
      category: 'Delivery',
      title: 'Fast Delivery',
      description: 'Track your orders in real-time. Get your products delivered safely to your doorstep across the country.',
      colors: 'from-primary to-accent',
    },
  ];

  const handleNext = () => {
    if (currentStep < features.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const handleSignIn = () => {
    navigate('/auth?mode=signin');
  };

  if (currentStep === features.length) {
    // Final step - Auth options
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-6 animate-fade-in">
          {/* Logo */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-2xl opacity-30 animate-pulse" />
            <div className="relative bg-card rounded-full p-6 shadow-2xl border border-primary/20">
              <img 
                src="/logo.png" 
                alt="Market360" 
                className="w-32 h-32 object-contain rounded-full"
              />
            </div>
          </div>

          {/* Brand name with gradient */}
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              Market360
            </span>
          </h1>

          <p className="text-center text-muted-foreground max-w-md mb-12 text-lg">
            Join Sierra Leone's most trusted marketplace
          </p>

          {/* Auth buttons */}
          <div className="flex flex-col gap-4 w-full max-w-md mb-8">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Sign Up
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              onClick={handleSignIn}
              size="lg"
              variant="outline"
              className="h-14 text-lg rounded-2xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 font-semibold transition-all duration-300 hover:scale-105"
            >
              I already have an account
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <span>Trusted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              <span>Fast</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentFeature = features[currentStep];
  const Icon = currentFeature.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center px-6">
        {/* Feature card */}
        <div 
          className="bg-card rounded-3xl shadow-2xl border border-border/50 p-8 max-w-md w-full backdrop-blur-sm animate-scale-in"
          key={currentStep}
        >
          {/* Icon container with gradient */}
          <div className="flex justify-center mb-6">
            <div className={`relative bg-gradient-to-br ${currentFeature.colors} p-8 rounded-3xl shadow-lg`}>
              {/* Floating decorative elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="absolute top-1/2 -right-4 w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              
              <Icon className="w-24 h-24 text-white" />
            </div>
          </div>

          {/* Category badge */}
          <div className="flex justify-center mb-4">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {currentFeature.category}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            {currentFeature.title}
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground leading-relaxed mb-8">
            {currentFeature.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {features.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-primary/30'
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <Button
            onClick={handleNext}
            size="lg"
            className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {currentStep === features.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Skip option */}
        <button
          onClick={handleGetStarted}
          className="mt-6 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default Splash;
