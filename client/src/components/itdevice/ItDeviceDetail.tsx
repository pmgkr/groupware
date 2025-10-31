import { SectionHeader } from '@components/ui/SectionHeader';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import React, { useEffect, useState } from 'react';
import { DeviceForm, type DeviceFormData } from './DeviceForm';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  getItDeviceDetail,
  getMemberList,
  getTeamList,
  registerItDeviceUser,
  updateItDevice,
  updateItDeviceStatus,
  type Device,
  type DeviceHistory,
} from '@/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { formatKST } from '@/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/assets/images/icons';
import { DayPicker } from '../daypicker';

export default function itDeviceDetail() {
  const { id } = useParams<{ id: string }>(); // /itdevice/:id
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectDate, setSelectDate] = useState(formatKST(new Date(), true));

  const date = new Date(selectDate);

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
  const currentUser = history.find((h) => !h.returnedAt);
  const previousUsers = history
    .filter((h) => h.returnedAt) // returnedAt이 존재하면 이전 사용자
    .sort((a, b) => new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime());

  //반납하기
  const handleReturn = async (historyId: number) => {
    const now = new Date().toISOString();

    setHistory((prev) => prev.map((h) => (h.id === historyId ? { ...h, returnedAt: now } : h)));
    try {
      await updateItDeviceStatus(Number(id), '재고');
      setPosts((prev) => (prev ? { ...prev, it_status: '재고' } : prev));

      //console.log('✅ 반납 완료 → 재고 상태로 변경');
    } catch (err) {
      //console.error('❌ 반납 후 상태 변경 실패:', err);
    }
  };

  //dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [openAddUser, setOpenAddUser] = useState(false);

  //등록
  const [form, setForm] = useState<DeviceFormData>({
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

  useEffect(() => {
    if (posts) {
      setForm({
        device: posts.device,
        brand: posts.brand,
        model: posts.model,
        serial: posts.serial,
        os: posts.os,
        ram: posts.ram,
        gpu: posts.gpu,
        storage: posts.storage,
        p_date: posts.p_date,
      });

      if (posts.p_date) {
        setSelectDate(posts.p_date);
      }
    }
  }, [posts]);
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const dto = { ...form, it_seq: Number(id) };
      await updateItDevice(dto);

      setPosts((prev) => (prev ? { ...prev, ...form } : prev));
    } catch (err) {
      console.error('❌ 장비 정보 수정 실패:', err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  //사용자 추가
  const [teams, setTeams] = useState<{ team_id: number; team_name: string }[]>([]);
  const [newForm, setNewForm] = useState({
    team_id: '',
    team_name: '',
    user: '',
    user_id: '',
    createdAt: '',
  });
  //팀 목록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await getTeamList();
        setTeams(res);
      } catch (err) {
        console.error('❌ 팀 목록 불러오기 실패:', err);
      }
    })();
  }, []);

  const handleNewFormChange = (key: string, value: string | number) => {
    setNewForm((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };
  // 이름 입력 시 자동으로 user_id 조회
  useEffect(() => {
    if (!newForm.user) return;
    const fetchUserId = async () => {
      try {
        const res = await getMemberList();
        // 이름이 일치하는 사용자 찾기 (team_id 일치 시 필터 강화 가능)
        const matched = res.find((m) => m.user_name === newForm.user);

        if (matched) {
          handleNewFormChange('user_id', matched.user_id);
        } else {
          handleNewFormChange('user_id', '');
        }
      } catch (err) {
        console.error('❌ 사용자 목록 조회 실패:', err);
      }
    };
    fetchUserId();
  }, [newForm.user]);

  useEffect(() => {
    if (openAddUser) {
      const today = formatKST(new Date(), true);
      setSelectDate(today);
      handleNewFormChange('createdAt', today);
    }
  }, [openAddUser]);

  //사용자 등록 클릭
  const handleAddUserClick = async () => {
    if (!newForm.team_id || !newForm.user) {
      alert('팀과 사용자를 입력해주세요.');
      return;
    }
    const finalDate = newForm.createdAt && newForm.createdAt.trim() !== '' ? newForm.createdAt : new Date().toISOString().slice(0, 10);
    try {
      await registerItDeviceUser({
        it_seq: Number(id),
        ih_user_id: newForm.user_id,
        ih_user_name: newForm.user,
        ih_team_id: newForm.team_id,
        ih_created_at: finalDate,
      });
      // 사용자 등록 시 it_status = '사용'으로 변경
      /* await updateItDeviceStatus(Number(id), '사용');
      setPosts((prev) => (prev ? { ...prev, it_status: '사용' } : prev)); */
      //console.log(newForm);
      const updated = await getItDeviceDetail(Number(id));
      setHistory(updated.history);
      setOpenAddUser(false);
    } catch (err) {
      console.error('❌ 사용자 등록 실패:', err);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  function formatDate(isoString: string | null) {
    if (!isoString) return '';
    return isoString.slice(0, 10); // 'YYYY-MM-DD'
  }
  // 컨펌 다이얼로그상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    action?: () => void;
    title: string;
  }>({ open: false, title: '' });

  const openConfirm = (title: string, action: () => void) => {
    setConfirmState({ open: true, title, action });
  };

  if (!posts) return <div className="p-4">장비를 찾을 수 없습니다.</div>;

  return (
    <>
      <h2 className="pt-3 text-3xl font-bold">
        [{posts?.device ?? '-'}] {posts?.model ?? '-'}
      </h2>
      <div className="flex gap-8">
        <div className="flex-1 p-6 pl-0">
          {/* 수정버튼 dialog */}
          <Dialog
            open={openEdit}
            onOpenChange={(open) => {
              if (confirmState.open) return;
              setOpenEdit(open);
            }}
            modal={false}>
            <div className="mb-4 flex items-center justify-between border-b border-b-gray-300 pb-1.5">
              <SectionHeader title="장비 정보" className="mb-0 border-0" />
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
                  onClick={() => {
                    openConfirm('장비 정보를 수정하시겠습니까?', () => handleSave());
                  }}>
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
        <div className="flex-1 p-6">
          <Dialog open={openAddUser} onOpenChange={setOpenAddUser} modal={false}>
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
                  <TableColumnCell className="p-0">
                    <Select
                      value={String(newForm.team_id || '')}
                      onValueChange={(value) => {
                        const team = teams.find((t) => String(t.team_id) === value);
                        handleNewFormChange('team_id', Number(value));
                        handleNewFormChange('team_name', team?.team_name || '');
                      }}>
                      <SelectTrigger className="w-full border-0 bg-transparent shadow-none">
                        <SelectValue placeholder="팀선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.team_id} value={String(team.team_id)}>
                            {team.team_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableColumnCell>
                  <TableColumnCell>
                    <input type="text" onChange={(e) => handleNewFormChange('user', e.target.value)} />
                  </TableColumnCell>
                  <TableColumnCell className="p-0">
                    <Popover open={open} onOpenChange={setOpen}>
                      <div className="relative">
                        <PopoverTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-[45px] w-full rounded-none border-0 px-5 text-left font-normal text-gray-900 shadow-none">
                            <Calendar className="ml-auto size-4.5 opacity-50" />
                            {selectDate}
                          </Button>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DayPicker
                          captionLayout="dropdown"
                          mode="single"
                          selected={date}
                          onSelect={(d) => {
                            if (!d) return;
                            setSelectDate(formatKST(d, true));
                            handleNewFormChange('createdAt', formatKST(d, true));
                            setOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
        onConfirm={async () => {
          await confirmState.action?.(); // handleSave 실행
          setConfirmState((prev) => ({ ...prev, open: false }));
          setOpenEdit(false); // 여기서 수정 다이얼로그 닫기
        }}
      />
    </>
  );
}
