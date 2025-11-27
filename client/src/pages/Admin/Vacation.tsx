import UserList, { type UserListItem } from '@/components/features/Vacation/userList';

interface VacationProps {
  data?: UserListItem[];
}

export default function Vacation({ data = [] }: VacationProps) {

  return (
    <UserList 
      data={data}
    />
  );
} 