import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Gift, 
  Milestone,
  Sparkles,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCollaborationBySlug } from '@/lib/collaborationsData';
import { toast } from 'sonner';

const CollaborationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const collaboration = getCollaborationBySlug(slug || '');

  if (!collaboration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Collaboration Not Found</h2>
          <p className="text-muted-foreground mb-4">The collaboration you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/collaboration')}>
            View All Collaborations
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: collaboration.title,
          text: collaboration.summary,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/collaboration')}
            className="rounded-full bg-muted/50 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground line-clamp-1">
              {collaboration.title}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="rounded-full"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pb-24">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80">
          <img
            src={collaboration.heroImage}
            alt={collaboration.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm mb-3">
              {collaboration.timeline}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {collaboration.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{collaboration.date}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-8">
          {/* Overview */}
          <section className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Overview</h3>
            </div>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
              {collaboration.content.overview.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </section>

          <Separator />

          {/* What This Enables */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">What This Enables</h3>
            </div>
            <div className="grid gap-3">
              {collaboration.content.enablements.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/50"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* User Benefits */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">How You Benefit</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {collaboration.content.userBenefits.map((benefit, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-accent-foreground">
                      {idx + 1}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Timeline / Milestones */}
          <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Milestone className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Timeline & Milestones</h3>
            </div>
            <div className="relative pl-6 border-l-2 border-primary/30 space-y-6">
              {collaboration.content.milestones.map((milestone, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm ml-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {milestone.date}
                    </span>
                    <h4 className="text-base font-semibold text-foreground mt-2">
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* External Links / CTAs */}
          {collaboration.externalLinks.length > 0 && (
            <>
              <Separator />
              <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Learn More About {collaboration.partner}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visit their website to discover more about our partnership and their services.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {collaboration.externalLinks.map((link, idx) => (
                      <Button
                        key={idx}
                        variant={idx === 0 ? 'default' : 'outline'}
                        className="rounded-full gap-2"
                        onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                      >
                        {link.label}
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollaborationDetail;
