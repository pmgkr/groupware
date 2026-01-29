import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { formatKST } from '@/utils';
import type { Book } from '@/api';

interface BookListCardProps {
  posts: Book[];
  total: number;
  startNo: number;
  searchQuery?: string;
}

export default function BookListCard({ posts, total, startNo, searchQuery }: BookListCardProps) {
  const navigate = useNavigate();

  // 검색 결과 없음
  if (posts.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        {searchQuery ? `‘${searchQuery}'에 대한 검색 결과가 없습니다.` : '등록된 도서가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => {
        const number = total - startNo - index;

        return (
          <div key={post.id} className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex w-[80%] items-center gap-x-2 text-sm font-medium text-gray-600">
                <span>No. {number}</span>
                <span className="w-[70%] truncate">{post.category}</span>
              </div>

              <span className="shrink-0 text-sm text-gray-500">{formatKST(post.purchaseAt, true)}</span>
            </div>

            <div className="line-clamp-2 text-base font-semibold text-gray-900">{post.title}</div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-gray-600">
              <span>{post.author}</span>
              <span>
                {post.team_name} · {post.user_name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
