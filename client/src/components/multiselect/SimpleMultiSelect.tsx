import * as React from 'react';
import { cn } from '@/lib/utils';

interface Option {
  label: string;
  value: string;
}

interface SimpleMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SimpleMultiSelect: React.FC<SimpleMultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'border-input bg-background ring-offset-background flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'ring-ring ring-2 ring-offset-2'
        )}>
        <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>
          {selected.length === 0 ? placeholder : `${selected.length} item${selected.length > 1 ? 's' : ''} selected`}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="ring-offset-background focus:ring-ring h-4 w-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none">
              ×
            </button>
          )}
          <span className="h-4 w-4 opacity-50">▼</span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full rounded-md border shadow-md">
          <div className="p-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  selected.includes(option.value) && 'bg-accent text-accent-foreground'
                )}>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => {}} // handled by parent click
                    className="h-4 w-4"
                  />
                  <span>{option.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Items Display */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <div key={value} className="bg-secondary inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                <span>{option?.label}</span>
                <button type="button" onClick={() => handleSelect(value)} className="h-3 w-3 rounded-sm opacity-70 hover:opacity-100">
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
