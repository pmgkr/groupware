import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center border transition-[color,box-shadow] overflow-hidden rounded-xl px-2 py-0.5 text-xs font-normal w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none border-transparent  ',
  {
    variants: {
      variant: {
        default: ' min-w-6 bg-[color:var(--color-primary-blue-500)] text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'min-w-6 bg-[color:var(--color-primary-blue-100)] text-[color:var(--color-primary-blue)] [a&]:hover:bg-secondary/90',
        outline:
          'min-w-6 text-[color:var(--color-primary-blue-500)] border-[color:var(--color-primary-blue-500)]  [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        lightpink: 'min-w-6 bg-[color:var(--color-primary-pink-300)] text-[color:var(--color-primary-pink)] [a&]:hover:bg-primary/90',
        pink: 'min-w-6 bg-[color:var(--color-primary-pink)] text-primary-foreground [a&]:hover:bg-primary/90',
        dot: 'block max-w-full before:inline-block before:h-1.5 before:w-1.5 before:rounded-[50%] before:bg-[color:var(--color-primary-blue-500)] before:mr-1  before:align-center text-gray-500 p-0 text-ellipsis overflow-hidden whitespace-nowrap',

        // 🔵 dot variants (6px 사이즈, 원형, 색상별)
        'dot-default': 'w-1.5 h-1.5 rounded-full bg-primary-blue-500  border-none p-0',
        'dot-secondary': 'w-1.5 h-1.5 rounded-full bg-primary-blue  border-none p-0',
        'dot-pink': 'w-1.5 h-1.5 rounded-full bg-primary-pink  border-none p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
