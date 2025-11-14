import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PremiumSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export const PremiumSearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search products...",
}: PremiumSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    onSearch();
  };

  return (
    <div 
      className={`
        relative flex items-center gap-2 bg-card rounded-2xl shadow-md 
        transition-all duration-300 overflow-hidden
        ${isFocused ? 'ring-2 ring-primary shadow-lg' : ''}
      `}
    >
      <div className="absolute left-4">
        <Search className={`h-5 w-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        placeholder={placeholder}
        className="pl-12 pr-20 h-14 bg-transparent border-0 focus-visible:ring-0 text-base font-medium placeholder:text-muted-foreground"
      />

      <div className="absolute right-2 flex items-center gap-1">
        {value && (
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full hover:bg-muted"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          className="h-10 px-6 rounded-xl ripple gradient-primary"
          onClick={onSearch}
        >
          Search
        </Button>
      </div>
    </div>
  );
};
