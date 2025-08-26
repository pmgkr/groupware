// components/common/AppPagination.tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';

type AppPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
};

export function AppPagination({ page, totalPages, onPageChange }: AppPaginationProps) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <Pagination>
      <PaginationContent>
        {/* 이전 */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={isFirst}
            onClick={(e) => {
              e.preventDefault();
              if (!isFirst) onPageChange(page - 1);
            }}
          />
        </PaginationItem>

        {/* 숫자 버튼 예시 (1만 표시, 실제로는 map 돌려도 됨) */}
        <PaginationItem>
          <PaginationLink
            href="#"
            isActive={page === 1}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(1);
            }}>
            1
          </PaginationLink>
        </PaginationItem>

        {/* 다음 */}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={isLast}
            onClick={(e) => {
              e.preventDefault();
              if (!isLast) onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
