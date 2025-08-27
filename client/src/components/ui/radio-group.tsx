import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const radioGroupItemVariants = cva(
  'border-[color:var(--color-gray-600)] text-[color:var(--color-gray-600)] focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive aspect-square shrink-0 rounded-full border-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ',
  {
    variants: {
      size: {
        sm: 'size-3',
        default: 'size-4',
        lg: 'size-5',
      },
      variant: {
        default:
          'data-[state=checked]:border-[color:var(--color-primary-blue-500)] data-[state=checked]:text-[color:var(--color-primary-blue-500)] hover:shadow-blue',
        disabled:
          'cursor-not-allowed border-gray-400 text-gray-400 fill-gray-400 data-[state=checked]:border-gray-400 data-[state=checked]:text-gray-400 ',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

// 라디오 그룹 아이템 래퍼의 variant 정의
const radioGroupItemWrapperVariants = cva('flex items-center space-x-2', {
  variants: {
    variant: {
      default: 'has-[button[data-state="checked"]]:text-[color:var(--color-primary-blue-500)]',
      disabled: 'text-gray-400',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const iconSizeMap = {
  sm: 'size-1.5',
  default: 'size-2',
  lg: 'size-2.5',
} as const;

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {}

interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {
  label?: string;
  labelProps?: React.ComponentPropsWithoutRef<'label'>;
}

interface RadioGroupItemWrapperProps {
  variant?: VariantProps<typeof radioGroupItemWrapperVariants>['variant'];
  children: React.ReactNode;
  className?: string;
}

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid gap-3', className)} {...props} />;
}

function RadioGroupItemWrapper({ variant = 'default', children, className }: RadioGroupItemWrapperProps) {
  return <div className={cn(radioGroupItemWrapperVariants({ variant }), className)}>{children}</div>;
}

function RadioGroupItem({ className, size, variant, label, labelProps, ...props }: RadioGroupItemProps) {
  const iconSizeClass = iconSizeMap[size as keyof typeof iconSizeMap];

  // variant에 따른 아이콘 색상 결정
  const getIconFillClass = () => {
    if (variant === 'disabled') return 'fill-gray-400';
    return 'fill-[color:var(--color-primary-blue-500)]';
  };

  const radioButton = (
    <RadioGroupPrimitive.Item data-slot="radio-group-item" className={cn(radioGroupItemVariants({ size, variant }), className)} {...props}>
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="relative flex items-center justify-center border-none">
        <CircleIcon className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', iconSizeClass, getIconFillClass())} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  // label이 제공되면 래퍼와 함께 반환
  if (label) {
    return (
      <RadioGroupItemWrapper variant={variant}>
        {radioButton}
        <label
          data-slot="label"
          className={cn(
            'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            labelProps?.className
          )}
          htmlFor={props.id}
          {...labelProps}>
          {label}
        </label>
      </RadioGroupItemWrapper>
    );
  }

  // label이 없으면 라디오 버튼만 반환
  return radioButton;
}

export { RadioGroup, RadioGroupItem, RadioGroupItemWrapper };
