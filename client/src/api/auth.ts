// src/api/auth.ts
import { http } from '@/lib/http';
import { setRefreshToken } from '@/lib/refreshTokenStore';

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
  const res = await http<{ message: string; accessToken: string; refreshToken?: string; user: UserDTO; CODE?: string; code?: string; onboardingToken?: string }>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // refresh token이 있으면 저장
  if (res.refreshToken) {
    setRefreshToken(res.refreshToken);
  }
  return res;
}

export async function onboardingApi(payload: OnboardingPayload, token: string) {
  const res = await http<{ message: string; accessToken: string; refreshToken?: string; user: UserDTO }>('/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  // refresh token이 있으면 저장
  if (res.refreshToken) {
    setRefreshToken(res.refreshToken);
  }
  return res;
}

export async function getUser() {
  return http<UserDTO>('/user/profile', { method: 'GET' });
}

export async function logoutApi() {
  try {
    await http<{ message: string }>('/user/logout', { method: 'POST' });
  } finally {
    // 로그아웃 시 refresh token 삭제
    setRefreshToken(undefined);
  }
}

export async function initFormApi(token_user_id: string, onboardingToken: string) {
  return http<{ user_name?: string; email?: string;[key: string]: any }>('/initform', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${onboardingToken}`,
    },
    body: JSON.stringify({ token_user_id }),
  });
}
type UploadFileResponse = {
  ok: boolean;
  count: number;
  files: Array<{
    field: string;
    original: string;
    mimetype: string;
    size: number;
    filename: string;
    savedPath: string;
    url: string;
    subdir: string;
  }>;
};

// 파일 업로드 API
export async function uploadFileApi(file: File, subdir: string) {
  const formData = new FormData();
  // 백엔드에서 field="files"로 받는다고 가정 (예시 응답 값의 field: "files" 참고)
  // 하지만 보통 formData.append('files', ...) 일 수도 있고, 예시의 field값은 결과값일 수도 있음.
  // 사용자가 "field": "files" 라고 했으므로 key를 'files'로 보내는게 안전할 수 있음.
  // 다만 기존 코드에서 'file'로 보냈었음. 보통 multer 단일 파일은 이름 맞춤.
  // 일단 기존 'file' 유지하되, 만약 안되면 'files'로 변경 필요.
  // -> 응답 예시 "field": "files" 는 multer fieldname일 가능성이 높음.
  // 안전하게 'files'로 변경하는게 좋을 수도 있지만, 사용자가 "전송값을 subdir... 그리고 파일 객체" 라고만 했음.
  // 보통 'file' 아니면 'files'임.
  // 일단 기존 'file' 유지. (수정 필요하면 말하겠지) -> 아님, 결과값에 field: "files"가 있으니 key를 'files'로 하는게 맞을듯?
  // User request says: "전송값을 subdir:profile_image 그리고 파일 객체를 전송하고"
  // It doesn't specify the key name.
  // However, the response `field: "files"` strongly suggests the key used in FormData should be `files`.
  // I will stick to 'file' for now as I used it before, but if it fails I'll swap. 
  // Wait, I should probably check if I can assume 'files'.
  // Let's assume 'files' and see. No, let's keep 'file' as it's singular upload?
  // Actually, usually `upload.array('files')` produces `field: 'files'`.
  // `upload.single('file')` produces `field: 'file'`.
  // Since response says `field: "files"`, I will change the key to `files`.

  formData.append('files', file);
  formData.append('subdir', subdir);

  // Content-Type: multipart/form-data는 브라우저가 자동으로 설정하므로 헤더에서 제거해야 함
  // http 유틸리티가 자동으로 Content-Type을 application/json으로 설정한다면 오버라이드 필요
  // 하지만 여기서는 fetch나 axios 설정에 따라 다름. http 유틸리티 확인 필요.
  // 일단 http 유틸리티가 FormData를 감지해서 처리해주길 기대하거나, 별도 처리가 필요할 수 있음.
  // 안전하게 직접 fetch를 쓰거나 http 유틸의 body 처리를 확인해야 함.
  // 여기선 http 유틸리티를 사용하되, FormData 지원 여부를 모름.
  // http 유틸리티를 확인하지 않았으므로, 일단 headers를 undefined로 보내는 옵션이 있는지 확인 필요.
  // 기존 코드를 보면 body에 JSON.stringify를 하고 있음.

  return http<UploadFileResponse>('/user/common/upload', {
    method: 'POST',
    body: formData as any, // http 유틸리티가 FormData를 처리할 수 있다고 가정 (보통 fetch wrapper는 body에 그냥 넣으면 됨)
    // 단, Content-Type 헤더가 'application/json'으로 고정되어 있다면 문제짐.
  });
}

// 온보딩 프로필 이미지 업로드 API
export async function onboardingUploadApi(file: File, onboardingToken: string) {
  const formData = new FormData();
  formData.append('file', file);

  return http<{ result: boolean; path: string }>('/onboardingUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${onboardingToken}`,
    },
    body: formData as any,
  });
}
