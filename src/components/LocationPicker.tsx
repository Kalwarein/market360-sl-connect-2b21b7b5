import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SIERRA_LEONE_REGIONS, getAllDistricts } from '@/lib/sierraLeoneData';

interface LocationPickerProps {
  region: string;
  district: string;
  onRegionChange: (region: string) => void;
  onDistrictChange: (district: string) => void;
  required?: boolean;
}

export function LocationPicker({ 
  region, 
  district, 
  onRegionChange, 
  onDistrictChange,
  required = false 
}: LocationPickerProps) {
  const allDistricts = getAllDistricts();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region">
          Region {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={region} onValueChange={onRegionChange} required={required}>
          <SelectTrigger id="region" className="bg-background">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {SIERRA_LEONE_REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="district">
          City / District {required && <span className="text-destructive">*</span>}
        </Label>
        <Select 
          value={district} 
          onValueChange={onDistrictChange} 
          required={required}
        >
          <SelectTrigger id="district" className="bg-background">
            <SelectValue placeholder="Select city or district" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {allDistricts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
