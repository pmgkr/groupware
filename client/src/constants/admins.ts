// /constants/admins.ts
// 어드민 권한이 있는 유저아이디 리스트
export const adminUserIds = [
  'sangmin.kang@pmgasia.com',
  'jihyo.kim@pmgasia.com',
  'kangho.kim@pmgasia.com',
  'yeaji.kim@pmgasia.com',
] as const;

// 접속한 유저가 어드민 권한이 있는지 확인
export const isAdminUser = (userId: string | undefined): boolean => !!userId && (adminUserIds as readonly string[]).includes(userId);
