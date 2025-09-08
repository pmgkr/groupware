import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Checkbox size variants
const checkboxVariants = cva(
  [
    'peer shrink-0 rounded-[2px] border-2 border-gray-600 text-gray-500 shadow-xs transition-shadow outline-none',
    'data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:shadow-none',
    'data-[state=checked]:disabled:border-gray-400',
    'hover:shadow-blue',
  ],
  {
    variants: {
      size: {
        sm: 'size-4.5',
        md: 'size-5', // default
        lg: 'size-6',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

// CheckIcon size variants
const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'size-3.5',
      md: 'size-4',
      lg: 'size-5',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

// Label text size variants
const labelVariants = cva(['transition-colors select-none', 'peer-data-[state=checked]:text-primary-blue-500 text-gray-700'], {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    disabled: {
      true: 'cursor-not-allowed !text-gray-400',
      false: 'cursor-pointer text-gray-400',
    },
  },
  defaultVariants: {
    size: 'sm',
    disabled: false,
  },
});

interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root>, VariantProps<typeof checkboxVariants> {
  label?: string;
  labelProps?: React.ComponentPropsWithoutRef<'label'>;
}

interface CheckboxWrapperProps {
  children: React.ReactNode;
  className?: string;
  size?: VariantProps<typeof checkboxVariants>['size'];
}

// Wrapper spacing variants based on size
const wrapperVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: 'space-x-1.5',
      md: 'space-x-2',
      lg: 'space-x-2.5',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

function CheckboxWrapper({ children, className, size }: CheckboxWrapperProps) {
  return <div className={cn(wrapperVariants({ size }), className)}>{children}</div>;
}

function Checkbox({ className, label, labelProps, size, ...props }: CheckboxProps) {
  const checkboxElement = (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn(checkboxVariants({ size }), className)} {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white transition-none data-[disabled]:bg-gray-400">
        <CheckIcon className={iconVariants({ size })} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  // label이 제공되면 래퍼와 함께 반환
  if (label) {
    return (
      <CheckboxWrapper size={size}>
        {checkboxElement}
        <label
          className={cn(
            labelVariants({
              size,
              disabled: props.disabled,
            }),
            labelProps?.className
          )}
          htmlFor={props.id}
          {...(labelProps || {})}>
          {label}
        </label>
      </CheckboxWrapper>
    );
  }

  // label이 없으면 체크박스만 반환
  return checkboxElement;
}

export { Checkbox, CheckboxWrapper, checkboxVariants, labelVariants, iconVariants };
