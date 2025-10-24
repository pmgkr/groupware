import { SectionHeader } from '@components/ui/SectionHeader';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import React, { useEffect, useState } from 'react';
import { DeviceForm, type DeviceFormData } from './DeviceForm';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Textbox } from '../ui/textbox';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { getItDeviceDetail, type Device, type DeviceHistory } from '@/api';

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

  const [posts, setPosts] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceHistory[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getItDeviceDetail(Number(id));
        setPosts(data.device);
        setHistory(data.history);
      } catch (err) {
        console.error('❌ 디바이스 상세 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  //사용이력
  // 현재 장비

  const deviceHistories = history;
  const currentUser = history.find((h) => !h.returnedAt);
  //const currentUser = deviceHistories.find((h) => h.returnedAt === null);
  const previousUsers = history
    .filter((h) => h.returnedAt) // returnedAt이 존재하면 이전 사용자
    .sort((a, b) => new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime());

  //반납하기
  const handleReturn = (historyId: number) => {
    const now = new Date().toISOString();
    setHistory((prev) => prev.map((h) => (h.id === historyId ? { ...h, returnedAt: now } : h)));
  };

  //dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [openAddUser, setOpenAddUser] = useState(false);

  const [form, setForm] = useState<DeviceFormData>({
    device: '',
    brand: '',
    model: '',
    serial: '',
    p_date: '',
  });

  useEffect(() => {
    if (posts) {
      setForm({
        device: posts.device,
        brand: posts.brand,
        model: posts.model,
        serial: posts.serial,
        p_date: posts.p_date,
      });
    }
  }, [posts]);
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  /* const handleSave = () => {
    // posts 배열에서 해당 id를 찾아 업데이트
    setPosts((prev) => prev.map((p) => (p.id === posts.id ? { ...p, ...form } : p)));
    setOpenEdit(false);
  }; */

  //사용자 추가
  const [newForm, setNewForm] = useState({
    team: '',
    user: '',
    createdAt: new Date().toISOString().slice(0, 10),
  });

  // 컨펌 다이얼로그상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action?: () => void;
    title: string;
  }>({ open: false, title: '' });

  if (!posts) return <div className="p-4">장비를 찾을 수 없습니다.</div>;

  // 공용 핸들러
  const handleNewFormChange = (key: keyof typeof newForm, value: string) => {
    setNewForm((prev) => ({ ...prev, [key]: value }));
  };
  const handleAddUserClick = () => {
    if (!newForm.team || !newForm.user) {
      alert('팀이름과 사용자는 반드시 입력해야 합니다.');
      return;
    }
    openConfirm('사용자를 등록하시겠습니까?', () => handleAddUser(posts.id, newForm.user, newForm.team, newForm.createdAt));
  };
  const handleAddUser = (deviceId: number, user: string, team: string, createdAt?: string) => {
    /* setHistory((prev) => {
      const now = new Date().toISOString();

      // 현재 사용자(반납 안 한 사람) 찾기
      const current = prev.find((h) => h.id === deviceId && h.returnedAt === null);

      let updated = prev;
      if (current) {
        // 반납 처리
        updated = prev.map((h) => (h.id === current.id ? { ...h, returnedAt: now } : h));
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
    }); */

    setOpenAddUser(false); // 다이얼로그 닫기
  };

  function formatDate(isoString: string | null) {
    if (!isoString) return '';
    return isoString.slice(0, 10); // 'YYYY-MM-DD'
  }

  // 열기 함수
  const openConfirm = (title: string, action: () => void) => {
    setConfirmState({ open: true, title, action });
  };

  return (
    <>
      <h2 className="mb-5 text-3xl font-bold">
        [{posts?.device ?? '-'}] {posts?.model ?? '-'}
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
              <DeviceForm form={form} onChange={handleChange} mode="edit" />

              <DialogFooter className="mt-5">
                <Button variant="outline" onClick={() => setOpenEdit(false)}>
                  취소
                </Button>
                <Button
                /* onClick={() => {
                    openConfirm('장비 정보를 수정하시겠습니까?', () => handleSave());
                  }} */
                >
                  완료
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {posts ? (
            <DeviceForm form={posts} onChange={() => {}} mode="view" />
          ) : (
            <div className="text-sm text-gray-500">장비 정보를 불러오는 중...</div>
          )}
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
                <Button onClick={handleAddUserClick}>완료</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div>
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
                  <div key={h.id} className="flex items-center justify-between rounded border p-3">
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
              openConfirm('반납처리 하시겠습니까?', () => handleReturn(currentUser.id));
            }}>
            반납 처리
          </Button>
        )}
        <Button onClick={() => navigate('/itdevice')}>목록</Button>
      </div>

      {/* 공통 다이얼로그 */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        onConfirm={() => confirmState.action?.()}
      />
    </>
  );
}
