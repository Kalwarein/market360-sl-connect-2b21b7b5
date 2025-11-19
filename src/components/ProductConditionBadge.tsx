import { Badge } from './ui/badge';
import { Sparkles, Package, RefreshCw, PackageCheck } from 'lucide-react';

interface ProductConditionBadgeProps {
  condition: string;
  className?: string;
}

const conditionConfig: Record<string, { label: string; icon: any; color: string }> = {
  brand_new: { label: 'Brand New', icon: Sparkles, color: 'bg-green-100 text-green-700 border-green-300' },
  like_new: { label: 'Like New', icon: PackageCheck, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  refurbished: { label: 'Refurbished', icon: RefreshCw, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  used_excellent: { label: 'Used - Excellent', icon: Package, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  used_good: { label: 'Used - Good', icon: Package, color: 'bg-orange-100 text-orange-700 border-orange-300' },
};

export const ProductConditionBadge = ({ condition, className = '' }: ProductConditionBadgeProps) => {
  const config = conditionConfig[condition] || conditionConfig.brand_new;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border ${className}`} variant="outline">
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
