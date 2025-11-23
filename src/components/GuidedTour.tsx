import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'toggle-sidebar' | 'scroll-to';
}

const tourSteps: TourStep[] = [
  {
    target: 'welcome',
    title: 'Welcome to Market360! 👋',
    description: "Hi! I'm Wello AI, your personal guide. I'll help you discover all the amazing features of Market360. Let's get started!",
    position: 'bottom',
  },
  {
    target: '[data-tour="sidebar-trigger"]',
    title: 'Your Navigation Hub 🎯',
    description: 'This is your sidebar menu. Click here to access important sections like Categories, Stores, Settings, and more!',
    position: 'right',
    action: 'toggle-sidebar',
  },
  {
    target: '[data-tour="customer-care"]',
    title: 'Customer Care Support 💬',
    description: 'Need help or want to report fraud? Click here to reach our customer care team anytime!',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Stay Updated 🔔',
    description: 'Your notifications appear here. Get alerts about orders, messages, and important updates!',
    position: 'bottom',
  },
  {
    target: '[data-tour="cart"]',
    title: 'Shopping Cart 🛒',
    description: 'Add products to your cart and checkout easily. Your items are saved here!',
    position: 'bottom',
  },
  {
    target: '[data-tour="messages"]',
    title: 'Chat with Sellers 💬',
    description: 'Message sellers directly to ask questions or negotiate. All your conversations are here!',
    position: 'bottom',
  },
  {
    target: '[data-tour="search-bar"]',
    title: 'Search Products 🔍',
    description: 'Looking for something specific? Use the search bar to find products, stores, and categories instantly!',
    position: 'bottom',
  },
  {
    target: '[data-tour="categories"]',
    title: 'Browse by Category 📑',
    description: 'Explore products by categories. Scroll horizontally to see all available options!',
    position: 'top',
  },
  {
    target: '[data-tour="product-card"]',
    title: 'Product Cards 📦',
    description: 'Tap any product to view details, images, pricing, and make purchases. You can also share products with friends!',
    position: 'top',
  },
  {
    target: '[data-tour="bottom-nav"]',
    title: 'Quick Navigation 🚀',
    description: 'Use the bottom navigation to quickly jump between Home, Stores, Categories, and your Profile!',
    position: 'top',
  },
];

export const GuidedTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelloIntro, setShowWelloIntro] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkTourStatus();
  }, [user]);

  useEffect(() => {
    if (isActive && currentStep > 0) {
      const step = tourSteps[currentStep];
      
      // Perform step actions
      if (step.action === 'toggle-sidebar') {
        const sidebarTrigger = document.querySelector('[data-tour="sidebar-trigger"]') as HTMLElement;
        if (sidebarTrigger && currentStep === 1) {
          setTimeout(() => {
            sidebarTrigger.click();
          }, 500);
        }
      }

      // Scroll to target element and update spotlight position
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update spotlight position
        setTimeout(() => {
          const rect = targetElement.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          document.documentElement.style.setProperty('--spotlight-x', `${centerX}px`);
          document.documentElement.style.setProperty('--spotlight-y', `${centerY}px`);
        }, 100);
      }
    }
  }, [currentStep, isActive]);

  const checkTourStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_tour_completed')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!data?.onboarding_tour_completed) {
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const completeTour = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_tour_completed: true })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsActive(false);
      toast.success('Welcome to Market360! Enjoy shopping! 🎉');
    } catch (error) {
      console.error('Error completing tour:', error);
    }
  };

  const handleNext = () => {
    if (showWelloIntro) {
      setShowWelloIntro(false);
      setCurrentStep(0);
      return;
    }

    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const getTooltipPosition = (step: TourStep) => {
    const target = document.querySelector(step.target);
    if (!target) return {};

    const rect = target.getBoundingClientRect();
    const positions: Record<string, any> = {
      top: {
        bottom: `${window.innerHeight - rect.top + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      bottom: {
        top: `${rect.bottom + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      left: {
        top: `${rect.top + rect.height / 2}px`,
        right: `${window.innerWidth - rect.left + 20}px`,
        transform: 'translateY(-50%)',
      },
      right: {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 20}px`,
        transform: 'translateY(-50%)',
      },
    };

    return positions[step.position] || positions.bottom;
  };

  if (!isActive) return null;

  const currentTarget = !showWelloIntro ? tourSteps[currentStep]?.target : null;

  return (
    <>
      {/* Blur Overlay with Spotlight Effect */}
      <div className="fixed inset-0 z-[9998]">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md" 
             style={{
               maskImage: currentTarget ? `radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), transparent 150px, black 200px)` : 'none',
               WebkitMaskImage: currentTarget ? `radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), transparent 150px, black 200px)` : 'none',
             }} 
        />
      </div>

      {/* Wello AI Introduction */}
      {showWelloIntro && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-500">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              {/* Wello AI Avatar */}
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary via-primary-hover to-accent flex items-center justify-center animate-pulse shadow-2xl">
                  <Sparkles className="h-16 w-16 text-primary-foreground animate-spin-slow" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Wello AI
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-foreground">
                  Hello! I'm Wello AI 👋
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  I'm your personal Market360 assistant and customer care agent. Let me show you around and help you discover all the amazing features!
                </p>
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Let's Get Started!
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tour Steps */}
      {!showWelloIntro && (
        <div
          className="fixed z-[9999] bg-card border-2 border-primary rounded-2xl shadow-2xl p-6 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={getTooltipPosition(tourSteps[currentStep])}
        >
          {/* Arrow indicator */}
          <div className={`absolute w-4 h-4 bg-card border-primary rotate-45 ${
            tourSteps[currentStep].position === 'top' ? 'bottom-[-10px] border-r-2 border-b-2' :
            tourSteps[currentStep].position === 'bottom' ? 'top-[-10px] border-l-2 border-t-2' :
            tourSteps[currentStep].position === 'left' ? 'right-[-10px] border-t-2 border-r-2' :
            'left-[-10px] border-b-2 border-l-2'
          } ${
            tourSteps[currentStep].position === 'top' || tourSteps[currentStep].position === 'bottom'
              ? 'left-1/2 -translate-x-1/2'
              : 'top-1/2 -translate-y-1/2'
          }`} />

          <div className="space-y-4">
            {/* Wello AI Mini Avatar */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">
                  {tourSteps[currentStep].title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {tourSteps.length}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {tourSteps[currentStep].description}
            </p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Target Element */}
      {!showWelloIntro && (
        <style>{`
          ${tourSteps[currentStep].target} {
            position: relative;
            z-index: 9999 !important;
            box-shadow: 0 0 0 4px hsl(var(--primary)), 0 0 0 12px hsl(var(--primary) / 0.4), 0 0 60px 20px hsl(var(--primary) / 0.3) !important;
            border-radius: 16px;
            background: hsl(var(--card)) !important;
          }
        `}</style>
      )}
    </>
  );
};
