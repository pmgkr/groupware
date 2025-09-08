import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DayPicker } from '@/components/daypicker/daypicker';

const textboxVariants = cva(
  "text-[var(--color-gray-900)] bg-white border placeholder:text-[var(--color-gray-400)] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-regular transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none hover:shadow shadow-[var(--color-gray-400)] focus:border-[var(--color-primary-blue-500)] disabled:bg-[var(--color-gray-300)] disabled:placeholder:text-[var(--color-gray-800)] dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: '',
        filled: 'border-[var(--color-gray-700)]',
        focus: 'border-[var(--color-primary-blue-500)]',
        disabled: 'bg-[var(--color-gray-300)] placeholder:text-[var(--color-gray-800)]',
        error: 'text-[var(--negative-base)] border-[var(--negative-base)]',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md text-sm gap-1.5 px-3.5 has-[>svg]:px-2.5',
        lg: 'w-full max-w-[280px] h-12 text-lg rounded-md px-5 has-[>svg]:px-4',
        full: 'w-full h-12 text-lg rounded-md px-5 has-[>svg]:px-4',
        icon: 'size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Textbox({
  className,
  variant,
  size,
  asChild = false,
  description,
  errorMessage,
  type,
  value,
  onChange,
  ...props
}: React.ComponentProps<'input'> &
  VariantProps<typeof textboxVariants> & {
    asChild?: boolean;
    description?: string;
    errorMessage?: string;
  }) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value as string) : undefined
  );

  // type="date"일 때 DayPicker 사용
  if (type === 'date') {
    const handleDateSelect = (selectedDate: Date | undefined) => {
      setDate(selectedDate);
      if (onChange) {
        const event = {
          target: {
            value: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    return (
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                textboxVariants({ variant, size }),
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                className
              )}
              disabled={variant === 'disabled' ? true : props.disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ko }) : (props.placeholder || "날짜를 선택하세요")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {description && !errorMessage && (
          <p className="mt-1 text-sm text-[var(--color-gray-500)]">{description}</p>
        )}
        {errorMessage && (
          <p className="mt-1 text-sm text-[var(--negative-base)]">{errorMessage}</p>
        )}
      </div>
    );
  }

  // 다른 타입들은 기존 방식 사용
  const Comp = asChild ? Slot : 'input';

  return (
    <div>
      <Comp 
        data-slot="input" 
        type={type}
        className={cn(textboxVariants({ variant, size, className }))} 
        disabled={variant === 'disabled' ? true : props.disabled}
        value={value}
        onChange={onChange}
        {...props} 
      />
      {description && !errorMessage && (
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">{description}</p>
      )}
      {errorMessage && (
        <p className="mt-1 text-sm text-[var(--negative-base)]">{errorMessage}</p>
      )}
    </div>
  );
}

export { Textbox, textboxVariants };
