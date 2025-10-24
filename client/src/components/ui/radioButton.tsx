import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

interface RadioButtonProps extends React.ComponentProps<typeof RadioGroupPrimitive.Item> {
  label: string;
  labelProps?: React.ComponentPropsWithoutRef<'span'>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'dynamic' | 'dynamicBlue';
  iconHide?: boolean;
}

function RadioButton({ className, label, labelProps, size = 'sm', variant = 'outline', iconHide = false, ...props }: RadioButtonProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-button"
      className={cn(
        // default variant일 때 체크된 상태에서 호버 시 흰색 텍스트
        variant === 'default' ? 'data-[state=checked]:hover:!text-white' : 'hover:!text-primary-blue-500',
        // dynamic variant일 때는 체크 상태에 따라 default/outline 전환
        variant === 'dynamic'
          ? 'data-[state=checked]:bg-primary-blue-100 data-[state=checked]:!text-primary-blue-500 data-[state=checked]:border-primary-blue-300'
          : variant === 'dynamicBlue'
            ? 'data-[state=checked]:bg-primary-blue-500 data-[state=checked]:border-primary-blue-500 data-[state=checked]:hover:shadow-blue data-[state=checked]:hover:bg-primary-blue-500 data-[state=checked]:!text-white data-[state=checked]:shadow-xs'
            : '',
        // 모든 variant에 buttonVariants 적용
        buttonVariants({
          variant: variant === 'dynamic' || variant === 'dynamicBlue' ? 'outline' : variant,
          size: size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : size === 'md' ? 'default' : 'lg',
        }),
        className
      )}
      {...props}>
      {/* 체크 아이콘 - 체크된 상태일 때만 표시 & iconHide = true 인 경우 아이콘 숨김처리 */}
      {!iconHide && (
        <RadioGroupPrimitive.Indicator
          data-slot="radio-indicator"
          className={cn('flex shrink-0 items-center justify-center transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0', {
            '[&_svg]:size-3': size === 'sm',
            '[&_svg]:size-4': size === 'md',
            '[&_svg]:size-5': size === 'lg',
          })}>
          <CheckIcon />
        </RadioGroupPrimitive.Indicator>
      )}

      {/* 라벨 텍스트 - 필수 */}
      <span
        className={cn(
          'transition-colors select-none',
          props.disabled ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer',
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
    <RadioGroupPrimitive.Root className={cn('space-y-2', className)} {...props}>
      {children}
    </RadioGroupPrimitive.Root>
  );
}

export { RadioButton, RadioGroup };
