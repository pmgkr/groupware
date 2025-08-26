// src/stories/ui/pagination.stories.tsx
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Pagination,
  PaginationContent,
  //PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@components/ui/pagination';

/** 실사용과 동일한 컨트롤 패턴: 부모(이 컴포넌트)가 상태를 들고 shadcn Pagination을 조립 */
type DemoProps = {
  totalPages: number;
  initialPage: number;
  siblingCount?: number; // 현재 기준 좌우 몇 개 보여줄지(기본 1)
};

function DemoPagination({ totalPages, initialPage, siblingCount = 1 }: DemoProps) {
  const [page, setPage] = React.useState(initialPage);
  React.useEffect(() => setPage(initialPage), [initialPage]);

  const isFirst = page <= 1;
  const isLast = page >= totalPages;
  const go = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  // 7 페이지 이하면 전부 노출, 그 외엔 1 … [start..end] … last
  const pages: (number | 'ellipsis')[] = React.useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const first = 1,
      last = totalPages;
    const start = Math.max(2, page - siblingCount);
    const end = Math.min(totalPages - 1, page + siblingCount);
    const arr: (number | 'ellipsis')[] = [first];
    if (start > 2) arr.push('ellipsis');
    for (let p = start; p <= end; p++) arr.push(p);
    if (end < last - 1) arr.push('ellipsis');
    arr.push(last);
    return arr;
  }, [totalPages, page, siblingCount]);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst
            href="#"
            aria-disabled={isFirst} // 첫 페이지면 비활성
            onClick={(e) => {
              e.preventDefault();
              if (!isFirst) go(1);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={isFirst}
            onClick={(e) => {
              e.preventDefault();
              if (!isFirst) go(page - 1);
            }}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${i}`}>{/* <PaginationEllipsis /> */}</PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  go(p);
                }}>
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={isLast}
            onClick={(e) => {
              e.preventDefault();
              if (!isLast) go(page + 1);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast
            href="#"
            aria-disabled={isLast} // 마지막 페이지면 비활성
            onClick={(e) => {
              e.preventDefault();
              if (!isLast) go(totalPages);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** ── Storybook 메타 ─────────────────────────────────────────── */
const meta: Meta<typeof DemoPagination> = {
  title: 'Components/Pagination',
  component: DemoPagination,
  parameters: { layout: 'centered' },
  args: { totalPages: 12, initialPage: 3, siblingCount: 1 },
  argTypes: {
    totalPages: { control: { type: 'number', min: 1, step: 1 } },
    initialPage: { control: { type: 'number', min: 1, step: 1 } },
    siblingCount: { control: { type: 'number', min: 0, max: 3, step: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

/** 기본  */
export const Playground: Story = {
  args: {
    initialPage: 1,
    siblingCount: 1,
  },
};

/** 페이지 수가 적은 케이스 */
export const FewPages: Story = {
  args: { totalPages: 5, initialPage: 2 },
};
