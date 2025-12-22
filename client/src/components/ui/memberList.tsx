import { useState } from 'react';
import { Ellipsis, Mail, Phone } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { getImageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { updateMemberStatus } from '@/api/manager/member';
import { cn } from '@/lib/utils';

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

  const profileImageUrl = (() => {
    if (member.profile_image) {
      if (member.profile_image.startsWith('http')) return member.profile_image;
      return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${member.profile_image}`;
    }
    return getImageUrl('dummy/profile');
  })();

  const badge = STATUS_BADGE_MAP[member.user_status as keyof typeof STATUS_BADGE_MAP];

  const handleSave = async () => {
    try {
      await updateMemberStatus({
        user_id: member.user_id,
        status: status,
      });

      // TODO: 상위 리스트 상태 즉시 반영
      setOpen(false);
    } catch (e) {
      console.error('상태 변경 실패', e);
    }
  };

  return (
    <>
      {/* ===== 카드 ===== */}
      <div className="relative w-full rounded-xl border border-gray-300 px-5 py-8 pb-7">
        <div className="absolute top-2.5 right-4">
          <Button size="xs" variant="outline" className="border-0 shadow-none" onClick={() => setOpen(true)}>
            <Ellipsis className="size-4" />
          </Button>
        </div>

        <div className="flex">
          <div className="mr-5 flex flex-col items-center">
            <div className="mb-2.5 aspect-square w-18 overflow-hidden rounded-full bg-gray-300">
              <img
                src={profileImageUrl}
                alt={member.user_name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getImageUrl('dummy/profile');
                }}
              />
            </div>

            {/* inactive / suspended만 뱃지 */}
            {badge && <Badge className={badge.className}>{badge.label}</Badge>}
          </div>

          <div className="flex-1">
            <div className="border-b border-gray-200 pb-3">
              <p className="mb-0.5 font-bold">
                {member.user_name}
                {member.user_name_en && ` / ${member.user_name_en}`}
              </p>
              <p className="text-[13px] text-gray-500">{member.job_role}</p>
            </div>

            <div className="pt-4 text-sm">
              <p className="mb-1 flex items-center">
                <Mail className="mr-2.5 size-4" />
                {member.user_id}
              </p>
              {member.phone && (
                <p className="flex items-center">
                  <Phone className="mr-2.5 size-4" />
                  {member.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 상세 다이얼로그 ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader></DialogHeader>

          <div className="space-y-6">
            {/* 프로필 */}
            <div className="flex flex-col items-center gap-y-3 text-center">
              <img src={profileImageUrl} className="h-20 w-20 rounded-full object-cover" />
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
