// src/api/mypage.ts
import { http } from '@/lib/http';
import type { StringFormatParams } from 'zod/v4/core';
import { uploadFilesToServer } from './common';

/* mypage */
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



// 프로필 조회
export async function getMyProfile(): Promise<UserDTO> {
  const dto = await http<{ base: any; detail: any }>('/mypage/profile', { method: 'POST', body: JSON.stringify({}) });
  const merged: UserDTO = {
    ...dto.base,
    ...dto.detail,
  };
  return merged;
}

//프로필 수정
export async function editMyProfile(data: {
  birth_date: string;
  hire_date: string;
  address: string;
  emergency_phone: string;
  phone: string;
}) {
  return http(`/mypage/profile/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

//프로필 이미지 수정
export async function uploadProfileImage(file: File, subdir = 'mypage') {
  const uploaded = await uploadFilesToServer([file], subdir);
  const f = uploaded[0];

  await http('/mypage/profile/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_name: f.sname,
    }),
  });
  return f;
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
  const res = await http<{ code: { code: string; name: string } }[]>('/user/common/codeList?ctype=bank', { method: 'GET' });

  // 서버 응답: [{ code: { code, name } }, ... ]
  return res.map((item) => ({
    code: item.code.code,
    name: item.code.name,
  }));
}

//계좌 추가 등록
export interface RegisterAccountDTO {
  //flag: 'mine' | 'exp';
  flag: string;
  account_alias: string; // 계좌 별명
  bank_name: string; // 은행명
  bank_account: string; // 계좌 번호
  account_name: string; // 예금주
}



export async function registerAccount(data: RegisterAccountDTO): Promise<void> {
  await http('/mypage/account/register', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
}

//계좌 수정
export async function updateAccount(seq: number, dto: any) {
  return http(`/mypage/account/update`, {
    method: 'POST',
    body: JSON.stringify({ ...dto, seq }),
    headers: { 'Content-Type': 'application/json' },
  });
}

//계좌 삭제
export async function deleteAccount(seq: number) {
  return http(`/mypage/account/delete/${seq}`, {
    method: 'DELETE',
  });
}



/* 휴가 내역 */
export type MyVacationSummary = {
  id: number;
  va_year: number;
  va_used: number;
  va_current: number;
  va_carryover: number;
  va_comp: number;
  va_long: number;
};

export type MyVacationItem = {
  sch_id: number;
  v_year: string;
  v_type: string;
  v_count: number;
  sdate: string;
  edate: string;
  remark: string;
  wdate: string;
};

export async function MyVacationHistory(vyear: number): Promise<MyVacationItem[]> {
  const res = await http<{ summary: MyVacationSummary[]; lists: MyVacationItem[] }>(`/mypage/vacation?vyear=${vyear}`, { method: 'GET' });
  return res.lists || [];
}


/* 추가근무 내역 */
export type MyOvertimeSummary ={
  total: number;
  page: number;
  size: number;
  pages: number;
}
export type MyOvertimeItem = {
  id: number;
  user_id: string;
  user_name: string;
  team_id: number;
  ot_type: string;
  ot_date: string;
  ot_stime: string | null;
  ot_etime: string | null;
  ot_hours: string;
  ot_food: string | null;
  ot_trans: string | null;
  ot_reward: string;
  ot_client: string;
  ot_description: string;
  ot_status: string;
  ot_created_at: string;
  ot_modified_at: string;
}
export async function MyOvertimeHistory(page: number, size: number, vyear: number = new Date().getFullYear(), user_id: string = ''): Promise<{ total: number; page: number; size: number; pages: number; items: MyOvertimeItem[] }> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  if (vyear) queryParams.append('vyear', vyear.toString());
  if (user_id) queryParams.append('user_id', user_id);
  
  const res = await http<{ total: number; page: number; size: number; pages: number; items: MyOvertimeItem[] }>(`/mypage/overtime?${queryParams.toString()}`, { method: 'GET' });
  return res;
}