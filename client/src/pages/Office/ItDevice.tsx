import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate, Outlet } from 'react-router';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { DeviceForm } from '@/components/itdevice/DeviceForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getItDevice, registerItDevice, type Device } from '@/api/office/itdevice';
import { useAuth } from '@/contexts/AuthContext';
import { createPortal } from 'react-dom';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { OctagonAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ItDevice() {
  const navigate = useNavigate();
  const { user } = useAuth();

  //   페이지네이션 상태
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const [posts, setPosts] = useState<Device[]>([]);

  //   리스트 불러오기 (페이지 변경 시 실행)
  const fetchDevices = async (pageNum: number, query = '') => {
    try {
      const res = await getItDevice(pageNum, pageSize, query);
      setPosts(res.items);
      setTotal(res.total);
      setTotalPages(res.pages);
    } catch (err) {
      console.error('❌ IT Device 불러오기 실패:', err);
    } finally {
    }
  };

  useEffect(() => {
    fetchDevices(page, activeQuery);
  }, [page, activeQuery]);

  const handleSearch = () => {
    setPage(1);
    setActiveQuery(searchQuery.trim());
  };

  // 등록 다이얼로그 열기/닫기
  const [openRegister, setOpenRegister] = useState(false);

  // 새 장비 등록 폼
  const [form, setForm] = useState({
    device: '',
    brand: '',
    model: '',
    serial: '',
    os: '',
    ram: '',
    gpu: '',
    storage: '',
    p_date: '',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 등록 유효성 검사
  const { addAlert } = useAppAlert();
  const handleRegisterClick = () => {
    if (!form.device || !form.brand || !form.model || !form.serial || !form.p_date) {
      addAlert({
        message: '디바이스, 브랜드, 모델, 시리얼넘버, 구매일자는 반드시 입력해야 합니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }
    openConfirm('장비 정보를 등록하시겠습니까?', handleRegister);
  };

  // 등록
  const handleRegister = async () => {
    try {
      await registerItDevice({
        it_device: form.device,
        it_brand: form.brand,
        it_model: form.model,
        it_serial: form.serial,
        os: form.os,
        ram: form.ram,
        gpu: form.gpu,
        storage: form.storage,
        it_date: form.p_date,
        it_status: '재고',
      });
      setOpenRegister(false);
      setForm({
        device: '',
        brand: '',
        model: '',
        serial: '',
        os: '',
        ram: '',
        gpu: '',
        storage: '',
        p_date: '',
      });
      fetchDevices(page); // 목록 새로고침
    } catch (err) {
      console.error('❌ 장비 등록 실패:', err);
      alert('장비 등록 중 오류가 발생했습니다.');
    }
  };

  // 컨펌 다이얼로그
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action?: () => void;
    title: string;
  }>({ open: false, title: '' });

  const openConfirm = (title: string, action: () => void) => {
    setConfirmState({ open: true, title, action });
  };

  return (
    <div>
      {/* 검색 + 등록 */}
      <div className="flex justify-end gap-3">
        <div className="relative mb-4 w-[175px]">
          <Input
            className="h-[32px] px-4 [&]:bg-white"
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

        {/* 등록 다이얼로그 */}
        <Dialog
          open={openRegister}
          onOpenChange={(open) => {
            if (confirmState.open) return;
            setOpenRegister(open);
          }}
          modal={false}>
          <DialogTrigger asChild>
            <Button size="sm">등록하기</Button>
          </DialogTrigger>
          <DialogContent className="p-7">
            <DialogHeader>
              <DialogTitle className="mb-3">장비 정보 등록</DialogTitle>
            </DialogHeader>
            <DeviceForm form={form} onChange={handleChange} mode="create" />
            <DialogFooter className="mt-5">
              <Button variant="outline" onClick={() => setOpenRegister(false)}>
                취소
              </Button>
              <Button onClick={handleRegisterClick}>완료</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 테이블 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">번호</TableHead>
            <TableHead>디바이스</TableHead>
            <TableHead>브랜드</TableHead>
            <TableHead className="w-[300px]">모델</TableHead>
            <TableHead className="w-[300px]">시리얼넘버</TableHead>
            <TableHead>사용자</TableHead>
            <TableHead>구매일자</TableHead>
            {/* <TableHead>등록일</TableHead> */}
          </TableRow>
        </TableHeader>

        <TableBody>
          {posts.length > 0 ? (
            posts.map((post, idx) => (
              <TableRow key={post.id} onClick={() => navigate(`${post.id}`)} className="cursor-pointer hover:bg-gray-100">
                <TableCell>{total - (page - 1) * pageSize - idx}</TableCell>
                <TableCell>{post.device}</TableCell>
                <TableCell>{post.brand}</TableCell>
                <TableCell>{post.model}</TableCell>
                <TableCell>{post.serial}</TableCell>
                <TableCell>
                  {post.it_status === '재고' ? (
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                      재고
                    </Badge>
                  ) : (
                    post.user || <span className="text-gray-500 italic">-</span>
                  )}
                </TableCell>
                <TableCell>{post.p_date}</TableCell>
                {/* <TableCell>{post.createdAt}</TableCell> */}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-gray-400">
                {activeQuery ? `‘${activeQuery}’에 대한 검색 결과가 없습니다.` : '등록된 장비가 없습니다.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션 */}
      {posts.length > 0 && (
        <div className="mt-5">
          <AppPagination totalPages={totalPages} initialPage={page} visibleCount={5} onPageChange={(newPage) => setPage(newPage)} />
        </div>
      )}

      {/* 공통 다이얼로그 */}
      {createPortal(
        <ConfirmDialog
          open={confirmState.open}
          onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
          title={confirmState.title}
          onConfirm={() => confirmState.action?.()}
        />,
        document.body
      )}

      <Outlet />
    </div>
  );
}
