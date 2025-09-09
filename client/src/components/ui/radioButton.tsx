import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

interface RadioButtonProps extends React.ComponentProps<typeof RadioGroupPrimitive.Item> {
  label: string;
  labelProps?: React.ComponentPropsWithoutRef<'span'>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'dynamic';
}

function RadioButton({ className, label, labelProps, size = 'sm', variant = 'outline', ...props }: RadioButtonProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-button"
      className={cn(
        // dynamic variant일 때는 체크 상태에 따라 default/outline 전환
        variant === 'dynamic' 
          ? 'data-[state=checked]:bg-primary-blue-500 data-[state=checked]:text-white data-[state=checked]:border-primary-blue-500 data-[state=checked]:shadow-xs data-[state=checked]:hover:shadow-blue  data-[state=checked]:hover:bg-primary-blue-500'
          : '',
        // 모든 variant에 buttonVariants 적용
        buttonVariants({ 
          variant: variant === 'dynamic' ? 'outline' : variant, 
          size: size === 'sm' ? 'sm' : size === 'md' ? 'default' : 'lg'
        }),
        className
      )}
      {...props}>
      {/* 체크 아이콘 - 체크된 상태일 때만 표시 */}
      <RadioGroupPrimitive.Indicator
        data-slot="radio-indicator"
        className={cn(
          'flex items-center justify-center transition-none [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0',
          {
            'mr-1.5 [&_svg]:size-3': size === 'sm',
            'mr-2 [&_svg]:size-4': size === 'md',
            'mr-2.5 [&_svg]:size-5': size === 'lg',
          }
        )}>
        <CheckIcon />
      </RadioGroupPrimitive.Indicator>
      
      {/* 라벨 텍스트 - 필수 */}
      <span className={cn(
        'transition-colors select-none',
        props.disabled
          ? 'cursor-not-allowed text-gray-400'
          : 'cursor-pointer',
        labelProps?.className
      )}>
        {label}
      </span>
    </RadioGroupPrimitive.Item>
  );
}

// RadioGroup 래퍼 컴포넌트
interface RadioGroupProps extends React.ComponentProps<typeof RadioGroupPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
}

function RadioGroup({ children, className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      className={cn('space-y-2', className)}
      {...props}>
      {children}
    </RadioGroupPrimitive.Root>
  );
}

export { RadioButton, RadioGroup };
