// src/components/ui/SectionHeader.tsx
import * as React from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  /** 좌측 타이틀 */
  title: string;

  /** 버튼 라벨 (없으면 버튼 미출력) */
  buttonText?: string;

  /** 버튼 아이콘 (예: <Edit />) */
  buttonIcon?: React.ReactNode;

  /** 클릭 이벤트 (링크가 없을 때만 사용) */
  onButtonClick?: React.MouseEventHandler<HTMLButtonElement>;

  /** 링크 버튼: Link가 href를 소유 (내부 링크) */
  buttonHref?: string;

  /** 버튼 variant/size */
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
  buttonSize?: React.ComponentProps<typeof Button>['size'];

  /** 추가 스타일 */
  className?: string;
}

export function SectionHeader({
  title,
  buttonText,
  buttonIcon,
  onButtonClick,
  buttonHref,
  buttonVariant = 'outlinePrimary',
  buttonSize = 'sm',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-center justify-between border-b border-b-gray-300 pb-1.5', className)}>
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>

      {buttonText ? (
        buttonHref ? (
          // 간단 사용: href만 넘기면 내부에서 Link를 생성
          <Button variant={buttonVariant} size={buttonSize} asChild>
            <Link to={buttonHref}>
              {buttonIcon}
              {buttonText}
            </Link>
          </Button>
        ) : (
          // 일반 버튼(onClick)
          <Button variant={buttonVariant} size={buttonSize} onClick={onButtonClick}>
            <span className="inline-flex items-center gap-1.5">
              {buttonIcon}
              {buttonText}
            </span>
          </Button>
        )
      ) : null}
    </div>
  );
}
