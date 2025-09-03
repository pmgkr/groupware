import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';

export default function BookList() {
  const navigate = useNavigate();
  // 더미 데이터
  const posts = [
    {
      id: 3,
      category: '비즈니스',
      title: '비즈니스 영어 회화',
      author: '이지',
      publish: '푸른나라',
      team: 'CCP',
      user: '강영현',
      createdAt: '2025-07-19',
    },
    {
      id: 2,
      category: '한국 소설',
      title: '살인자의 쇼핑몰',
      author: '강지영',
      publish: '푸른나라',
      team: 'CCD',
      user: '박보검',
      createdAt: '2025-07-05',
    },
    {
      id: 1,
      category: '인문/교양',
      title: '누가 내머리에 똥 쌌어?',
      author: '김작가',
      publish: '푸른나라',
      team: 'CCP',
      user: '홍길동',
      createdAt: '2025-07-01',
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
        <Button>도서 등록</Button>
      </div>

      {/* 게시판 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead className="w-[130px]">카테고리</TableHead>
            <TableHead className="w-[400px]">도서명</TableHead>
            <TableHead>저자</TableHead>
            <TableHead>출판사</TableHead>
            <TableHead>팀</TableHead>
            <TableHead>신청자</TableHead>
            <TableHead>날짜</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow>
              <TableCell>{post.id}</TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.author}</TableCell>
              <TableCell>{post.publish}</TableCell>
              <TableCell>{post.team}</TableCell>
              <TableCell>{post.user}</TableCell>
              <TableCell>{post.createdAt}</TableCell>
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
