import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const textareaVariants = cva(
  "w-full text-gray-900 bg-white border placeholder:text-muted-foreground flex field-sizing-content inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-regular transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none hover:shadow shadow-gray-400 focus:border-primary-blue-500 disabled:bg-gray-300 disabled:placeholder:text-gray-800 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer text-base resize-none",
  {
    variants: {
      variant: {
        default: '',
        filled: 'border-gray-700',
        focus: 'border-primary-blue-500',
        disabled: 'bg-gray-300 placeholder:text-gray-800',
        error: 'text-[var(--negative-base)] border-[var(--negative-base)]',
      },
      size: {
        default: 'min-h-24 h-24 px-4 py-2 has-[>svg]:px-3',
        sm: 'min-h-16 h-16 rounded-md text-sm gap-1.5 px-3.5 has-[>svg]:px-2.5 py-2.5',
        lg: 'min-h-32 h-32 text-lg rounded-md px-5 has-[>svg]:px-4 py-3',
        board: 'min-h-120 h-120 px-4 py-2 has-[>svg]:px-3',
        icon: 'size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Textarea({
  className,
  variant,
  size,
  asChild = false,
  description,
  errorMessage,
  ...props
}: React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants> & {
    asChild?: boolean;
    description?: string;
    errorMessage?: string;
  }) {
  const Comp = asChild ? Slot : 'textarea';

  return (
    <div>
      <Comp
        data-slot="textarea"
        className={cn(textareaVariants({ variant, size, className }))}
        disabled={variant === 'disabled' ? true : props.disabled}
        {...props}
      />
      {description && !errorMessage && <p className="mt-1 text-sm text-[var(--color-gray-500)]">{description}</p>}
      {errorMessage && <p className="mt-1 text-sm text-[var(--negative-base)]">{errorMessage}</p>}
    </div>
  );
}

export { Textarea, textareaVariants };
