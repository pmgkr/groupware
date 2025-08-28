import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from '@/assets/images/icons';

export default function BoardList() {
  // 더미 데이터 배열
  const posts = [
    { id: '공지', title: '제목 제목 제목 제목 제목 제목', author: '홍길동', date: '2025-07-01', views: 15, isNotice: true },
    { id: 3, title: '제목 제목 제목 제목 제목', author: '홍길동', date: '2025-07-01', views: 15 },
    { id: 2, title: '제목 제목 제목 제목', author: '홍길동', date: '2025-07-01', views: 15 },
    { id: 1, title: '제목 제목 제목', author: '홍길동', date: '2025-07-01', views: 15 },
  ];

  return (
    <div>
      {/* 검색창 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input className="h-[40px] px-4 [&]:bg-white" placeholder="검색어 입력" />
          <Search className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <Button>글쓰기</Button>
      </div>

      {/* 게시판 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead className="w-[800px]">제목</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>작성날짜</TableHead>
            <TableHead>조회</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post, index) => (
            <TableRow
              key={index}
              className={`cursor-pointer hover:bg-gray-100 ${post.isNotice ? 'bg-primary-blue-100 hover:bg-primary-blue-100' : ''}`}>
              <TableCell className="font-medium">{post.isNotice ? <Badge>공지</Badge> : post.id}</TableCell>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.author}</TableCell>
              <TableCell>{post.date}</TableCell>
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
