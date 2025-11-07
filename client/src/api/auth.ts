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
  user_level?: 'staff' | 'user' | 'manager' | 'admin';
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

/* mypage */
// 프로필 조회
export async function getMyProfile(): Promise<UserDTO> {
  const dto = await http<{ base: any; detail: any }>('/mypage/profile', { method: 'POST', body: JSON.stringify({}) });
  const merged: UserDTO = {
    ...dto.base,
    ...dto.detail,
  };
  return merged;
}

// 계좌 목록
export type BankAccount = {
  seq: number;
  flag: string;
  user_id: string;
  bank_name: string; //예금주
  bank_account: string; //계좌 번호
  account_alias: string; // 계좌 별명
  account_name: string; // 예금주
  wdate: string;
};

export async function getMyAccounts(): Promise<BankAccount[]> {
  const dto = await http<any[]>('/mypage/account/list', { method: 'POST' });
  return dto.map((acc) => ({
    seq: acc.seq,
    flag: acc.flag,
    user_id: acc.user_id,
    bank_name: acc.bank_name,
    bank_account: acc.bank_account,
    account_alias: acc.account_alias,
    account_name: acc.account_name,
    wdate: acc.wdate,
  }));
}

//은행 코드 조회
export interface BankCode {
  code: string;
  name: string;
}
export async function getBankCodes(): Promise<BankCode[]> {
  const res = await http<any[]>('/user/common/codeList?ctype=bank', { method: 'GET' });

  // 서버 응답: [{ code: { code, name } }, ... ]
  return res.map((item) => ({
    code: item.code.code,
    name: item.code.name,
  }));
}

//계좌 추가 등록
export interface RegisterAccountDTO {
  flag: 'mine' | 'exp';
  account_alias: string; // 계좌 별명
  bank_code: string; // 은행 코드
  bank_name: string; // 은행명
  bank_account: string; // 계좌 번호
  account_name: string; // 예금주
}
export async function registerMyAccount(data: RegisterAccountDTO): Promise<void> {
  console.log('📤 전송 데이터:', data); // 👈 추가
  await http('/mypage/account/register', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
}
