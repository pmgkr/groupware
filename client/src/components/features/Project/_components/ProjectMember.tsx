import { getAvatarFallback, getProfileImageUrl } from '@/utils';
import { type ProjectMemberDTO } from '@/api';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';

import { Badge } from '@components/ui/badge';

type ProjectMemberProps = {
  member: ProjectMemberDTO;
};

export const ProjectMember = ({ member }: ProjectMemberProps) => {
  return (
    <>
      <Avatar className="size-10">
        <AvatarImage src={getProfileImageUrl(member.profile_image)} />
        <AvatarFallback>{getAvatarFallback(member.user_id)}</AvatarFallback>
      </Avatar>
      <div className="text-base leading-[1.3] text-gray-800">
        <strong>{member.user_nm}</strong>
        <span className="block text-[.8em] break-all text-gray-500">{member.user_id}</span>
      </div>
      <Badge variant={member.user_type === 'owner' ? 'secondary' : 'grayish'} className="ml-auto">
        {member.user_type === 'owner' ? 'Owner' : 'Member'}
      </Badge>
    </>
  );
};
