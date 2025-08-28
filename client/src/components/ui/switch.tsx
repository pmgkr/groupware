import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const switchVariants = cva(
  'peer inline-flex h-[1.5rem] w-11 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 enabled:hover:shadow-blue',
  {
    variants: {
      variant: {
        default: [
          'data-[state=checked]:bg-primary-blue-500',
          'data-[state=unchecked]:bg-gray-400',
          'data-[state=checked]:disabled:bg-gray-400',
          'data-[state=unchecked]:disabled:bg-disable',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const switchWrapperVariants = cva('flex items-center space-x-2', {
  variants: {
    variant: {
      default: 'has-[button[data-state="checked"]]:text-primary-blue-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root>, VariantProps<typeof switchVariants> {
  label?: string;
  labelProps?: React.ComponentPropsWithoutRef<'label'>;
}

interface SwitchWrapperProps {
  variant?: VariantProps<typeof switchWrapperVariants>['variant'];
  children: React.ReactNode;
  className?: string;
}

function SwitchWrapper({ variant, children, className }: SwitchWrapperProps) {
  return <div className={cn(switchWrapperVariants({ variant }), className)}>{children}</div>;
}

function Switch({ className, variant, label, labelProps, ...props }: SwitchProps) {
  const switchElement = (
    <SwitchPrimitive.Root data-slot="switch" className={cn(switchVariants({ variant }), className)} {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 rounded-full ring-0 transition-transform',
          'data-[state=checked]:translate-x-[calc(100%+0px data-[state=unchecked]:translate-x-0.5',
          // props.disabled 값에 따라 조건부 적용
          props.disabled
            ? [
                'bg-gray-600', // disabled일 때는 상태와 관계없이 같은 색
              ]
            : ['data-[state=checked]:bg-gray-50', 'data-[state=unchecked]:bg-gray-50', 'peer-data-[state=checked]:text-primary-blue-500']
        )}
      />
    </SwitchPrimitive.Root>
  );

  // label이 제공되면 래퍼와 함께 반환
  if (label) {
    return (
      <SwitchWrapper variant={props.disabled ? undefined : variant}>
        {switchElement}
        <label
          className={cn(
            'text-base text-gray-500 transition-colors select-none',
            props.disabled ? 'cursor-not-allowed text-gray-400' : 'peer-data-[state=checked]:text-primary-blue-500',
            labelProps?.className
          )}
          htmlFor={props.id}
          {...labelProps}>
          {label}
        </label>
      </SwitchWrapper>
    );
  }

  // label이 없으면 스위치만 반환
  return switchElement;
}

export { Switch, SwitchWrapper };
