import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center border transition-[color,box-shadow] overflow-hidden rounded-xl font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none border-transparent  ',
  {
    variants: {
      variant: {
        default: 'bg-primary-blue-500 text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-primary-blue-100 text-primary-blue [a&]:hover:bg-secondary/90 border-primary-blue-300/10',
        grayish: 'bg-gray-100 text-gray-700 [a&]:hover:bg-gray-300/90 border-gray-300/50',
        outline: 'text-primary-blue-500 border-primary-blue-500  [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        destructive: 'border border-red-500 text-red-500 [a&]:hover:bg-red-500/90',
        lightpink: 'bg-primary-pink-300 text-primary-pink [a&]:hover:bg-primary/90',
        lightpink2: 'bg-primary-pink-300/20 text-primary-pink [a&]:hover:bg-primary-pink/90',
        pink: 'bg-primary-pink text-primary-foreground [a&]:hover:bg-primary/90',
        dot: 'block max-w-full before:inline-block before:h-1.5 before:w-1.5 before:rounded-[50%] before:bg-primary-blue-500 before:mr-1  before:align-center text-gray-500 p-0 text-ellipsis overflow-hidden whitespace-nowrap',

        // 🔵 dot variants (6px 사이즈, 원형, 색상별)
        'dot-default': 'w-1.5 h-1.5 rounded-full bg-primary-blue-500  border-none p-0',
        'dot-secondary': 'w-1.5 h-1.5 rounded-full bg-primary-blue  border-none p-0',
        'dot-pink': 'w-1.5 h-1.5 rounded-full bg-primary-pink  border-none p-0',
      },
      size: {
        default: 'min-w-6 px-2 py-0.5 text-xs',
        md: 'min-w-5 px-2 py-0.5 text-sm',
        table: 'min-w-6 px-2 py-.25 text-sm max-md:text-[11px]! max-md:px-1.5', // 테이블 안에 들어가는 badge
        dot: 'p-0 w-1.5 h-1.5 rounded-full text-[0px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
