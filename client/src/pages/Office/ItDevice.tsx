import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from '@/assets/images/icons';
import { useNavigate } from 'react-router';

export default function ItDevice() {
  const navigate = useNavigate();
  // 더미 데이터
  const posts = [
    {
      id: 4,
      device: 'Monitor',
      brand: 'SONY',
      model: 'sony monitor model name',
      serial: '12345687',
      purchaseAt: '2025-09-01',
      createdAt: '2025-09-02',
      user: '빙홍차',
    },
    {
      id: 3,
      device: 'Laptop',
      brand: 'SONY',
      model: 'sony Laptop model name',
      serial: '5445d26ds',
      purchaseAt: '2025-08-01',
      createdAt: '2025-08-02',
      user: '김원필',
    },
    {
      id: 2,
      device: 'Desktop',
      brand: 'Asus',
      model: 'Expert Book',
      serial: '12345687',
      purchaseAt: '2025-07-01',
      createdAt: '2025-07-02',
      user: '유승호',
    },
    {
      id: 1,
      device: 'LG',
      brand: 'Monitor',
      model: 'LED Monitor',
      serial: '203NTEPCT052',
      purchaseAt: '2025-06-01',
      createdAt: '2025-06-02',
      user: '이영서',
    },
  ];
  ('');

  return (
    <div>
      {/* 검색창 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input className="h-[40px] px-4 [&]:bg-white" placeholder="검색어 입력" />
          <Search className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <Button>등록하기</Button>
      </div>

      {/* 게시판 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead>디바이스</TableHead>
            <TableHead>구매일자</TableHead>
            <TableHead>브랜드</TableHead>
            <TableHead>모델</TableHead>
            <TableHead>시리얼넘버</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>등록일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id} onClick={() => navigate(`${post.id}`)} className={`cursor-pointer hover:bg-gray-100`}>
              <TableCell>{post.id}</TableCell>
              <TableCell>{post.device}</TableCell>
              <TableCell>{post.purchaseAt}</TableCell>
              <TableCell>{post.brand}</TableCell>
              <TableCell>{post.model}</TableCell>
              <TableCell>{post.serial}</TableCell>
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
