import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Badge } from '@components/ui/badge';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate, Outlet } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { DeviceForm } from '@/components/itdevice/DeviceForm';

export default function ItDevice() {
  const navigate = useNavigate();
  // 더미 데이터
  const [posts, setPosts] = useState([
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
      device: 'Monitor',
      brand: 'LG',
      model: 'LED Monitor',
      serial: '203NTEPCT052',
      purchaseAt: '2025-06-01',
      createdAt: '2025-06-02',
      user: '이영서',
    },
  ]);

  //등록 다이얼로그 열기/닫기
  const [openRegister, setOpenRegister] = useState(false);

  //새로운 디바이스 등록
  const [form, setForm] = useState({
    device: '',
    brand: '',
    model: '',
    serial: '',
    os: '',
    ram: '',
    gpu: '',
    ssdhdd: '',
    purchaseAt: '',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  // 등록 완료
  const handleRegister = () => {
    if (!form.device || !form.brand || !form.model || !form.serial || !form.purchaseAt) {
      alert('디바이스, 브랜드, 모델, 시리얼넘버, 구매일자는 반드시 입력해야 합니다.');
      return;
    }
    const nextId = posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1;

    const newDevice = {
      id: nextId,
      device: form.device,
      brand: form.brand,
      model: form.model,
      serial: form.serial,
      os: form.os,
      ram: form.ram,
      gpu: form.gpu,
      ssdhdd: form.ssdhdd,
      purchaseAt: form.purchaseAt,
      createdAt: new Date().toLocaleDateString('sv-SE'), // YYYY-MM-DD
      user: '윤도운', // 기본값
    };

    setPosts((prev) => [newDevice, ...prev]); // 최신순 추가

    // form 초기화
    setForm({
      device: '',
      brand: '',
      model: '',
      serial: '',
      os: '',
      ram: '',
      gpu: '',
      ssdhdd: '',
      purchaseAt: '',
    });

    setOpenRegister(false); // 다이얼로그 닫기
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

        {/* 등록 다이얼로그 */}
        <Dialog open={openRegister} onOpenChange={setOpenRegister}>
          <DialogTrigger asChild>
            <Button>등록하기</Button>
          </DialogTrigger>
          <DialogContent className="p-7">
            <DialogHeader>
              <DialogTitle className="mb-3">장비 정보 등록</DialogTitle>
            </DialogHeader>

            <DeviceForm form={form} onChange={handleChange} mode="create"></DeviceForm>

            <DialogFooter className="mt-5">
              <Button variant="outline" onClick={() => setOpenRegister(false)}>
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
            <TableRow key={post.id} onClick={() => navigate(`${post.id}`)} className="cursor-pointer hover:bg-gray-100">
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
      <Outlet />
    </div>
  );
}
