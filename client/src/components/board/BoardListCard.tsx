import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';

interface BoardCardListProps {
  notices: any[];
  posts: any[]; // paginatedNormals
  isSuggestBoard: boolean;
  activeQuery?: string;
  total: number;
  startNo: number;
}

export default function BoardCardList({ notices, posts, isSuggestBoard, activeQuery, total, startNo }: BoardCardListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* 1️⃣ 고정 공지 (항상 표시) */}
      {notices.map((post) => (
        <div
          key={`notice-${post.n_seq}`}
          onClick={() => navigate(`${post.n_seq}`)}
          className="bg-primary-blue-50 rounded-xl border border-gray-300 px-[15px] py-2.5">
          <div className="mb-2.5 flex items-center justify-between border-b border-gray-300 pb-2">
            <Badge>공지</Badge>
          </div>

          <div className="line-clamp-2 text-base font-semibold text-gray-900">
            {post.title}
            {post.repl_cnt > 0 && <span className="ml-1 text-sm text-gray-500">[ {post.repl_cnt} ]</span>}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm text-gray-500">
            <span>{post.user_name}</span>
            <span className="text-sm text-gray-500">{post.reg_date.substring(0, 10)}</span>
          </div>
        </div>
      ))}

      {/* 2️⃣ 일반글이 없을 때 (검색 결과 없음 / 게시글 없음) */}
      {posts.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500">
          {activeQuery ? `'${activeQuery}'에 대한 검색 결과가 없습니다.` : '게시글이 없습니다.'}
        </div>
      )}

      {/* 3️⃣ 일반글 */}
      {posts.map((post, index) => {
        const number = total - startNo - index;

        return (
          <div
            key={post.n_seq}
            onClick={() => navigate(`${post.n_seq}`)}
            className="rounded-xl border border-gray-300 bg-white px-[15px] py-2.5 active:bg-gray-100">
            <div className="mb-2.5 flex items-center justify-between border-b border-gray-300 pb-2">
              <span className="text-sm font-medium">No. {number}</span>
              {!isSuggestBoard && post.category && (
                <Badge variant="secondary">
                  <span className="text-sm">{post.category}</span>
                </Badge>
              )}
            </div>

            <div className="line-clamp-2 text-base font-semibold text-gray-900">
              {post.title}
              {post.repl_cnt > 0 && <span className="ml-1 text-sm text-gray-500">[ {post.repl_cnt} ]</span>}
            </div>

            {/* 하단 */}
            <div className="mt-1.5 flex items-center justify-between text-sm text-gray-500">
              <span>{post.user_name}</span>
              <span className="text-sm text-gray-500">{post.reg_date.substring(0, 10)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
