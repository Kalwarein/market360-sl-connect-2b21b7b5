import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/lib/productCategories';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function CategorySelector({ value, onChange, label = 'Business Category', placeholder = 'Select or type category...' }: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const filteredCategories = PRODUCT_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (category: string) => {
    onChange(category);
    setOpen(false);
    setSearchValue('');
  };

  const handleAddCustom = () => {
    if (customCategory.trim()) {
      onChange(customCategory.trim());
      setCustomCategory('');
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value || placeholder}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search categories..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">No category found.</p>
                  <div className="space-y-2">
                    <Label htmlFor="custom-category">Add Custom Category</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-category"
                        placeholder="Enter category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustom();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddCustom}
                        disabled={!customCategory.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={() => handleSelect(category)}
                  >
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Badge variant="secondary" className="gap-1">
          {value}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onChange('')}
          />
        </Badge>
      )}
    </div>
  );
}
