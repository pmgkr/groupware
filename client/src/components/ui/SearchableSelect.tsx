import * as React from 'react';
import { CheckIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandList, CommandInput, CommandItem, CommandEmpty } from '@/components/ui/command';

export interface SingleSelectOption {
  /** 표시할 라벨 */
  label: string;
  /** 고유한 값 */
  value: string;
  /** 선택 항목 옆에 표시할 아이콘 (선택적) */
  icon?: React.ComponentType<{ className?: string }>;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SingleSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  popoverClassName?: string;
  emptyIndicator?: React.ReactNode;
  size?: 'sm' | 'default' | 'lg';
  invalid?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '옵션을 선택하세요',
  searchable = true,
  disabled = false,
  className,
  popoverClassName,
  emptyIndicator,
  size = 'default',
  invalid = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0); // Trigger Width
  const triggerRef = React.useRef<HTMLButtonElement | null>(null); // Trigger Ref

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    if (!triggerRef.current) return;
    const el = triggerRef.current;

    const resizeObserver = new ResizeObserver(() => {
      setTriggerWidth(el.offsetWidth);
    });

    resizeObserver.observe(el);
    setTriggerWidth(el.offsetWidth); // 초기값

    return () => resizeObserver.disconnect();
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue) return options;
    const normalized = searchValue.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(normalized) || opt.value.toLowerCase().includes(normalized));
  }, [options, searchValue, searchable]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 text-sm px-3 max-md:h-8 max-md:rounded-sm max-md:text-[11px]';
      case 'lg':
        return 'h-12 text-lg px-4 max-md:h-10 max-md:rounded-sm max-md:text-base';
      default:
        return 'h-11 text-base px-3 max-md:h-10 max-md:rounded-sm max-md:text-[13px]';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-inherit hover:bg-inherit',
            getSizeClasses(),
            invalid && 'border-destructive ring-destructive/20',
            className
          )}
          onClick={() => setOpen((prev) => !prev)}>
          <span className={cn('truncate', selectedOption ? 'text-gray-800' : 'text-muted-foreground')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          'w-full p-0',
          'max-md:[&_input]:h-9 max-md:[&_input]:text-[13px] max-md:[&_input]:py-2',
          'max-md:[&_[cmdk-item]]:text-[13px] max-md:[&_[cmdk-item]]:py-1.5',
          'max-md:[&_[cmdk-empty]]:text-[13px]',
          popoverClassName
        )}
        align="start"
        onInteractOutside={(e) => e.preventDefault()}
        style={{
          width: triggerWidth ? `${triggerWidth}px` : 'auto',
        }}>
        <Command shouldFilter={false}>
          {searchable && <CommandInput placeholder="검색어를 입력하세요" value={searchValue} onValueChange={setSearchValue} />}
          <CommandList className="p-1">
            <CommandEmpty>{emptyIndicator || '일치하는 항목이 없습니다.'}</CommandEmpty>
            {filteredOptions.map((opt) => {
              const isSelected = opt.value === value;

              return (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  onSelect={(v) => {
                    onChange(v);
                    setSearchValue('');
                    setOpen(false);
                  }}
                  className="[&_svg:not([class*='text-'])]:text-muted-foreground cursor-pointer hover:bg-inherit">
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{opt.label}</span>
                  {isSelected && <CheckIcon className="size-4" />}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
