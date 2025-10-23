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
  //const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const pageSize = 10; // 한 페이지에 보여줄 개수

  const fetchBoardList = async () => {
    setLoading(true);
    try {
      const data = await getBoardList(1, 1000);
      setPosts(data.items);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardList();
  }, []);

  const handleSearch = () => {
    setPage(1);
    setActiveQuery(searchQuery);
  };
  /* const filteredNormals = activeQuery.trim()
    ? posts.filter((p) => p.pinned !== 'Y' && p.title.toLowerCase().includes(activeQuery.toLowerCase()))
    : posts.filter((p) => p.pinned !== 'Y'); */
  const filteredNormals = activeQuery.trim()
    ? posts.filter(
        (p) =>
          p.pinned !== 'Y' &&
          (p.title.toLowerCase().includes(activeQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(activeQuery.toLowerCase()) ||
            p.user_name.toLowerCase().includes(activeQuery.toLowerCase()))
      )
    : posts.filter((p) => p.pinned !== 'Y');

  const notices = posts.filter((p) => p.pinned === 'Y');
  const normals = filteredNormals.sort((a, b) => b.n_seq - a.n_seq);
  // 공지 수만큼 일반글 개수 제한
  const normalLimit = pageSize - notices.length;
  const total = filteredNormals.length;
  const startNo = (page - 1) * normalLimit;
  const paginatedNormals = normals.slice(startNo, startNo + normalLimit);

  /*  // posts에서 공지/일반 분리
  const notices = posts.filter((p) => p.pinned === 'Y');
  // 일반글: 최신순 정렬
  const normals = posts.filter((p) => p.pinned !== 'Y').sort((a, b) => b.n_seq - a.n_seq);
  // 화면에서 보여줄 번호 (페이지 기준 연속 번호)
  const startNo = (page - 1) * pageSize; */

  return (
    <div>
      {/* 검색창 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input
            className="h-[32px] px-4 [&]:bg-white"
            placeholder="검색어 입력"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            variant="svgIcon"
            size="icon"
            className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2"
            aria-label="검색"
            onClick={handleSearch}>
            <SearchGray className="text-gray-400" />
          </Button>
        </div>
        <Button size="sm" onClick={() => navigate('write')}>
          글쓰기
        </Button>
      </div>

      {/* 게시판 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead className="w-[120px]">카테고리</TableHead>
            <TableHead className="w-[700px]">제목</TableHead>
            <TableHead className="w-[270px]">작성자</TableHead>
            <TableHead className="w-[220px]">작성날짜</TableHead>
            <TableHead className="w-[91px]">조회</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="border-b-0 py-3 text-center text-gray-500">
                게시글을 찾을 수 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {/* 공지글: 항상 맨 위 */}
              {notices.map((post) => (
                <TableRow
                  key={`notice-${post.n_seq}`}
                  onClick={() => navigate(`${post.n_seq}`)}
                  className="bg-primary-blue-100 cursor-pointer">
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
              {paginatedNormals.map((post, index) => (
                <TableRow key={post.n_seq} onClick={() => navigate(`${post.n_seq}`)} className="cursor-pointer hover:bg-gray-100">
                  <TableCell className="font-medium">{total - startNo - index}</TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell className="text-left">{post.title}</TableCell>
                  <TableCell>{post.user_name}</TableCell>
                  <TableCell>{post.reg_date.substring(0, 10)}</TableCell>
                  <TableCell>{post.v_count}</TableCell>
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
      </Table>
      {total > 0 && (
        <div className="mt-5">
          <AppPagination totalPages={Math.ceil(total / normalLimit)} initialPage={page} visibleCount={5} onPageChange={(p) => setPage(p)} />
        </div>
      )}
    </div>
  );
}
