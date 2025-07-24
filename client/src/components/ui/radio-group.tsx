import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CircleIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

//사이즈 조절 추가
const radioGroupItemVariants = cva(
  'aspect-square shrink-0 rounded-full border-2 border-[color:var(--color-gray-600)] shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[color:var(--color-primary-blue-500)]',
  {
    variants: {
      size: {
        sm: 'size-3',
        md: 'size-4',
        lg: 'size-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const iconSizeClass = {
  sm: 'size-1',
  md: 'size-2',
  lg: 'size-3',
};

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid gap-3', className)} {...props} />;
}

interface RadioGroupItemProps extends React.ComponentProps<typeof RadioGroupPrimitive.Item>, VariantProps<typeof radioGroupItemVariants> {}

function RadioGroupItem({ className, size = 'md', ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item data-slot="radio-group-item" className={cn(radioGroupItemVariants({ size }), className)} {...props}>
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="relative flex items-center justify-center">
        <CircleIcon
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-[color:var(--color-primary-blue-500)] stroke-[color:var(--color-primary-blue-500)]',
            iconSizeClass[size]
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
