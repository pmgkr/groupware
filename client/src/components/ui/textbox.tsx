import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const textboxVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-white placeholder:text-gray-400 text-gray-900 border hover:shadow-gray-400 focus:bg-white border-gray-700',
        filled: 'bg-white placeholder:text-gray-400 focus:bg-white hover:shadow-gray-400 border border-gray-700',
        focus: 'bg-white border-blue-500 hover:shadow-gray-400 border border-gray-700',
        disabled: '',
        error: '',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border text-gray-600 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-gray-300 text-gray-500 border active:bg-gray-400 active:text-gray-600 hover:shadow-gray',
        transparent: 'bg-transparent text-white border border-white',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-6 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md text-sm gap-1.5 px-3.5 has-[>svg]:px-2.5',
        lg: 'w-full max-w-[280px] h-12 text-lg rounded-md px-6 has-[>svg]:px-4',
        full: 'w-full h-12 text-lg rounded-md',
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
  ...props
}: React.ComponentProps<'input'> &
  VariantProps<typeof textboxVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'input';

  return <Comp data-slot="input" className={cn(textboxVariants({ variant, size, className }))} {...props} />;
}

export { Textbox, textboxVariants };
