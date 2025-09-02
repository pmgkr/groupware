import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';

export default function BoardList() {
  const navigate = useNavigate();
  // 더미 데이터
  const posts = [
    {
      id: 999,
      category: '전체공지',
      title: '📢 공지사항 제목',
      content: `
안녕하세요.
서비스 안정화를 위해 아래 일정으로 시스템 점검이 진행됩니다.

- 일시: 2025년 9월 1일(월) 00:00 ~ 02:00
- 영향: 점검 시간 동안 로그인 및 일부 기능 제한

이용에 불편을 드려 죄송합니다.
      `,
      writer: '관리자',
      views: 1000,
      createdAt: '2025-07-01',
      isNotice: true,
    },
    {
      id: 3,
      category: '일반',
      title: '제목 제목 제목 제목 제목',
      content: '3번 글 내용입니다.',
      writer: '홍길동',
      views: 15,
      createdAt: '2025-07-01',
    },
    {
      id: 2,
      category: '프로젝트',
      title: '제목 제목 제목 제목',
      content: '2번 글 내용입니다.',
      writer: '박보검',
      views: 222,
      createdAt: '2025-07-25',
    },
    {
      id: 1,
      category: '기타',
      title: '제목 제목 제목',
      content: '1번 글 내용입니다.',
      writer: '윤도운',
      views: 825,
      createdAt: '2025-08-30',
    },
  ];

  return (
    <div>
      {/* 검색창 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input className="h-[40px] px-4 [&]:bg-white" placeholder="검색어 입력" />
          <SearchGray className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
          {posts.map((post) => (
            <TableRow
              key={post.id}
              onClick={() => navigate(`${post.id}`)}
              className={`cursor-pointer hover:bg-gray-100 ${post.isNotice ? 'bg-primary-blue-100 hover:bg-primary-blue-100' : ''}`}>
              <TableCell className="font-medium">{post.isNotice ? <Badge>공지</Badge> : post.id}</TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell className="text-left">{post.title}</TableCell>
              <TableCell>{post.writer}</TableCell>
              <TableCell>{post.createdAt}</TableCell>
              <TableCell>{post.views}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-5">
        <AppPagination totalPages={10} initialPage={1} visibleCount={5} />
      </div>
    </div>
  );
}
