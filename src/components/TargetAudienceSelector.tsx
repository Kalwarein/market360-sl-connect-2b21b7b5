import { Badge } from './ui/badge';
import { User, Users, Baby, Heart } from 'lucide-react';

interface TargetAudienceSelectorProps {
  selected: string[];
  onChange: (audiences: string[]) => void;
}

const audiences = [
  { value: 'men', label: 'For Men', icon: User },
  { value: 'women', label: 'For Women', icon: Heart },
  { value: 'unisex', label: 'Unisex', icon: Users },
  { value: 'kids', label: 'For Kids', icon: Baby },
  { value: 'teens', label: 'For Teens', icon: User },
  { value: 'babies', label: 'For Babies', icon: Baby },
];

export const TargetAudienceSelector = ({ selected, onChange }: TargetAudienceSelectorProps) => {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((a) => a !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Target Audience</label>
      <div className="flex flex-wrap gap-2">
        {audiences.map((audience) => {
          const Icon = audience.icon;
          const isSelected = selected.includes(audience.value);
          return (
            <Badge
              key={audience.value}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 transition-all ${
                isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => toggle(audience.value)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {audience.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
