// User ID를 가져와서 AvatarFallback용으로 정제
export function getAvatarFallback(user_id: string): string {
  if (!user_id || typeof user_id !== 'string') return '??';

  const [idPart] = user_id.split('@'); // '@' 앞부분 추출
  if (!idPart) return '??';

  if (idPart.includes('.')) {
    // 예: gildong.hong → ['gildong', 'hong'] → ['g', 'h'] → 'GH'
    const parts = idPart.split('.');
    const initials = parts.map((p) => p.charAt(0).toUpperCase()).join('');
    return initials.slice(0, 2); // 혹시 여러 점 있을 때 앞 두 글자만
  } else {
    // 예: gildong → 'GI'
    return idPart.slice(0, 2).toUpperCase();
  }
}
