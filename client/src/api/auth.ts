// src/api/auth.ts
import { http } from '@/lib/http';

export type LoginPayload = { user_id: string; user_pw: string };
export type LoginResponse = {
  message: string;
  user: {
    user_id: string;
    user_name: string;
    team_id?: number;
    user_level: string;
    user_status: string;
    profile_image?: string | null;
  };
};

// Login 테이블 조회 API
export async function loginApi(payload: LoginPayload) {
  return http<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logoutApi() {
  return http<{ message: string }>('/logout', { method: 'POST' });
}
