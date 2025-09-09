import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Edit, Delete, Download } from '@/assets/images/icons';

export default function BookWish() {
  //더미 데이터
  const [posts, setPosts] = useState([
    {
      id: 1,
      category: 'IT',
      title: '클린 코드',
      author: '로버트 마틴',
      publish: '인사이트',
      team: 'CCP',
      user: '홍길동',
      createdAt: '2025-07-01',
      status: '신청',
    },
    {
      id: 2,
      category: '경영',
      title: '하드씽',
      author: '벤 호로위츠',
      publish: '한경',
      team: 'CCP',
      user: '김철수',
      createdAt: '2025-07-02',
      status: '완료',
    },
    {
      id: 3,
      category: '디자인',
      title: '도넛 경제학',
      author: '케이트',
      publish: '어크로스',
      team: 'CCD',
      user: '이영희',
      createdAt: '2025-07-03',
      status: '신청',
    },
    {
      id: 4,
      category: '디자인',
      title: '디자인 잘하는 법',
      author: '김디자인',
      publish: 'PMG',
      team: 'CCD',
      user: '김원필',
      createdAt: '2025-07-08',
      status: '신청',
    },
  ]);

  const [selected, setSelected] = useState<number[]>([]);

  // 신청 상태인 행만 체크 가능
  const toggleOne = (id: number, status: string) => {
    if (status !== '신청') return; // 완료된 건 체크 불가
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  // 전체선택 (신청 상태만)
  const allRequestIds = posts.filter((p) => p.status === '신청').map((p) => p.id);
  const allChecked = selected.length === allRequestIds.length && allRequestIds.length > 0;
  const someChecked = selected.length > 0 && !allChecked;

  const toggleAll = () => {
    setSelected(allChecked ? [] : allRequestIds);
  };

  // 완료 처리
  const handleComplete = () => {
    if (selected.length === 0) return;
    if (window.confirm(`${selected.length}개 완료처리 하시겠습니까?`)) {
      setPosts((prev) => prev.map((p) => (selected.includes(p.id) ? { ...p, status: '완료' } : p)));
      setSelected([]); // 선택 초기화
    }
  };

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

        <Button>도서 신청</Button>
      </div>

      {/* 게시판 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="[&>[role=checkbox]]:translate-x-[2px]">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>상태</TableHead>
            <TableHead>날짜</TableHead>
            <TableHead className="w-[130px]">카테고리</TableHead>
            <TableHead className="w-[400px]">도서명</TableHead>
            <TableHead>저자</TableHead>
            <TableHead>출판사</TableHead>
            <TableHead>팀</TableHead>
            <TableHead>신청자</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="[&:has([role=checkbox])]:pr-auto">
                <Checkbox
                  checked={selected.includes(post.id)}
                  onCheckedChange={() => toggleOne(post.id, post.status)}
                  disabled={post.status !== '신청'} // 완료된 건 체크박스 비활성화
                />{' '}
              </TableCell>
              <TableCell>
                {post.status === '신청' ? (
                  <Badge variant="lightpink" className="px-3">
                    신청
                  </Badge>
                ) : (
                  <Badge variant="pink" className="px-3">
                    완료
                  </Badge>
                )}
              </TableCell>
              <TableCell>{post.createdAt}</TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.author}</TableCell>
              <TableCell>{post.publish}</TableCell>
              <TableCell>{post.team}</TableCell>
              <TableCell>{post.user}</TableCell>
              <TableCell>
                <div className="text-gray-700">
                  <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="수정">
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="삭제">
                    <Delete className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-5 flex justify-end">
        <Button onClick={handleComplete} variant="outline">
          완료 처리
        </Button>
      </div>

      <div>
        <AppPagination totalPages={10} initialPage={1} visibleCount={5} />
      </div>
    </div>
  );
}
