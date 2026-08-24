// src/api/admin/member.ts
import { http } from '@/lib/http';

export type RegisterMemberPayload = {
  user_id: string;
  user_name: string;
  user_level: 'user' | 'manager' | 'cellmanager' | 'admin';
  team_id: number;
  user_status: 'active' | 'inactive' | 'suspended';
  user_name_en?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  job_role?: string;
  emergency_phone?: string;
  profile_image?: string;
  profile_image_url?: string;
  branch?: string;
  nfc_card?: string;
};

export async function registerMember(data: RegisterMemberPayload) {
  return http<{ message: string }>('/admin/member/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
