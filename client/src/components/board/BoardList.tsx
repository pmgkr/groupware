import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';

import { getBoardList } from '@/api/office/notice';
import type { BoardDTO } from '@/api/office/notice';

export default function BoardList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BoardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const pageSize = 10; // 한 페이지에 보여줄 개수

  useEffect(() => {
    (async () => {
      try {
        const data = await getBoardList(page, pageSize);
        //console.log('API 응답:', data);
        setPosts(data.items);
        setTotal(data.total);
      } catch (err) {
        //console.error('게시글 불러오기 실패:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]); // 페이지 변경되면 다시 요청

  // posts에서 공지/일반 분리
  const notices = posts.filter((p) => p.pinned === 'Y');
  // 일반글: 최신순 정렬
  const normals = posts.filter((p) => p.pinned !== 'Y').sort((a, b) => b.n_seq - a.n_seq);
  // 화면에서 보여줄 번호 (페이지 기준 연속 번호)
  const startNo = (page - 1) * pageSize;

  return (
    <div>
      {/* 검색창 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input className="h-[40px] px-4 [&]:bg-white" placeholder="검색어 입력" />
          <Button variant="svgIcon" size="icon" className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" aria-label="검색">
            <SearchGray className="text-gray-400" />
          </Button>
        </div>
        <Button onClick={() => navigate('write')}>글쓰기</Button>
      </div>

      {/* 게시판 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead className="w-[120px]">카테고리</TableHead>
            <TableHead className="w-[700px]">제목</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>작성날짜</TableHead>
            <TableHead>조회</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* 공지글: 항상 맨 위 */}
          {notices.map((post) => (
            <TableRow
              key={`notice-${post.n_seq}`}
              onClick={() => navigate(`${post.n_seq}`)}
              className="bg-primary-blue-100 hover:bg-primary-blue-100 cursor-pointer">
              <TableCell className="font-medium">
                <Badge>공지</Badge>
              </TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell className="text-left">{post.title}</TableCell>
              <TableCell>{post.user_name}</TableCell>
              <TableCell>{post.reg_date.substring(0, 10)}</TableCell>
              <TableCell>{post.v_count}</TableCell>
            </TableRow>
          ))}
          {/* 일반글: 최신순 + 번호 */}
          {normals.map((post, index) => (
            <TableRow key={post.n_seq} onClick={() => navigate(`${post.n_seq}`)} className="cursor-pointer hover:bg-gray-100">
              <TableCell className="font-medium">{total - startNo - index}</TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell className="text-left">{post.title}</TableCell>
              <TableCell>{post.user_name}</TableCell>
              <TableCell>{post.reg_date.substring(0, 10)}</TableCell>
              <TableCell>{post.v_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-5">
        <AppPagination
          totalPages={Math.ceil(total / pageSize)}
          initialPage={page}
          visibleCount={5}
          onPageChange={(p) => setPage(p)} // ✅ 부모 state 업데이트
        />
      </div>
    </div>
  );
}
