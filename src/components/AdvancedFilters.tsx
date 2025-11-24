import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getAllDistricts } from '@/lib/sierraLeoneData';

export interface FilterOptions {
  priceRange: [number, number];
  districts: string[];
  conditions: string[];
  ratings: number[];
  sortBy: string;
  shippingMethods: string[];
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  maxPrice?: number;
}

const conditions = [
  { value: 'brand_new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'used_excellent', label: 'Used - Excellent' },
  { value: 'used_good', label: 'Used - Good' },
];

const shippingMethods = [
  { value: 'bike', label: 'Bike Delivery' },
  { value: 'car', label: 'Car Delivery' },
  { value: 'courier', label: 'Courier Service' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'views', label: 'Most Viewed' },
];

export const AdvancedFilters = ({ filters, onFilterChange, maxPrice = 10000000 }: AdvancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      priceRange: [0, maxPrice],
      districts: [],
      conditions: [],
      ratings: [],
      sortBy: 'newest',
      shippingMethods: [],
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const toggleArrayFilter = (key: keyof FilterOptions, value: string | number) => {
    setLocalFilters((prev) => {
      const array = prev[key] as any[];
      const index = array.indexOf(value);
      
      return {
        ...prev,
        [key]: index > -1
          ? array.filter((v) => v !== value)
          : [...array, value],
      };
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <Select
          value={localFilters.sortBy}
          onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Price Range: Le {localFilters.priceRange[0].toLocaleString()} - Le {localFilters.priceRange[1].toLocaleString()}
        </label>
        <Slider
          min={0}
          max={maxPrice}
          step={10000}
          value={localFilters.priceRange}
          onValueChange={(value) => setLocalFilters({ ...localFilters, priceRange: value as [number, number] })}
          className="mt-2"
        />
      </div>

      {/* Districts */}
      <div>
        <label className="text-sm font-medium mb-2 block">Location (District)</label>
        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
          {getAllDistricts().map((district) => (
            <div key={district} className="flex items-center space-x-2">
              <Checkbox
                id={`district-${district}`}
                checked={localFilters.districts.includes(district)}
                onCheckedChange={() => toggleArrayFilter('districts', district)}
              />
              <label
                htmlFor={`district-${district}`}
                className="text-sm cursor-pointer"
              >
                {district}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="text-sm font-medium mb-2 block">Condition</label>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div key={condition.value} className="flex items-center space-x-2">
              <Checkbox
                id={`condition-${condition.value}`}
                checked={localFilters.conditions.includes(condition.value)}
                onCheckedChange={() => toggleArrayFilter('conditions', condition.value)}
              />
              <label
                htmlFor={`condition-${condition.value}`}
                className="text-sm cursor-pointer"
              >
                {condition.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Method */}
      <div>
        <label className="text-sm font-medium mb-2 block">Shipping Method</label>
        <div className="space-y-2">
          {shippingMethods.map((method) => (
            <div key={method.value} className="flex items-center space-x-2">
              <Checkbox
                id={`shipping-${method.value}`}
                checked={localFilters.shippingMethods.includes(method.value)}
                onCheckedChange={() => toggleArrayFilter('shippingMethods', method.value)}
              />
              <label
                htmlFor={`shipping-${method.value}`}
                className="text-sm cursor-pointer"
              >
                {method.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={localFilters.ratings.includes(rating)}
                onCheckedChange={() => toggleArrayFilter('ratings', rating)}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="text-sm cursor-pointer"
              >
                {rating}★ & Up
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleApply} className="flex-1">
          Apply Filters
        </Button>
        <Button onClick={handleReset} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(localFilters.districts.length > 0 ||
            localFilters.conditions.length > 0 ||
            localFilters.ratings.length > 0 ||
            localFilters.shippingMethods.length > 0) && (
            <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              Active
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Advanced Filters
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContent />
        </div>
      </SheetContent>
    </Sheet>
  );
};
