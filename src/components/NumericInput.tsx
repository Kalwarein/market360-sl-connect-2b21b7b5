import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, value, onChange, allowDecimal = false, min, max, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Allow empty string for clearing
      if (newValue === '') {
        onChange('');
        return;
      }

      // Remove non-numeric characters except decimal point if allowed
      const regex = allowDecimal ? /[^\d.]/g : /[^\d]/g;
      newValue = newValue.replace(regex, '');

      // Ensure only one decimal point
      if (allowDecimal) {
        const parts = newValue.split('.');
        if (parts.length > 2) {
          newValue = parts[0] + '.' + parts.slice(1).join('');
        }
      }

      // Apply min/max constraints
      if (newValue !== '' && newValue !== '.') {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue)) {
          if (min !== undefined && numValue < min) {
            newValue = min.toString();
          }
          if (max !== undefined && numValue > max) {
            newValue = max.toString();
          }
        }
      }

      onChange(newValue);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        className={cn(className)}
        {...props}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";
