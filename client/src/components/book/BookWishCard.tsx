import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { formatKST } from '@/utils';
import type { Book } from '@/api';
import { Checkbox } from '../ui/checkbox';

interface BookWishCardProps {
  posts: Book[];
  total: number;
  searchQuery?: string;
  onSelect: (post: Book) => void;
  isAdmin: boolean;
  selected: number[];
  onToggleSelect: (id: number, status: string) => void;
  onToggleAll: () => void;
}

export default function BookWishCard({ posts, searchQuery, onSelect, isAdmin, selected, onToggleSelect, onToggleAll }: BookWishCardProps) {
  const requestIds = posts.filter((p) => p.status === '신청').map((p) => p.id);
  const allChecked = requestIds.length > 0 && requestIds.every((id) => selected.includes(id));

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        {searchQuery ? `‘${searchQuery}'에 대한 검색 결과가 없습니다.` : '신청된 도서가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isAdmin && requestIds.length > 0 && (
        <div className="mb-2 flex items-center justify-between px-3 py-2">
          <Checkbox checked={allChecked} onCheckedChange={onToggleAll} label="전체 선택" />
        </div>
      )}
      {posts.map((post) => {
        const isChecked = selected.includes(post.id);

        return (
          <div
            key={post.id}
            onClick={() => onSelect(post)}
            className={`cursor-pointer rounded-xl border px-4 py-4 ${isChecked ? 'border-primary-blue bg-primary-blue-50' : 'border-gray-300 bg-white'} `}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                {/* 관리자 + 신청 상태일 때만 선택 */}
                {isAdmin && post.status === '신청' && (
                  <Checkbox
                    checked={isChecked}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => onToggleSelect(post.id, post.status)}
                  />
                )}

                <Badge
                  variant={post.status === '신청' ? 'lightpink' : 'pink'}
                  className={post.status === '신청' ? 'bg-primary-pink-100 text-primary-pink' : 'bg-primary-pink text-white'}>
                  {post.status}
                </Badge>
              </div>

              <span className="text-sm text-gray-500">{formatKST(post.purchaseAt, true)}</span>
            </div>

            <div className="line-clamp-2 text-base font-semibold text-gray-900">{post.title}</div>

            <div className="mt-1.5 flex items-center justify-between text-sm text-gray-600">
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
