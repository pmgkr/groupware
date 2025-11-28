import { http } from '@/lib/http';

export type User = {
  user_id: string;
  user_name: string;
  user_name_en: string;
  team_id: number;
  phone: string;
  job_role: string;
  profile_image: string;
  user_level: string;
  user_status: string;
  birth_date: string;
  hire_date: string;
  ms_key: string;
};

export const getUserProfile = async (user_id: string): Promise<User> => {
  const response = await http<User>(`/user/profile`, { method: 'GET' });
  return response;
};
