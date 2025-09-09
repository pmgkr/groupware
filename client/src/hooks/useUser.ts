import { useAuth } from '@/contexts/AuthContext';
import type { UserDTO } from '@/api/auth'; // 이미 있는 타입 사용

/**
 * AuthContext에서 user 데이터를 안전하게 꺼내는 커스텀 훅
 * null일 경우 빈 객체 반환 → 구조 분해 할당 시 안전
 */
export function useUser(): Partial<UserDTO> {
  const { user } = useAuth();
  return user ?? {};
}
