import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SIERRA_LEONE_REGIONS, getDistrictsByRegion } from '@/lib/sierraLeoneData';
import { useState, useEffect } from 'react';

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
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (region) {
      const regionDistricts = getDistrictsByRegion(region as any);
      setDistricts(regionDistricts);
      // Reset district if it's not in the new region's districts
      if (district && !regionDistricts.includes(district)) {
        onDistrictChange('');
      }
    } else {
      setDistricts([]);
    }
  }, [region]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region">
          Region {required && <span className="text-destructive">*</span>}
        </Label>
        <Select value={region} onValueChange={onRegionChange} required={required}>
          <SelectTrigger id="region">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
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
          District {required && <span className="text-destructive">*</span>}
        </Label>
        <Select 
          value={district} 
          onValueChange={onDistrictChange} 
          disabled={!region}
          required={required}
        >
          <SelectTrigger id="district">
            <SelectValue placeholder={region ? "Select district" : "Select region first"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
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
