import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  size?: 'default' | 'sm';
};

function Input({ className, type, size = 'default', ...props }: InputProps) {
  const sizeClasses =
    size === 'sm'
      ? 'h-8 text-sm px-3 py-0.5 file:h-6 file:text-xs placeholder:text-sm max-md:h-8 max-md:rounded-sm max-md:text-[11px]' // sm 전용 스타일
      : 'h-11 text-base px-3 py-1 file:h-7 file:text-sm placeholder:text-base max-md:h-10 max-md:rounded-sm max-md:text-[13px]'; // default 스타일

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex w-full rounded-md border bg-white shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-white file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/80',
        sizeClasses,
        'focus-visible:border-primary-blue-300 focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
