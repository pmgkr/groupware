import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BoardList() {
  return (
    <>
      <div>
        <Input></Input>
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
            <TableRow className="anchor">
              <TableCell className="font-medium">
                <Badge>공지</Badge>
              </TableCell>
              <TableCell>제목 제목 제목 제목 제목 제목 </TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>2025-07-01</TableCell>
              <TableCell>15</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">3</TableCell>
              <TableCell>제목 제목 제목 제목 제목</TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>2025-07-01</TableCell>
              <TableCell>15</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>제목 제목 제목 제목 </TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>2025-07-01</TableCell>
              <TableCell>15</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>제목 제목 제목 </TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>2025-07-01</TableCell>
              <TableCell>15</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-0.5 text-right">
          <Button>글쓰기</Button>
        </div>

        <AppPagination totalPages={10} initialPage={1} visibleCount={5} />
      </div>
    </>
  );
}
