// @/components/board/BoardList.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { getBoardList } from '@/api/office/notice';
import type { BoardDTO } from '@/api/office/notice';
import { BOARD_ID_MAP } from '@/api';
import { useIsMobileViewport } from '@/hooks/useViewport';
import BoardCardList from './BoardListCard';

export default function BoardList() {
  const isMobile = useIsMobileViewport();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BoardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  // 현재 경로에 따라 boardId 결정
  const boardType = location.pathname.includes('/suggest') ? 'suggest' : 'notice';
  const boardId = BOARD_ID_MAP[boardType];
  const isSuggestBoard = boardType === 'suggest';

  const pageSize = 10;
  const currentPage = Number(searchParams.get('page')) || 1;
  const [page, setPage] = useState(currentPage);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const fetchBoardList = async () => {
    setLoading(true);
    try {
      const data = await getBoardList(boardId, 1, 1000);
      setPosts(data.items);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardList();
  }, [boardId]); // boardId 변경 시 재조회

  const handleSearch = () => {
    setPage(1);
    setActiveQuery(searchQuery);
  };

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
  const normalLimit = pageSize - notices.length;
  const total = filteredNormals.length;
  const startNo = (page - 1) * normalLimit;
  const paginatedNormals = normals.slice(startNo, startNo + normalLimit);

  return (
    <div>
      {/* 검색창 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input
            className="h-[32px]! px-4 max-md:placeholder:text-sm max-sm:h-[28px] [&]:bg-white"
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
      {isMobile ? (
        <BoardCardList
          notices={notices}
          posts={paginatedNormals}
          isSuggestBoard={isSuggestBoard}
          activeQuery={activeQuery}
          total={total}
          startNo={startNo}
        />
      ) : (
        <>
          {/* 🔽 기존 PC 테이블 코드 그대로 🔽 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">번호</TableHead>
                {!isSuggestBoard && <TableHead className="w-[120px]">카테고리</TableHead>}
                <TableHead className={isSuggestBoard ? 'w-[820px]' : 'w-[700px]'}>제목</TableHead>
                <TableHead className="w-[270px]">작성자</TableHead>
                <TableHead className="w-[220px]">작성날짜</TableHead>
                <TableHead className="w-[91px]">조회</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="text-[13px]">
              {notices.map((post) => (
                <TableRow
                  key={`notice-${post.n_seq}`}
                  onClick={() => navigate(`${post.n_seq}`)}
                  className="bg-primary-blue-100 cursor-pointer">
                  <TableCell>
                    <Badge>공지</Badge>
                  </TableCell>
                  {!isSuggestBoard && <TableCell>{post.category}</TableCell>}
                  <TableCell className="text-left">
                    {post.title}
                    {post.repl_cnt > 0 && <span className="ml-1 text-sm tracking-tighter text-gray-500">[ {post.repl_cnt} ]</span>}
                  </TableCell>
                  <TableCell>{post.user_name}</TableCell>
                  <TableCell>{post.reg_date.substring(0, 10)}</TableCell>
                  <TableCell>{post.v_count}</TableCell>
                </TableRow>
              ))}

              {paginatedNormals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuggestBoard ? 5 : 6} className="h-100 py-6 text-center text-gray-500">
                    {activeQuery ? `'${activeQuery}'에 대한 검색 결과가 없습니다.` : '게시글이 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedNormals.map((post, index) => (
                  <TableRow key={post.n_seq} onClick={() => navigate(`${post.n_seq}`)} className="cursor-pointer hover:bg-gray-100">
                    <TableCell>{total - startNo - index}</TableCell>
                    {!isSuggestBoard && <TableCell>{post.category}</TableCell>}
                    <TableCell className="text-left">
                      {post.title}
                      {post.repl_cnt > 0 && <span className="ml-1 text-sm tracking-tighter text-gray-500">[ {post.repl_cnt} ]</span>}
                    </TableCell>
                    <TableCell>{post.user_name}</TableCell>
                    <TableCell>{post.reg_date.substring(0, 10)}</TableCell>
                    <TableCell>{post.v_count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}

      {total > 0 && (
        <div className="mt-5">
          <AppPagination
            totalPages={Math.ceil(total / normalLimit)}
            initialPage={page}
            visibleCount={5}
            onPageChange={(p) => handlePageChange(p)}
          />
        </div>
      )}
    </div>
  );
}
