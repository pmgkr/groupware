import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { BookForm, type BookFormData } from './BookForm';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { getBookList, registerBook, type Book, type BookRegisterPayload } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatKST } from '@/utils';

export default function BookList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [posts, setPosts] = useState<Book[]>([]);
  const pageSize = 10;
  const fetchBookList = async (pageNum = 1, query = '') => {
    try {
      const data = await getBookList(pageNum, pageSize, query);

      setPosts(data.items);
      setTotal(data.total);
      setPageInfo({
        page: data.page,
        totalPages: data.pages,
        total: data.total,
      });
    } catch (err) {
      console.error('❌ booklist 불러오기 실패:', err);
      setPosts([]);
    }
  };
  useEffect(() => {
    fetchBookList(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(searchInput);
    fetchBookList(1, searchInput);
  };
  // 화면에서 보여줄 번호 (페이지 기준 연속 번호)
  const startNo = (page - 1) * pageSize;

  //다이얼로그 열림
  const [open, setOpen] = useState(false);

  //등록
  const [form, setForm] = useState<BookFormData>({
    category: '',
    title: '',
    author: '',
    publish: '',
    buylink: '',
    purchaseAt: '',
  });

  const handleChange = (key: keyof BookFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  //등록 유효성 검사
  const handleRegisterClick = () => {
    if (!form.category || !form.title || !form.author || !form.publish) {
      alert('카테고리, 도서명, 저자, 출판사는 반드시 입력해야 합니다.');
      return;
    }
    openConfirm('도서를 등록하시겠습니까?', () => handleRegister());
  };
  //등록 완료
  const handleRegister = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const today = formatKST(new Date());
      const purchaseDate = form.purchaseAt ? formatKST(`${form.purchaseAt}T00:00:00`) : formatKST(new Date()); // 구매날짜 = 선택 or 오늘(new Date());
      const payload = {
        b_user_id: user.user_id,
        b_user_name: user.user_name,
        b_team_id: Number(user.team_id),
        b_title: form.title,
        b_category: form.category,
        b_author: form.author,
        b_publish: form.publish,
        b_buylink: form.buylink,
        b_date: today,
        b_buy_date: purchaseDate,
        b_status: '완료',
      };
      const res = await registerBook(payload as BookRegisterPayload);
      if (res.success) {
        const refreshed = await getBookList(pageInfo.page);
        setPosts(refreshed.items);
        setPageInfo({
          page: refreshed.page,
          totalPages: refreshed.pages,
          total: refreshed.total,
        });
        setTotal(refreshed.total);

        // ✅ 폼 초기화 + 다이얼로그 닫기
        setForm({
          category: '',
          title: '',
          author: '',
          publish: '',
          buylink: '',
          purchaseAt: '',
        });
        setOpen(false);
      } else {
        alert('도서 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 도서 등록 오류:', err);
      alert('서버 오류로 인해 도서 등록에 실패했습니다.');
    }
  };

  // 컨펌 다이얼로그 상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action?: () => void;
    title: string;
  }>({ open: false, title: '' });

  // 열기 함수
  const openConfirm = (title: string, action: () => void) => {
    setConfirmState({ open: true, title, action });
  };

  const Administrator = 'admin';
  return (
    <div className="relative max-sm:mt-2">
      {/* 검색창 */}
      <div className="absolute -top-11 right-0 flex justify-end gap-3 max-sm:relative max-sm:top-0">
        <div className="relative mb-4 w-[175px]">
          <Input
            className="h-[32px]! px-4 [&]:bg-white"
            placeholder="검색어 입력"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
        {user?.user_level === Administrator && (
          <Dialog
            open={open}
            onOpenChange={(open) => {
              if (confirmState.open) return;
              setOpen(open);
            }}
            modal={false}>
            <DialogTrigger asChild>
              <Button size="sm">도서 등록</Button>
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
                <Button onClick={handleRegisterClick}>완료</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 게시판 테이블 */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[8%]">번호</TableHead>
            <TableHead className="w-[12%]">카테고리</TableHead>
            <TableHead className="">도서명</TableHead>
            <TableHead className="w-[12%]">저자</TableHead>
            <TableHead className="w-[12%]">출판사</TableHead>
            <TableHead className="w-[8%]">팀</TableHead>
            <TableHead className="w-[8%]">신청자</TableHead>
            <TableHead className="w-[12%]">날짜</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-[13px]">
          {posts.length > 0 ? (
            posts.map((post, index) => {
              return (
                <TableRow key={post.id}>
                  <TableCell>{total - startNo - index}</TableCell>
                  <TableCell className="max-w-[130px] truncate">{post.category}</TableCell>
                  <TableCell className="max-w-[400px] truncate">{post.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{post.author}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{post.publish}</TableCell>
                  <TableCell className="max-w-[130px] truncate">{post.team_name}</TableCell>
                  <TableCell>{post.user_name}</TableCell>
                  <TableCell>{formatKST(post.purchaseAt, true)}</TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="h-100 py-10 text-center text-gray-500">
                {searchQuery ? `‘${searchQuery}’에 대한 검색 결과가 없습니다.` : '등록된 도서가 없습니다.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* 공통 다이얼로그 */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        onConfirm={() => confirmState.action?.()}
      />

      {posts.length > 0 && total > 1 && (
        <div className="mt-5">
          <AppPagination totalPages={pageInfo.totalPages} initialPage={page} visibleCount={5} onPageChange={(p) => setPage(p)} />
        </div>
      )}
    </div>
  );
}
