import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { BookForm } from './BookForm';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BookList() {
  const navigate = useNavigate();
  // 더미 데이터
  const [posts, setPosts] = useState([
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
  ]);

  //다이얼로그 열림
  const [open, setOpen] = useState(false);

  //등록
  const [form, setForm] = useState({
    category: '',
    title: '',
    author: '',
    publish: '',
    link: '',
    purchaseAt: '',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  //등록 완료
  const handleRegister = () => {
    if (!form.category || !form.title || !form.author || !form.publish) {
      alert('카테고리, 도서명, 저자, 출판사는 반드시 입력해야 합니다.');
      return;
    }
    if (!window.confirm('등록하시겠습니까?')) return;

    const nextId = posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1; //id 부여

    const newBook = {
      id: nextId,
      ...form,
      team: 'CCP', // 기본값
      user: '강영현', // 기본값
      createdAt: form.purchaseAt || new Date().toLocaleDateString('sv-SE'),
      //사용자가 입력한 purchaseAt이 있으면 그 값, 없으면 오늘 날짜
    };

    setPosts((prev) => [newBook, ...prev]); // 최신순 반영

    // form 초기화
    setForm({
      category: '',
      title: '',
      author: '',
      publish: '',
      link: '',
      purchaseAt: '',
    });
    setOpen(false); // 다이얼로그 닫기
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>도서 등록</Button>
          </DialogTrigger>
          <DialogContent className="p-7">
            <DialogHeader>
              <DialogTitle className="mb-3">도서 등록</DialogTitle>
            </DialogHeader>
            <BookForm form={form} onChange={handleChange} mode="create"></BookForm>
            <DialogFooter className="mt-5">
              <Button variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button onClick={handleRegister}>완료</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
