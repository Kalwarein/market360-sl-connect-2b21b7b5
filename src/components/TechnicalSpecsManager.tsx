import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Plus, Settings } from 'lucide-react';

interface TechnicalSpecsManagerProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

export const TechnicalSpecsManager = ({ specs, onChange }: TechnicalSpecsManagerProps) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    onChange({ ...specs, [newKey]: newValue });
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (key: string) => {
    const updated = { ...specs };
    delete updated[key];
    onChange(updated);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Technical Specifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Specs */}
        {Object.keys(specs).length > 0 && (
          <div className="space-y-2">
            {Object.entries(specs).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                  <span className="font-semibold">{key}:</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(key)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Spec */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-sm">Add Specification</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="spec-key">Specification Name</Label>
              <Input
                id="spec-key"
                placeholder="e.g., Model Number"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="spec-value">Value</Label>
              <Input
                id="spec-value"
                placeholder="e.g., XYZ-2024"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full" disabled={!newKey.trim() || !newValue.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Specification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
