import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Handshake, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getFeaturedCollaborations } from '@/lib/collaborationsData';

const BANNER_DISMISSED_KEY = 'collaboration_banner_dismissed';
const BANNER_DISMISSED_DATE_KEY = 'collaboration_banner_dismissed_date';
const DISMISS_DURATION_DAYS = 7; // Show again after 7 days

interface CollaborationBannerProps {
  variant?: 'modal' | 'banner';
}

const CollaborationBanner = ({ variant = 'modal' }: CollaborationBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const featuredCollaborations = getFeaturedCollaborations();
  const latestCollab = featuredCollaborations[0];

  useEffect(() => {
    if (!latestCollab) return;

    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const dismissedDate = localStorage.getItem(BANNER_DISMISSED_DATE_KEY);

    if (dismissed === 'true' && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < DISMISS_DURATION_DAYS) {
        return;
      }
    }

    // Small delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [latestCollab]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    localStorage.setItem(BANNER_DISMISSED_DATE_KEY, Date.now().toString());
  };

  const handleViewCollaborations = () => {
    handleDismiss();
    navigate('/collaboration');
  };

  if (!latestCollab || !isVisible) return null;

  if (variant === 'banner') {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in md:left-auto md:right-6 md:max-w-sm">
        <div className="relative bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors z-10"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="relative h-28 overflow-hidden">
            <img
              src={latestCollab.coverImage}
              alt={latestCollab.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">New Partnership</span>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-foreground text-sm mb-1">
              {latestCollab.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {latestCollab.summary}
            </p>
            <Button
              size="sm"
              className="w-full rounded-full gap-2"
              onClick={handleViewCollaborations}
            >
              View Collaborations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border/50">
        <DialogTitle className="sr-only">New Collaboration Announcement</DialogTitle>
        
        {/* Hero Image */}
        <div className="relative h-44">
          <img
            src={latestCollab.coverImage}
            alt={latestCollab.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                <Handshake className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary bg-primary/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                New Collaboration
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {latestCollab.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {latestCollab.summary}
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1 rounded-full gap-2"
              onClick={handleViewCollaborations}
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationBanner;
