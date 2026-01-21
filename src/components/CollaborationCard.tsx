import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Collaboration } from '@/lib/collaborationsData';

interface CollaborationCardProps {
  collaboration: Collaboration;
}

const CollaborationCard = ({ collaboration }: CollaborationCardProps) => {
  const navigate = useNavigate();

  return (
    <article 
      className="group bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/collaboration/${collaboration.slug}`)}
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={collaboration.coverImage}
          alt={collaboration.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {collaboration.featured && (
          <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground backdrop-blur-sm">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Featured
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            <Calendar className="w-3 h-3" />
            {collaboration.date}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {collaboration.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {collaboration.summary}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {collaboration.timeline}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary-hover gap-1 p-0 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/collaboration/${collaboration.slug}`);
            }}
          >
            View Details
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </article>
  );
};

export default CollaborationCard;
