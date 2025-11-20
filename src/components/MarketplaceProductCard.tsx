import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface MarketplaceProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  moq?: number;
  tag?: 'Top' | 'Hot Selling' | 'New';
  discount?: string;
}

export const MarketplaceProductCard = ({
  id,
  title,
  price,
  image,
  moq = 1,
  tag,
  discount,
}: MarketplaceProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/product/${id}`)}
      className="min-w-[160px] max-w-[200px] cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group border-border/50"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {tag && (
          <Badge
            className={`absolute top-2 left-2 ${
              tag === 'Hot Selling'
                ? 'bg-black text-white'
                : tag === 'Top'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {tag}
          </Badge>
        )}
        {discount && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            {discount}
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium line-clamp-2 text-foreground min-h-[40px]">
          {title}
        </h3>
        <div className="space-y-1">
          <p className="text-lg font-bold text-primary">Le {price.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Min. order: {moq} piece{moq > 1 ? 's' : ''}</p>
        </div>
      </div>
    </Card>
  );
};
