import { getImageUrl } from '@/utils';

/**
 * 프로필 이미지 URL 변환 헬퍼
 * - 절대 URL이면 그대로 사용
 * - 파일명만 있으면 업로드 경로 prefix
 * - 값이 없으면 더미 이미지 반환
 */
export function getProfileImageUrl(image?: string) {
  if (!image) return getImageUrl('dummy/profile');
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${image}`;
}

