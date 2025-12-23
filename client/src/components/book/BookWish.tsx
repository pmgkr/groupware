import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect, useState } from 'react';
import { Edit, Delete, Download } from '@/assets/images/icons';
import { BookForm, type BookFormData } from './BookForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import { completeBook, deleteBook, getBookWishList, updateBook, type Book } from '@/api';
import { registerBook, type BookRegisterPayload } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatKST } from '@/utils';
import { useAppAlert } from '../common/ui/AppAlert/AppAlert';
import { useAppDialog } from '../common/ui/AppDialog/AppDialog';
import { CheckCircle, OctagonAlert } from 'lucide-react';

export default function BookWish() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [posts, setPosts] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  const pageSize = 10;
  const fetchBookWishList = async (pageNum = 1, query = '') => {
    try {
      const data = await getBookWishList(pageNum, pageSize, query);
      setPosts(data.items);
      setTotal(data.total);
    } catch (err) {
      setPosts([]);
    }
  };
  useEffect(() => {
    fetchBookWishList(page, searchQuery);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(searchInput);
    fetchBookWishList(1, searchInput);
  };

  // 페이지 변경
  const handlePageChange = (nextPage: number) => {
    setPageInfo((prev) => ({ ...prev, page: nextPage }));
  };

  //  완료 체크 관련
  const [selected, setSelected] = useState<number[]>([]);
  const allRequestIds = posts.filter((p) => p.status === '신청').map((p) => p.id);
  const allChecked = selected.length === allRequestIds.length && allRequestIds.length > 0;

  const toggleAll = () => setSelected(allChecked ? [] : allRequestIds);
  const toggleOne = (id: number, status: string) => {
    if (status !== '신청') return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();
  const confirmAction = (label: string, message: string, action: () => Promise<void> | void) => {
    addDialog({
      title: `<span class=" font-semibold">${label} 확인</span>`,
      message: `${message}`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await action();
          addAlert({
            title: `${label} 완료`,
            message: `${label}이(가) 성공적으로 처리되었습니다.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } catch (err) {
          console.error('❌ 오류:', err);
          addAlert({
            title: `${label} 실패`,
            message: '작업 중 오류가 발생했습니다.',
            icon: <OctagonAlert />,
            duration: 2000,
          });
        }
      },
    });
  };

  //  완료 처리
  const Administrator = 'admin';
  const handleCompleteClick = async () => {
    if (selected.length === 0) {
      addAlert({
        title: '선택 오류',
        message: '완료처리할 항목을 선택해주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    confirmAction('완료처리', `${selected.length}개 항목을 완료처리 하시겠습니까?`, async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          selected.map(async (id) => {
            const data = await completeBook(id);
            return data;
          })
        );

        // UI 업데이트
        setPosts((prev) => prev.map((p) => (selected.includes(p.id) ? { ...p, status: '완료', purchaseAt: formatKST(new Date()) } : p)));

        addAlert({
          title: '완료 처리됨',
          message: `${results.length}개 항목이 완료되었습니다.`,
          icon: <CheckCircle />,
          duration: 2000,
        });

        setSelected([]);
      } catch (err) {
        console.error('❌ 완료처리 오류:', err);
        addAlert({
          title: '오류 발생',
          message: '완료처리 중 오류가 발생했습니다.',
          icon: <OctagonAlert />,
          duration: 2000,
        });
      } finally {
        setLoading(false);
      }
    });
  };

  //도서 신청 다이얼로그 상태
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BookFormData>({
    category: '',
    title: '',
    author: '',
    publish: '',
    buylink: '',
    createdAt: '',
  });
  const handleChange = (key: keyof BookFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  //도서 신청 등록 유효성 검증
  const handleRegisterClick = () => {
    if (!form.category || !form.title || !form.author || !form.publish || !form.buylink) {
      addAlert({
        title: '입력 오류',
        message: '카테고리, 도서명, 저자, 출판사, 링크는 반드시 입력해야 합니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }
    confirmAction('도서 신청', '도서를 신청하시겠습니까?', () => handleRegister());
  };

  // 도서 신청 등록
  const handleRegister = async (mode: 'apply' | 'register' = 'apply') => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const payload = {
        b_user_id: user.user_id,
        b_user_name: user.user_name,
        b_team_id: Number(user.team_id),
        b_title: form.title,
        b_category: form.category,
        b_author: form.author,
        b_publish: form.publish,
        b_buylink: form.buylink,
        b_date: formatKST(new Date()),

        // 상태별 분기

        ...(mode === 'apply'
          ? {
              b_status: '신청',
              b_buy_date: null, // ✅ 신청일 경우 구매일자 강제 비움
            }
          : {
              b_status: '완료',
              b_buy_date: formatKST(new Date()), // ✅ 오프라인 등록일 경우 구매일자 함께
            }),
      };

      const res = await registerBook(payload as BookRegisterPayload);
      if (res.success) {
        // 목록 새로고침
        getBookWishList(pageInfo.page).then((res) => {
          setPosts(res.items);
          setPageInfo({ page: res.page, totalPages: res.pages, total: res.total });
        });

        // 입력폼 리셋 및 닫기
        setForm({
          category: '',
          title: '',
          author: '',
          publish: '',
          buylink: '',
          createdAt: '',
        });
        setOpen(false);
      } else {
        addAlert({
          title: '오류',
          message: '도서 신청에 실패했습니다',
          icon: <OctagonAlert />,
          duration: 2000,
        });
      }
    } catch (err) {
      console.error('❌ 도서 신청 오류:', err);
      addAlert({
        title: '오류',
        message: '서버 오류로 인해 도서 신청에 실패했습니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
    }
  };

  //신청도서 상세보기
  const [openView, setOpenView] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const handleRowClick = (post: any) => {
    setSelectedPost(post);
    setOpenView(true);
  };

  //수정, 삭제
  const [openEdit, setOpenEdit] = useState(false);
  const [editPost, setEditPost] = useState<BookFormData | null>(null);

  const handleEdit = (post: BookFormData) => {
    setEditPost(post);
    setOpenEdit(true);
  };

  //수정 유효성 검사
  const handleEditUpdateClick = () => {
    if (!editPost) return;

    if (!editPost.category || !editPost.title || !editPost.author || !editPost.publish) {
      addAlert({
        title: '입력 오류',
        message: '카테고리, 도서명, 저자, 출판사는 반드시 입력해야 합니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return; // ✅ 유효성 실패 시 중단
    }

    confirmAction('신청도서 수정', '신청 도서를 수정하시겠습니까?', handleEditUpdate);
  };

  // 수정
  const handleEditUpdate = async () => {
    if (!editPost) return;

    await updateBook(editPost.id!, {
      b_title: editPost.title,
      b_category: editPost.category,
      b_author: editPost.author,
      b_publish: editPost.publish,
      b_buylink: editPost.buylink,
    });

    setPosts((prev) => prev.map((p) => (p.id === editPost.id ? { ...p, ...editPost } : p)));
    setOpenEdit(false);
  };

  // 삭제
  const handleDelete = async (id: number) => {
    try {
      await deleteBook(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('❌ 도서 삭제 실패:', err);
    }
  };

  /*   // 컨펌 다이얼로그상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action?: () => void;
    title: string;
  }>({ open: false, title: '' });

  // 열기 함수
  const openConfirm = (title: string, action: () => void) => {
    setConfirmState({ open: true, title, action });
  }; */

  return (
    <div className="relative">
      {/* 검색창 */}
      <div className="absolute -top-11 right-0 flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input
            className="h-[32px] px-4 [&]:bg-white"
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">도서 신청</Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="mb-3">도서 신청</DialogTitle>
              <DialogDescription>중복으로 구매가 되지 않도록 도서목록 검색 후 신청 부탁드립니다.</DialogDescription>
            </DialogHeader>
            <div className="text-sm text-gray-800">
              <div className="">
                <div className="mb-2 w-[43%]">
                  <h2 className="mb-1 font-bold">▶ 온라인 도서 신청 </h2>
                  <p>
                    - 신청기간 : 매월 말일 까지 <br />- 제공기간 : 익월 5일 이내
                  </p>
                </div>
                <div className="mb-2 w-[57%]">
                  <h2 className="mb-1 font-bold">▶ 오프라인 도서 신청 </h2>
                  <p>
                    1. 오프라인에서 도서 구매
                    <br />
                    2. 구매한 도서를 총무에게 제출 후 PMG 도서 도장 받기
                    <br />
                    3. 개별적으로 그룹웨어 일반 비용 청구
                    <br />
                    4. 도서 비용 지급
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mb-1 font-bold">※ 주의사항 </h2>
                <p>
                  - 온라인, 오프라인 중 1인 3만원 이내 도서 구매 가능
                  <br />- 구매 전, 온라인 도서 신청 페이지에서 중복 체크 필수
                </p>
              </div>
            </div>
            <BookForm form={form} onChange={handleChange} mode="apply" />
            <DialogFooter className="mt-5">
              <Button variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button onClick={handleRegisterClick}>등록</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 도서 테이블 */}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            {user?.user_level === Administrator && (
              <TableHead className="w-[40px] [&>[role=checkbox]]:translate-x-[2px]">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
              </TableHead>
            )}
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="w-[130px]">날짜</TableHead>
            <TableHead className="w-[130px]">카테고리</TableHead>
            <TableHead className="w-[400px]">도서명</TableHead>
            <TableHead className="w-[200px]">저자</TableHead>
            <TableHead className="w-[150px]">출판사</TableHead>
            <TableHead className="w-[120px]">팀</TableHead>
            <TableHead className="w-[120px]">신청자</TableHead>
            <TableHead className="w-[88px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length > 0 ? (
            posts.map((post) => (
              <TableRow key={post.id} onClick={() => handleRowClick(post)} className="cursor-pointer">
                {user?.user_level === Administrator && (
                  <TableCell className="[&:has([role=checkbox])]:pr-auto">
                    <Checkbox
                      checked={selected.includes(post.id)}
                      onCheckedChange={() => toggleOne(post.id, post.status)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={post.status !== '신청'}
                    />
                  </TableCell>
                )}

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
                <TableCell>{formatKST(post.purchaseAt, true)}</TableCell>
                <TableCell className="max-w-[130px] truncate">{post.category}</TableCell>
                <TableCell className="max-w-[400px] truncate">{post.title}</TableCell>
                <TableCell className="max-w-[200px] truncate">{post.author}</TableCell>
                <TableCell className="max-w-[130px] truncate">{post.publish}</TableCell>
                <TableCell>{post.team_name}</TableCell>
                <TableCell>{post.user_name}</TableCell>
                <TableCell>
                  {post.status !== '완료' && post.user === user?.user_id && (
                    <div className="text-gray-700">
                      <Button
                        variant="svgIcon"
                        size="icon"
                        className="hover:text-primary-blue-500"
                        aria-label="수정"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(post);
                        }}>
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="svgIcon"
                        size="icon"
                        className="hover:text-primary-blue-500"
                        aria-label="삭제"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmAction('신청 도서 삭제', '신청도서를 삭제하시겠습니까?', () => handleDelete(post.id));
                        }}>
                        <Delete className="size-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="py-10 text-center text-gray-500">
                {searchQuery ? `‘${searchQuery}’에 대한 검색 결과가 없습니다.` : '등록된 도서가 없습니다.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="p-7" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="mb-3">신청도서 상세보기</DialogTitle>
          </DialogHeader>
          {selectedPost && <BookForm form={selectedPost} mode="view" />}
          <DialogFooter className="mt-5">
            <Button onClick={() => setOpenView(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="p-7" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="mb-3">신청 도서 수정</DialogTitle>
          </DialogHeader>
          {editPost && (
            <BookForm
              form={editPost}
              onChange={(key, value) => setEditPost((prev) => (prev ? { ...prev, [key]: value } : prev))}
              mode="edit"
            />
          )}
          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              취소
            </Button>
            <Button onClick={handleEditUpdateClick}>수정 완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {user?.user_level === Administrator && (
        <div className="mt-5 flex justify-end">
          <Button onClick={handleCompleteClick} variant="outline" size="sm">
            완료 처리
          </Button>
        </div>
      )}

      {/* 공통 다이얼로그 */}
      {/* <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        onConfirm={() => confirmState.action?.()}
      /> */}

      {posts.length > 0 && total > 1 && (
        <div className="mt-5">
          <AppPagination
            totalPages={Math.ceil(total / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={(p) => setPage(p)} //부모 state 업데이트
          />
        </div>
      )}
    </div>
  );
}
