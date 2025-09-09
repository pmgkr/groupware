// src/api/auth.ts
import { http } from '@/lib/http';

export type LoginPayload = { user_id: string; user_pw: string };
export type UserDTO = {
  user_id: string;
  user_name?: string;
  user_name_en?: string;
  team_id?: number | null;
  phone?: string | null;
  job_role?: string | null;
  profile_image?: string | null;
  user_level?: 'staff' | 'manager' | 'admin';
  user_status?: 'active' | 'inactive' | 'suspended';
};

// Login 테이블 조회 API
export async function loginApi(payload: LoginPayload) {
  return http<{ message: string; accessToken: string; user: UserDTO }>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUser() {
  return http<{ user: UserDTO }>('/user', { method: 'GET' });
}

export async function logoutApi() {
  return http<{ message: string }>('/logout', { method: 'POST' });
}
