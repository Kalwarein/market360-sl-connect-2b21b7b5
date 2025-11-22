import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayedText, setDisplayedText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const phrases = [
    'Your Premium Marketplace',
    'Buy & Sell with Confidence',
    'Sierra Leone\'s Best Platform',
    'Shop Securely Today'
  ];

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseDuration = 2000;

    const timer = setTimeout(() => {
      if (!isDeleting && displayedText === currentPhrase) {
        // Pause at end of phrase
        setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && displayedText === '') {
        // Move to next phrase
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else if (isDeleting) {
        // Delete character
        setDisplayedText(currentPhrase.substring(0, displayedText.length - 1));
      } else {
        // Add character
        setDisplayedText(currentPhrase.substring(0, displayedText.length + 1));
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, currentPhraseIndex, isDeleting]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6">
        {/* Logo container with premium styling */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl blur-2xl opacity-40 animate-pulse" />
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-primary/20">
            <img 
              src="/logo.png" 
              alt="Market360 Logo" 
              className="w-40 h-40 object-contain"
            />
          </div>
          {/* Floating sparkles */}
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-primary animate-pulse" />
          <Sparkles className="absolute -bottom-4 -left-4 w-6 h-6 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Brand name */}
        <h1 className="text-5xl md:text-6xl font-black text-foreground mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Market360
          </span>
        </h1>

        {/* Typewriter text with cursor */}
        <div className="h-20 flex items-center justify-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground/80">
            {displayedText}
            <span className="inline-block w-1 h-8 bg-primary ml-1 animate-pulse" />
          </h2>
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground max-w-md mb-12 text-lg leading-relaxed">
          Join Sierra Leone's most trusted marketplace. Connect with verified sellers, 
          discover amazing deals, and shop with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button
            onClick={() => navigate('/auth?mode=signup')}
            size="lg"
            className="flex-1 h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button
            onClick={() => navigate('/auth?mode=signin')}
            size="lg"
            variant="outline"
            className="flex-1 h-14 text-lg rounded-2xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 font-semibold transition-all duration-300 hover:scale-105"
          >
            Sign In
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <span>Verified Sellers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            <span>Fast Delivery</span>
          </div>
        </div>

        {/* Bottom decorative text */}
        <div className="absolute bottom-8 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            Trusted by thousands across Sierra Leone
          </p>
        </div>
      </div>
    </div>
  );
};

export default Splash;
