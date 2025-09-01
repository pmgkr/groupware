import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@components/ui/pagination';

type AppPaginationProps = {
  totalPages: number; // 총 페이지 수
  initialPage?: number;
  visibleCount?: number; // 한 번에 몇 개 보일지
};

export function AppPagination({ totalPages, initialPage = 1, visibleCount = 5 }: AppPaginationProps) {
  const [page, setPage] = React.useState(initialPage);

  React.useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const go = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
  };

  // 항상 visibleCount 개수 유지
  const pages: number[] = React.useMemo(() => {
    const half = Math.floor(visibleCount / 2);
    let start = page - half;
    let end = page + half;

    // 범위 보정
    if (start < 1) {
      start = 1;
      end = Math.min(totalPages, visibleCount);
    }
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - visibleCount + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages, visibleCount]);

  return (
    <Pagination>
      <PaginationContent>
        {/* 첫 페이지 */}
        <PaginationItem>
          <PaginationFirst
            href="#"
            aria-disabled={isFirst}
            onClick={(e) => {
              e.preventDefault();
              if (!isFirst) go(1);
            }}
          />
        </PaginationItem>
        {/* 이전 */}
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

        {/* 페이지 번호 */}
        {pages.map((p) => (
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
        ))}

        {/* 다음 */}
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

        {/* 마지막 페이지 */}
        <PaginationItem>
          <PaginationLast
            href="#"
            aria-disabled={isLast}
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
