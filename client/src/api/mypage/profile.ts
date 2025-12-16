// src/api/mypage/profile.ts
import { http } from '@/lib/http';
import { uploadFilesToServer } from '@/api/common/upload';

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
  // 클라우드에 파일 업로드
  const uploaded = await uploadFilesToServer([file], subdir);
  const f = uploaded[0];

  // 백엔드에 URL 저장
  const payload = {
    image_name: f.url, //백엔드가 기대하는 필드명: image_name
  };

  //console.log('🔥 백엔드로 전송하는 payload:', payload);

  const response = await http<{ result: string; image_name: string }>('/mypage/profile/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
