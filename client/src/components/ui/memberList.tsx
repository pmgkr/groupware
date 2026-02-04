import { useMemo, useState } from 'react';
import { Ellipsis, Mail, Phone } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { getAvatarFallback, getImageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { updateMemberStatus } from '@/api/manager/member';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { Pin, Manager } from '@/assets/images/icons';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { CheckCircle, OctagonAlert } from 'lucide-react';

const STATUS_BADGE_MAP = {
  inactive: {
    label: '비활성화',
    className: 'bg-gray-400',
  },
  suspended: {
    label: '휴직중',
    className: 'bg-green-200 text-green-800',
  },
} as const;

const STATUS_OPTIONS = [
  { value: 'active', label: '사용중' },
  { value: 'inactive', label: '비활성화' },
  { value: 'suspended', label: '휴직중' },
];

export default function MemberList({ member, onRefresh }: { member: any; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(member.user_status);
  const initialStatus = member.user_status;
  const [userLevel, setUserLevel] = useState(member.user_level);
  const initialUserLevel = member.user_level;

  const { user_id } = useUser();
  const { addAlert } = useAppAlert();
  const [saving, setSaving] = useState(false);

  const profileImageUrl = member.profile_image
    ? member.profile_image.startsWith('http')
      ? member.profile_image
      : `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${member.profile_image}`
    : null;

  const avatarFallback = useMemo(() => {
    return getAvatarFallback(member.user_id);
  }, [member.user_id]);
  const badge = STATUS_BADGE_MAP[member.user_status as keyof typeof STATUS_BADGE_MAP];

  const roleIcon = useMemo(() => {
    if (member.user_level === 'admin') return <Pin className="h-6 w-6" />;
    if (member.user_level === 'manager') return <Manager className="h-6 w-6" />;
    return null;
  }, [member.user_level]);

  const handleSave = async () => {
    if (status === initialStatus && userLevel === initialUserLevel) return;

    try {
      setSaving(true);

      await updateMemberStatus({
        user_id: member.user_id,
        status,
        user_level: userLevel,
      });

      setOpen(false);
      onRefresh();

      addAlert({
        title: '정보 변경 완료',
        message: `
          <p class="text-center">
            <span class="font-bold text-primary-blue-500">
              ${member.user_name}
            </span> 님의 정보가 수정되었습니다.
          </p>
        `,
        icon: <CheckCircle />,
        duration: 3000,
      });
    } catch (e) {
      console.error('정보 변경 실패', e);

      addAlert({
        title: '정보 변경 실패',
        message: '정보 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
        icon: <OctagonAlert />,
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ===== 카드 ===== */}
      <div className="relative w-full rounded-xl border border-gray-300 px-5 py-8 pb-7 max-lg:px-3 max-lg:pb-5">
        <div className="absolute top-2.5 right-4">
          <Button size="xs" variant="outline" className="border-0 shadow-none" onClick={() => setOpen(true)}>
            <Ellipsis className="size-4" />
          </Button>
        </div>

        <div className="flex max-lg:flex-col">
          <div className="mr-5 flex flex-col items-center max-lg:mr-0">
            <div className="mb-2.5 aspect-square w-18 overflow-hidden rounded-full bg-gray-300">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={member.user_name} className="h-full w-full object-cover" />
              ) : (
                <div className="bg-primary-blue-100 flex h-full w-full items-center justify-center font-bold text-black **:text-2xl">
                  {avatarFallback}
                </div>
              )}
            </div>
            {/* inactive / suspended만 뱃지 */}
            {badge && <Badge className={badge.className}>{badge.label}</Badge>}

            {/* 권한 아이콘 (admin / manager) */}
            {roleIcon && <div className="mt-1">{roleIcon}</div>}
          </div>

          <div className="min-w-0 flex-1">
            <div className="border-b border-gray-200 pb-3 max-lg:text-center max-md:mb-3">
              <p className="mb-0.5 truncate font-bold">
                {member.user_name} <br className="hidden max-lg:block" />
                {member.user_name_en && (
                  <>
                    <span className="hidden lg:inline"> / </span>
                    <span>{member.user_name_en}</span>
                  </>
                )}
              </p>
              <p className="text-[13px] text-gray-500">{member.job_role}</p>
            </div>

            <div className="pt-4 text-sm max-lg:pt-0">
              <p className="mb-1 flex w-full min-w-0 items-center">
                <Mail className="mr-2.5 size-4 shrink-0 max-lg:size-3" />
                <span className="truncate">{member.user_id}</span>
              </p>
              {member.phone && (
                <p className="flex w-full min-w-0 items-center truncate">
                  <Phone className="mr-2.5 size-4 shrink-0 max-lg:size-3" />
                  <span className="truncate">{member.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 상세 다이얼로그 ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-lg max-lg:w-[400px] max-lg:max-w-[calc(100%-var(--spacing)*8)]">
          <DialogHeader></DialogHeader>

          <div className="space-y-6">
            {/* 프로필 */}
            <div className="flex flex-col items-center gap-y-3 text-center">
              {profileImageUrl ? (
                <img src={profileImageUrl} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="bg-primary-blue-100 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-black">
                  {avatarFallback}
                </div>
              )}

              <div>
                <p className="font-medium">
                  {member.user_name} {member.user_name_en}
                </p>
                <p className="text-sm text-gray-500">{member.job_role}</p>
              </div>
            </div>
            {/* 기본 정보 */}
            <ul className="[&>li]: space-y-2 text-[13px] [&>li]:mb-2.5 [&>li]:flex [&>li]:rounded-md [&>li]:bg-gray-200 [&>li]:px-4 [&>li]:py-3 [&>li>span:first-child]:inline-block [&>li>span:first-child]:w-25 [&>li>span:first-child]:shrink-0 [&>li>span:first-child]:font-medium [&>li>span:last-child]:text-gray-800">
              <li>
                <span>이메일</span>
                <span>{member.user_id}</span>
              </li>
              <li>
                <span>팀</span>
                <span> {member.team_name}</span>
              </li>
              <li>
                <span>휴대폰</span>
                <span>{member.phone}</span>
              </li>
              <li>
                <span>주소</span>
                <span>{member.address}</span>
              </li>
              <li>
                <span>비상연락망</span>
                <span>{member.emergency_phone}</span>
              </li>
              <li>
                <span>상태</span>
                <span className="block w-full">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger
                      className={cn(
                        'h-full! w-full border-0 bg-transparent p-0 text-[13px]! shadow-none [&]:hover:bg-transparent',
                        status !== initialStatus && 'text-primary-blue'
                      )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} size="sm">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
              </li>
              <li>
                <span>권한</span>
                <span className="block w-full">
                  <Select value={userLevel} onValueChange={(v: any) => setUserLevel(v)}>
                    <SelectTrigger
                      className={cn(
                        'h-full! w-full border-0 bg-transparent p-0 text-[13px]! shadow-none [&]:hover:bg-transparent',
                        userLevel !== initialUserLevel && 'text-primary-blue'
                      )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user" size="sm">일반사용자</SelectItem>
                      <SelectItem value="manager" size="sm">관리자(팀장)</SelectItem>
                      <SelectItem value="admin" size="sm">최고관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </span>
              </li>
            </ul>
            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)} size="sm">
                취소
              </Button>
              <Button onClick={handleSave} size="sm">
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
