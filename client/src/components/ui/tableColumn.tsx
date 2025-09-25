import * as React from 'react';
import { cn } from '@/lib/utils';

// 컨테이너
export function TableColumn({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="tableColumn-container" className={cn('flex w-full rounded-2xl border border-gray-300', className)} {...props} />;
}

// 왼쪽 헤더 컬럼
export function TableColumnHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="tableColumn-header"
      className={cn('flex w-28 flex-col border-r border-gray-300 bg-transparent text-sm font-medium text-gray-950', className)}
      {...props}
    />
  );
}

// 오른쪽 데이터 컬럼
export function TableColumnBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="tableColumn-body" className={cn('flex flex-1 flex-col text-sm', className)} {...props} />;
}

// 헤더 셀
export function TableColumnHeaderCell({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="tableColumn-header-cell"
      className={cn('flex items-center border-b border-gray-300 bg-transparent px-5 py-2.5 last:border-b-0', className)}
      {...props}
    />
  );
}

// 데이터 셀
export function TableColumnCell({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="tableColumn-cell"
      className={cn('flex items-center border-b border-gray-300 px-4 py-2.5 text-gray-800 last:border-b-0', className)}
      {...props}
    />
  );
}
