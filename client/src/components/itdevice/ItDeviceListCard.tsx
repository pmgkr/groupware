import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';

interface ITDeviceListCardProps {
  posts: any[];
  total: number;
  page: number;
  pageSize: number;
  activeQuery?: string;
}

export default function ITDeviceListCard({ posts, total, page, pageSize, activeQuery }: ITDeviceListCardProps) {
  const navigate = useNavigate();

  // 검색 결과 없음
  if (posts.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        {activeQuery ? `‘${activeQuery}’에 대한 검색 결과가 없습니다.` : '등록된 장비가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, idx) => {
        const number = total - (page - 1) * pageSize - idx;

        return (
          <div
            key={post.id}
            onClick={() => navigate(`${post.id}`)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-4 active:bg-gray-100">
            <div className="mb-2 flex items-center justify-between">
              <Badge variant="secondary" className={post.device === 'Monitor' ? 'bg-primary-purple-100 text-primary-purple' : ''}>
                {post.device}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-base font-semibold text-gray-900">
                {post.brand} · {post.model}
              </div>

              <div className="flex justify-between text-sm break-all text-gray-400">
                <span>{post.serial}</span>
                <div className="text-[13px] text-gray-700">
                  {post.it_status === '재고' ? (
                    <Badge variant="secondary" className="bg-gray-200">
                      재고
                    </Badge>
                  ) : (
                    <span>{post.user || '-'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
