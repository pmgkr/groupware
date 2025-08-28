// src/components/ui/SectionHeader.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  /** 좌측 타이틀 */
  title: string;
  /** 버튼 라벨 (없으면 버튼 미출력) */
  buttonText?: string;
  /** 버튼 클릭 이벤트 */
  onButtonClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** 아이콘 컴포넌트 (예: <Edit />) */
  buttonIcon?: React.ReactNode;
  /** 버튼 variant/size */
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
  buttonSize?: React.ComponentProps<typeof Button>['size'];
  /** 추가 스타일 */
  className?: string;
}

export function SectionHeader({
  title,
  buttonText,
  onButtonClick,
  buttonIcon,
  buttonVariant = 'outlinePrimary',
  buttonSize = 'sm',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-center justify-between border-b border-b-gray-300 pb-1.5', className)}>
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>

      {buttonText ? (
        <Button variant={buttonVariant} size={buttonSize} onClick={onButtonClick}>
          {buttonIcon}
          {buttonText}
        </Button>
      ) : null}
    </div>
  );
}
