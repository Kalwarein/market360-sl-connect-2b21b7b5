import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Handshake, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollaborationCard from '@/components/CollaborationCard';
import { collaborations, getFeaturedCollaborations } from '@/lib/collaborationsData';

const Collaborations = () => {
  const navigate = useNavigate();
  const featuredCollaborations = getFeaturedCollaborations();
  const otherCollaborations = collaborations.filter(c => !c.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full bg-muted/50 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Collaborations</h1>
            <p className="text-sm text-muted-foreground">Our partnerships & stories</p>
          </div>
          <Handshake className="h-6 w-6 text-primary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Hero Section */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Partnerships That Matter
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover how we're working with amazing partners to bring you the best marketplace experience in Sierra Leone.
          </p>
        </section>

        {/* Featured Collaborations */}
        {featuredCollaborations.length > 0 && (
          <section className="mb-10">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Featured Partnerships
            </h3>
            <div className="grid gap-6">
              {featuredCollaborations.map((collab) => (
                <CollaborationCard key={collab.id} collaboration={collab} />
              ))}
            </div>
          </section>
        )}

        {/* Other Collaborations */}
        {otherCollaborations.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-accent rounded-full" />
              Upcoming & More
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {otherCollaborations.map((collab) => (
                <CollaborationCard key={collab.id} collaboration={collab} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {collaborations.length === 0 && (
          <div className="text-center py-16">
            <Handshake className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Collaborations Yet</h3>
            <p className="text-muted-foreground">
              Check back soon for exciting partnership announcements!
            </p>
          </div>
        )}

        {/* Footer CTA */}
        <section className="mt-12 text-center bg-muted/30 rounded-2xl p-6 border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Interested in Partnering?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're always looking for partners who share our vision of empowering commerce in Sierra Leone.
          </p>
          <Button 
            onClick={() => navigate('/contact')}
            className="rounded-full"
          >
            Contact Us
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Collaborations;
