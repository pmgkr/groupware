import { Ellipsis, Mail, Phone } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { getImageUrl } from '@/utils';

const STATUS_MAP = {
  active: {
    label: 'Enable',
    className: 'bg-green-500',
  },
  unactive: {
    label: 'Disable',
    className: 'bg-gray-400',
  },
} as const;

export default function MemberList({ member }: { member: any }) {
  const status = STATUS_MAP[member.user_status as keyof typeof STATUS_MAP];

  const profileImageUrl = (() => {
    if (member.profile_image) {
      if (member.profile_image.startsWith('http')) {
        // 클라우드 주소
        return member.profile_image;
      }
      // 기존 서버에 저장된 파일
      return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${member.profile_image}`;
    }
    // 기본 더미 이미지
    return getImageUrl('dummy/profile');
  })();
  return (
    <div className="relative w-[347px] rounded-xl border border-gray-300 px-5 py-8">
      <div className="absolute top-2.5 right-4">
        <Button size="xs" variant="outline" className="border-0 shadow-none">
          <Ellipsis className="size-4" />
        </Button>
      </div>

      <div className="flex">
        <div className="mr-5 flex flex-col items-center">
          <div className="mb-2.5 aspect-square w-18 overflow-hidden rounded-full bg-gray-300">
            {member.profile_image && <img src={profileImageUrl} alt={member.user_name} className="h-full w-full object-cover" />}
          </div>

          {status && <Badge className={status.className}>{status.label}</Badge>}
        </div>

        <div className="flex-1">
          <div className="border-b border-gray-200 pb-3">
            <p className="mb-0.5 font-bold">
              {member.user_name} / {member.user_name_en}
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
  );
}
