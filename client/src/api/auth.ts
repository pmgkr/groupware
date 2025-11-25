// src/api/auth.ts
import { http } from '@/lib/http';

export type LoginPayload = { user_id: string; user_pw: string };
export type OnboardingPayload = {
  user_id: string;
  user_name?: string;
  user_name_en?: string;
  team_id?: number | null;
  phone?: string | null;
  job_role?: string | null;
  birth_date?: string | null;
  hire_date?: string | null;
  address?: string | null;
  emergency_phone?: string | null;
};

export type UserDTO = {
  user_id: string;
  user_name?: string;
  user_name_en?: string;
  team_id?: number | null;
  team_name?: number | null;
  phone?: string | null;
  job_role?: string | null;
  birth_date?: string | null;
  hire_date?: string | null;
  profile_image?: string | null;
  user_level?: 'user' | 'manager' | 'admin';
  user_status?: 'active' | 'inactive' | 'suspended';
  branch?: string | null;
  address?: string | null;
  emergency_phone?: string | null;
};

// Login 테이블 조회 API
export async function loginApi(payload: LoginPayload) {
  return http<{ message: string; accessToken: string; user: UserDTO }>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function onboardingApi(payload: OnboardingPayload, token: string) {
  return http<{ message: string; accessToken: string; user: UserDTO }>('/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUser() {
  return http<UserDTO>('/user/profile', { method: 'GET' });
}

export async function logoutApi() {
  return http<{ message: string }>('/user/logout', { method: 'POST' });
}
