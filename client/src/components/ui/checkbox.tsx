import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  label?: string;
  labelProps?: React.ComponentPropsWithoutRef<'label'>;
}

interface CheckboxWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function CheckboxWrapper({ children, className }: CheckboxWrapperProps) {
  return <div className={cn('flex items-center space-x-2', className)}>{children}</div>;
}

function Checkbox({ className, label, labelProps, ...props }: CheckboxProps) {
  const checkboxElement = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-5 shrink-0 rounded-[2px] border-2 border-gray-600 text-gray-500 shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        'disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:shadow-none data-[state=checked]:disabled:border-gray-400',
        'hover:shadow-blue',
        className
      )}
      {...props}>
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white transition-none data-[disabled]:bg-gray-400">
        <CheckIcon className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  // label이 제공되면 래퍼와 함께 반환
  if (label) {
    return (
      <CheckboxWrapper>
        {checkboxElement}
        <label
          className={cn(
            'text-base transition-colors select-none',
            props.disabled
              ? 'cursor-not-allowed text-gray-400'
              : 'cursor-pointer text-gray-700 peer-data-[state=checked]:text-[color:var(--color-primary-blue-500)]',
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

export { Checkbox, CheckboxWrapper };
