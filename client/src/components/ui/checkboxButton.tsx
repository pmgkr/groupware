import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

interface CheckboxButtonProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  label: string;
  labelProps?: React.ComponentPropsWithoutRef<'span'>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'dynamic' | 'dynamicBlue';
}


function CheckboxButton({ className, label, labelProps, size = 'sm', variant = 'outline', ...props }: CheckboxButtonProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox-button"
      className={cn(
        // default variant일 때 체크된 상태에서 호버 시 흰색 텍스트
        variant === 'default' 
          ? 'data-[state=checked]:hover:!text-white'
          : 'hover:!text-primary-blue-500',
        // dynamic variant일 때는 체크 상태에 따라 default/outline 전환
        variant === 'dynamic' 
          ? 'data-[state=checked]:bg-primary-blue-100 data-[state=checked]:!text-primary-blue-500 data-[state=checked]:border-primary-blue-500 data-[state=checked]:shadow-xs data-[state=checked]:hover:shadow-blue'
          : variant === 'dynamicBlue'
          ? 'data-[state=checked]:bg-primary-blue-500 data-[state=checked]:!text-white data-[state=checked]:border-primary-blue-500 data-[state=checked]:shadow-xs data-[state=checked]:hover:shadow-blue data-[state=checked]:hover:bg-primary-blue-500'
          : '',
        // 모든 variant에 buttonVariants 적용
        buttonVariants({ 
          variant: (variant === 'dynamic' || variant === 'dynamicBlue') ? 'outline' : variant, 
          size: size === 'sm' ? 'sm' : size === 'md' ? 'default' : 'lg'
        }),
        className
      )}
      {...props}>
      {/* 체크 아이콘 - 체크된 상태일 때만 표시 */}
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          'flex items-center justify-center transition-none [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0',
          {
            '[&_svg]:size-3': size === 'sm',
            '[&_svg]:size-4': size === 'md',
            '[&_svg]:size-5': size === 'lg',
          }
        )}>
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
      
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
    </CheckboxPrimitive.Root>
  );
}

export { CheckboxButton };
