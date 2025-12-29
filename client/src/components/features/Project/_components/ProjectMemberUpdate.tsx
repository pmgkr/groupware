// /Project/_components/ProjectMemberUpdate.tsx
import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { getProfileImageUrl, getAvatarFallback } from '@/utils';
import { ProjectMember } from './ProjectMember';
import { MemberSelect, type Member } from '@components/common/MemberSelect';
import { type ProjectMemberDTO } from '@/api';
import { notificationApi } from '@/api/notification';
import { updateProjectMember, type ProjectMemberUpdatePayload } from '@/api/project';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Badge } from '@components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { ArrowRightLeft, X, Plus, OctagonAlert } from 'lucide-react';

interface Props {
  open: boolean;
  projectId: string;
  projectTitle: string;
  members: ProjectMemberDTO[];
  ownerId: string;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}

export function ProjectMemberUpdate({ open, projectId, projectTitle, members, ownerId, onOpenChange, onSuccess }: Props) {
  const { user_id } = useUser();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [currentMembers, setCurrentMembers] = useState<ProjectMemberDTO[]>(members);
  const owner = useMemo(() => currentMembers.find((m) => m.user_type === 'owner'), [currentMembers]);
  const [newOwner, setNewOwner] = useState<Member | null>(null);

  const [addMembers, setAddMembers] = useState<Member[]>([]);
  const [addMemberIds, setAddMemberIds] = useState<string[]>([]);
  const [removeMemberIds, setRemoveMemberIds] = useState<string[]>([]);

  type DialogMode = 'add-member' | 'change-owner';
  const [dialogMode, setDialogMode] = useState<DialogMode>('add-member'); // Dialog Mode State
  const [openSelectDialog, setOpenSelectDialog] = useState(false); // Dialog Open State

  useEffect(() => {
    if (open) {
      setCurrentMembers(members);
      setNewOwner(null);
      setAddMembers([]);
      setRemoveMemberIds([]);
    }
  }, [open]);

  useEffect(() => {
    setAddMemberIds(addMembers.map((m) => m.user_id));
  }, [addMembers]);

  const handleConfirm = () => {
    if (dialogMode === 'add-member') {
      handleAdd();
    }

    if (dialogMode === 'change-owner') {
      addDialog({
        title: '오너 변경',
        message: `
          프로젝트 오너를 변경하시겠습니까?<br/>
          기존 오너는 일반 멤버로 변경됩니다.
        `,
        confirmText: '변경',
        cancelText: '취소',
        onConfirm: () => handleOwnerChange(),
      });
    }

    console.log('현재 멤버', currentMembers);
    setOpenSelectDialog(false);
  };

  const handleOwnerChange = () => {
    if (!newOwner) return;

    const selectedId = newOwner.user_id;

    setCurrentMembers((prev) => {
      let selectedMember: ProjectMemberDTO | null = null;

      // 1. 기존 멤버 or 초기 members에서 정보 찾기
      const source = prev.find((m) => m.user_id === selectedId) ?? members.find((m) => m.user_id === selectedId);

      if (source) {
        selectedMember = {
          ...source,
          user_type: 'owner',
        };
      } else {
        // 혹시나 둘 다 없을 경우 (거의 없음)
        selectedMember = {
          seq: Date.now(),
          user_id: newOwner.user_id,
          user_nm: newOwner.user_name,
          profile_image: newOwner.profile_image,
          user_type: 'owner',
        };
      }

      // 2. 기존 owner → member
      const next = prev
        .map((m) => (m.user_type === 'owner' ? { ...m, user_type: 'member' } : m))
        // 3. 기존 selected 제거
        .filter((m) => m.user_id !== selectedId);

      // 4. owner로 재삽입
      return [selectedMember, ...next];
    });

    console.log(selectedId, currentMembers, newOwner);

    // 삭제 대상에서 제외
    setRemoveMemberIds((prev) => prev.filter((id) => id !== selectedId));
    setNewOwner(newOwner);
  };

  const handleAdd = () => {
    if (addMembers.length === 0) return;

    // 1. 화면에 멤버 추가
    setCurrentMembers((prev) => {
      const existingIds = new Set(prev.map((m) => m.user_id));

      const newlyAdded: ProjectMemberDTO[] = addMembers
        .filter((m) => !existingIds.has(m.user_id))
        .map((m, idx) => ({
          seq: Date.now() + idx,
          project_id: projectId,
          user_id: m.user_id,
          user_nm: m.user_name,
          profile_image: m.profile_image,
          user_type: 'member',
        }));

      return [...prev, ...newlyAdded];
    });

    // 2. 삭제했다가 다시 추가한 경우 → 삭제 취소
    setRemoveMemberIds((prev) => prev.filter((id) => !addMemberIds.includes(id)));
  };

  const handleRemove = (member: ProjectMemberDTO) => {
    setCurrentMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));

    // 기존 멤버 → 삭제 예정
    if (members.some((m) => m.user_id === member.user_id)) {
      setRemoveMemberIds((prev) => (prev.includes(member.user_id) ? prev : [...prev, member.user_id]));
    } else {
      // 새로 추가한 멤버 → addMembers에서 제거
      setAddMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
    }
  };

  const handleMemberSave = async () => {
    const payload: ProjectMemberUpdatePayload = {
      ...(newOwner && {
        owner: {
          user_id: newOwner.user_id,
          user_nm: newOwner.user_name,
        },
      }),

      ...(addMembers.length > 0 && {
        member_add: addMembers.map((m) => ({
          user_id: m.user_id,
          user_nm: m.user_name,
        })),
      }),

      ...(removeMemberIds.length > 0 && {
        member_remove: removeMemberIds.map((user_id) => ({
          user_id,
        })),
      }),
    };

    try {
      const res = await updateProjectMember(projectId, payload);

      if (res.ok) {
        if (payload.owner) {
          if (payload.owner) {
            const notifications = currentMembers.map((m) =>
              notificationApi.registerNotification({
                user_id: m.user_id,
                user_name: m.user_nm,
                noti_target: user_id!,
                noti_title: projectTitle,
                noti_message: `${payload.owner?.user_nm}님이 프로젝트 오너로 변경되었습니다.`,
                noti_type: 'project',
                noti_url: `/project/${projectId}`,
              })
            );

            if (notifications.length > 0) {
              await Promise.all(notifications);
            }
          }
        }

        addAlert({
          title: '멤버 변경',
          message: '프로젝트 멤버가 성공적으로 변경되었습니다.',
          icon: <OctagonAlert />,
          duration: 1500,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('멤버 변경 실패', err);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>프로젝트 멤버 관리</DialogTitle>
            <DialogDescription className="leading-[1.3] break-keep">
              프로젝트 오너를 변경하거나, 멤버를 추가 및 삭제 할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-1">
            <div className="mt-1 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-primary-blue-500 hover:text-primary-blue-500 hover:bg-transparent"
                onClick={() => {
                  setDialogMode('add-member');
                  setOpenSelectDialog(true);
                }}>
                <Plus className="size-3.5" />
                멤버 추가
              </Button>
            </div>
            {owner && (
              <div className="relative mb-4 flex items-center gap-2.5 pr-6">
                <ProjectMember member={owner} />
                <Button
                  type="button"
                  variant="svgIcon"
                  className="absolute top-0 right-0 h-full w-5 text-gray-500 hover:text-gray-700 has-[>svg]:p-0"
                  onClick={() => {
                    setDialogMode('change-owner');
                    setOpenSelectDialog(true);
                  }}>
                  <ArrowRightLeft className="size-3" />
                </Button>
              </div>
            )}

            <div className="max-h-[49vh] overflow-y-auto">
              <ul className="flex flex-col gap-4">
                {currentMembers
                  .filter((m) => m.user_type === 'member')
                  .map((m) => (
                    <li key={m.seq} className="relative flex items-center gap-2.5 pr-5">
                      <ProjectMember member={m} />
                      <Button
                        type="button"
                        variant="svgIcon"
                        className="absolute top-0 right-0 h-full w-5 text-gray-500 hover:text-gray-700 has-[>svg]:p-0"
                        onClick={() => handleRemove(m)}>
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                handleMemberSave();
              }}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openSelectDialog} onOpenChange={setOpenSelectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add-member' ? '멤버 추가' : '오너 변경'}</DialogTitle>
          </DialogHeader>

          <MemberSelect
            value={dialogMode === 'add-member' ? addMembers : newOwner ? [newOwner] : []}
            onChange={(v) => {
              if (dialogMode === 'add-member') {
                setAddMembers(v);
              } else {
                setNewOwner(v[0] ?? null);
              }
            }}
            currentUserId={user_id}
            excludeUserIds={
              dialogMode === 'change-owner' ? currentMembers.filter((m) => m.user_type === 'owner').map((m) => m.user_id) : []
            }
            mode={dialogMode === 'change-owner' ? 'single' : 'multiple'}
            resetOnTeamChange={dialogMode === 'change-owner'}
          />

          <ul className="mt-2 flex flex-wrap gap-2">
            {dialogMode === 'add-member' &&
              addMembers.map((m) => (
                <li key={m.user_id}>
                  <Badge variant="grayish" className="flex items-center gap-1 px-2 py-1">
                    <Avatar className="size-5">
                      <AvatarImage src={getProfileImageUrl(m.profile_image)} />
                      <AvatarFallback className="text-xs">{getAvatarFallback(m.user_id)}</AvatarFallback>
                    </Avatar>
                    {m.user_name}
                    <button
                      type="button"
                      onClick={() => {
                        setAddMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
                      }}>
                      ✕
                    </button>
                  </Badge>
                </li>
              ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button type="button" onClick={handleConfirm}>
                확인
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
