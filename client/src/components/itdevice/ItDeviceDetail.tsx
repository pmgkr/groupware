import { SectionHeader } from '@components/ui/SectionHeader';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textbox } from '@/components/ui/textbox';
import { Textarea } from '@/components/ui/textarea';
import React, { useEffect, useState } from 'react';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

export default function itDeviceDetail() {
  const { id } = useParams<{ id: string }>(); // /itdevice/:id
  const navigate = useNavigate();

  type Post = {
    id: number;
    device: string;
    brand: string;
    model: string;
    serial: string;
    os: string;
    ram: string;
    gpu: string;
    ssdhdd: string;
    purchaseAt: string;
    createdAt: string;
    user: string;
  };

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 4,
      device: 'Monitor',
      brand: 'SONY',
      model: 'sony monitor model name',
      serial: '12345687',
      os: '',
      ram: '',
      gpu: '',
      ssdhdd: '',
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
      os: 'Windows 11 Business',
      ram: '16.0GB',
      gpu: '-',
      ssdhdd: 'ssdhdd',
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
      os: '',
      ram: '',
      gpu: '',
      ssdhdd: '',
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
      os: '',
      ram: '',
      gpu: '',
      ssdhdd: '',
      purchaseAt: '2025-06-01',
      createdAt: '2025-06-02',
      user: '이영서',
    },
  ]);

  const [history, setHistory] = useState([
    {
      historyId: 101,
      deviceId: 4, // device.id와 연결
      user: '구경이',
      team: 'CCD',
      createdAt: '2024-04-05',
      returnedAt: '2025-05-29',
    },
    {
      historyId: 102,
      deviceId: 4,
      user: '빙홍차',
      team: 'CCP',
      createdAt: '2025-09-02',
      returnedAt: null,
    },
    {
      historyId: 103,
      deviceId: 1,
      user: '이영서',
      team: 'CCD',
      createdAt: '2025-06-02',
      returnedAt: null,
    },
    {
      historyId: 104,
      deviceId: 2,
      user: '유승호',
      team: 'CCD',
      createdAt: '2025-07-02',
      returnedAt: null,
    },
    {
      historyId: 105,
      deviceId: 3,
      user: '김원필',
      team: 'CCP',
      createdAt: '2025-08-02',
      returnedAt: null,
    },
  ]);

  //사용이력
  // 현재 장비
  const post = posts.find((p) => String(p.id) === id);
  if (!post) return <div className="p-4">장비를 찾을 수 없습니다.</div>;

  const deviceHistories = history.filter((h) => String(h.deviceId) === id);
  const currentUser = deviceHistories.find((h) => h.returnedAt === null);
  const previousUsers = history
    .filter((h) => h.deviceId === post.id && h.returnedAt !== null)
    .sort((a, b) => new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime());

  //반납하기
  const handleReturn = (historyId: number) => {
    const now = new Date().toISOString();
    setHistory((prev) => prev.map((h) => (h.historyId === historyId ? { ...h, returnedAt: now } : h)));
  };

  //dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [openAddUser, setOpenAddUser] = useState(false);
  const [form, setForm] = React.useState({
    device: post.device,
    brand: post.brand,
    model: post.model,
    serial: post.serial,
    purchaseAt: post.purchaseAt,
  });
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const handleSave = () => {
    // posts 배열에서 해당 id를 찾아 업데이트
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...form } : p)));
    setOpenEdit(false);
  };

  //사용자 추가
  const [newForm, setNewForm] = useState({
    team: '',
    user: '',
    createdAt: new Date().toISOString().slice(0, 10),
  });
  // 공용 핸들러
  const handleNewFormChange = (key: keyof typeof newForm, value: string) => {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };
  const handleAddUser = (deviceId: number, user: string, team: string, createdAt?: string) => {
    setHistory((prev) => {
      const now = new Date().toISOString();

      // 현재 사용자(반납 안 한 사람) 찾기
      const current = prev.find((h) => h.deviceId === deviceId && h.returnedAt === null);

      let updated = prev;
      if (current) {
        // 반납 처리
        updated = prev.map((h) => (h.historyId === current.historyId ? { ...h, returnedAt: now } : h));
      }

      // 새 사용자 추가
      const newHistory = {
        historyId: Date.now(),
        deviceId,
        user,
        team,
        createdAt: newForm.createdAt,
        returnedAt: null,
      };

      return [...updated, newHistory];
    });

    setOpenAddUser(false); // 다이얼로그 닫기
  };

  function formatDate(isoString: string | null) {
    if (!isoString) return '';
    return isoString.slice(0, 10); // 'YYYY-MM-DD'
  }

  return (
    <>
      <h2 className="mb-5 text-3xl font-bold">
        [{post.device}] {post.model}
      </h2>
      <div className="flex gap-8">
        <div className="flex-1 rounded-md border p-8">
          {/* 수정버튼 dialog */}
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <div className="mb-4 flex items-center justify-between border-b border-b-gray-300 pb-1.5">
              <SectionHeader title="장비 정보" className="mb-0 border-0" />
              {/* 다이얼로그 버튼은 DialogTrigger로 감싸기 */}
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  수정
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="p-7 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="mb-3">장비 정보 수정</DialogTitle>
              </DialogHeader>
              <TableColumn>
                <TableColumnHeader className="text-base">
                  <TableColumnHeaderCell>디바이스</TableColumnHeaderCell>
                  <TableColumnHeaderCell>브랜드</TableColumnHeaderCell>
                  <TableColumnHeaderCell>모델</TableColumnHeaderCell>
                  <TableColumnHeaderCell>시리얼넘버</TableColumnHeaderCell>
                  <TableColumnHeaderCell>구매일자</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody className="text-base">
                  <TableColumnCell>
                    <input type="text" value={form.device} onChange={(e) => handleChange('device', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell>
                    <input type="text" value={form.brand} onChange={(e) => handleChange('brand', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell>
                    <input type="text" value={form.model} onChange={(e) => handleChange('model', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell>
                    <input type="text" value={form.serial} onChange={(e) => handleChange('serial', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell className="p-0">
                    <Textbox
                      id="entryDate"
                      type="date"
                      className="w-full justify-start border-0"
                      value={form.purchaseAt}
                      onChange={(e) => handleChange('purchaseAt', e.target.value)}
                    />
                  </TableColumnCell>
                </TableColumnBody>
              </TableColumn>
              <DialogFooter className="mt-5">
                <Button variant="outline" onClick={() => setOpenEdit(false)}>
                  취소
                </Button>
                <Button onClick={handleSave}>완료</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex">
            <ul className="border-r pr-6 text-base leading-10">
              <li>디바이스</li>
              <li>브랜드</li>
              <li>모델</li>
              <li>시리얼넘버</li>
              {post.device === 'Laptop' && post.os && <li>OS</li>}
              {post.device === 'Laptop' && post.ram && <li>RAM</li>}
              {post.device === 'Laptop' && post.gpu && <li>GPU</li>}
              {post.device === 'Laptop' && post.ssdhdd && <li>SSD-HDD</li>}
              <li>구매일자</li>
            </ul>
            <ul className="pl-8 text-base leading-10">
              <li>{post.device}</li>
              <li>{post.brand}</li>
              <li>{post.model}</li>
              <li>{post.serial}</li>
              {post.device === 'Laptop' && post.os && <li>{post.os}</li>}
              {post.device === 'Laptop' && post.ram && <li>{post.ram}</li>}
              {post.device === 'Laptop' && post.gpu && <li>{post.gpu}</li>}
              {post.device === 'Laptop' && post.ssdhdd && <li>{post.ssdhdd}</li>}
              <li>{post.purchaseAt}</li>
            </ul>
          </div>
        </div>

        <div className="flex-1 rounded-md border p-8">
          <Dialog open={openAddUser} onOpenChange={setOpenAddUser}>
            <div className="mb-4 flex items-center justify-between border-b border-b-gray-300 pb-1.5">
              <SectionHeader title="사용이력" className="mb-0 border-0" />
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  사용자 등록
                </Button>
              </DialogTrigger>
            </div>
            <DialogContent className="p-7 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="mb-3">사용자 등록</DialogTitle>
              </DialogHeader>
              <TableColumn>
                <TableColumnHeader className="text-base">
                  <TableColumnHeaderCell>팀이름</TableColumnHeaderCell>
                  <TableColumnHeaderCell>이름</TableColumnHeaderCell>
                  <TableColumnHeaderCell>등록일자</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody className="text-base">
                  <TableColumnCell>
                    <input type="text" onChange={(e) => handleNewFormChange('team', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell>
                    <input type="text" onChange={(e) => handleNewFormChange('user', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell className="p-0">
                    <Textbox
                      id="entryDate"
                      type="date"
                      className="w-full justify-start border-0"
                      value={newForm.createdAt}
                      onChange={(e) => handleNewFormChange('createdAt', e.target.value)}
                    />
                  </TableColumnCell>
                </TableColumnBody>
              </TableColumn>
              <DialogFooter className="mt-5">
                <Button variant="outline" onClick={() => setOpenAddUser(false)}>
                  취소
                </Button>
                <Button
                  onClick={() => {
                    if (window.confirm('사용자를 등록하시겠습니까?')) {
                      handleAddUser(post.id, newForm.user, newForm.team, newForm.createdAt);
                    }
                  }}>
                  완료
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="">
            {/* 현재 사용자 */}
            {currentUser && (
              <div className="border-primary-blue-300 bg-primary-blue-100 mb-4 flex items-center justify-between rounded border p-3">
                <div className="flex items-center text-base font-medium">
                  {currentUser.user} <span className="pl-1 text-sm text-gray-500">({currentUser.team})</span>
                  <Badge className="ml-2 bg-[#FF6B6B]">현재 사용중</Badge>
                </div>

                <div className="text-sm text-gray-600">시작일: {currentUser.createdAt}</div>
              </div>
            )}

            {/* 이전 사용자들 */}
            {previousUsers.length > 0 ? (
              <div className="space-y-2">
                {previousUsers.map((h) => (
                  <div key={h.historyId} className="flex items-center justify-between rounded border p-3">
                    <div className="text-base font-medium">
                      {h.user} <span className="text-sm text-gray-500">({h.team})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(h.createdAt)} ~ {formatDate(h.returnedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500"></p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 text-right">
        {currentUser && (
          <Button
            variant="secondary"
            className="mr-3"
            onClick={() => {
              if (window.confirm('반납처리 하시겠습니까?')) {
                handleReturn(currentUser.historyId);
              }
            }}>
            반납 처리
          </Button>
        )}
        <Button onClick={() => navigate('/itdevice')}>목록</Button>
      </div>
    </>
  );
}
